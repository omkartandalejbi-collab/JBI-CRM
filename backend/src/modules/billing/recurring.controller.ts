import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../prisma.js';

const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  monthlyAmount: z.number().min(0, 'Monthly amount cannot be negative'),
  billingStartMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  notes: z.string().optional().nullable(),
});

const updateRateSchema = z.object({
  newMonthlyAmount: z.number().min(0, 'Monthly amount cannot be negative'),
  effectiveMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  reason: z.string().optional().nullable(),
});

const recordPaymentSchema = z.object({
  amount: z.number().min(1, 'Payment amount must be greater than zero'),
  paymentDate: z.string().min(10, 'Payment date is required (YYYY-MM-DD)'),
  paymentMethod: z.enum(['Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Card']).default('Bank Transfer'),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Helper to get the previous month in 'YYYY-MM' format
 */
const getPreviousMonth = (month: string): string => {
  const [yearStr, monthStr] = month.split('-');
  let year = parseInt(yearStr, 10);
  let m = parseInt(monthStr, 10) - 1;
  if (m === 0) {
    m = 12;
    year -= 1;
  }
  return `${year}-${String(m).padStart(2, '0')}`;
};

/**
 * Helper to get or initialize a client's month record with auto carry-forward
 */
export const getOrInitMonthRecord = async (clientId: string, month: string) => {
  let record = await prisma.recurringMonthRecord.findUnique({
    where: {
      clientId_month: {
        clientId,
        month,
      },
    },
    include: { payments: true },
  });

  if (record) {
    return record;
  }

  // Record doesn't exist yet, fetch client
  const client = await prisma.recurringClient.findUnique({
    where: { id: clientId },
  });
  if (!client) {
    throw new Error('Client not found');
  }

  // Look for the immediate previous month
  const prevMonthStr = getPreviousMonth(month);
  const prevRecord = await prisma.recurringMonthRecord.findUnique({
    where: {
      clientId_month: {
        clientId,
        month: prevMonthStr,
      },
    },
  });

  const previousPending = prevRecord ? Math.max(0, prevRecord.remainingPending) : 0;
  const billAmount = client.currentMonthlyAmount;
  const totalDue = billAmount + previousPending;
  const amountPaid = 0;
  const remainingPending = totalDue;

  record = await prisma.recurringMonthRecord.create({
    data: {
      clientId,
      month,
      billAmount,
      previousPending,
      totalDue,
      amountPaid,
      remainingPending,
      status: 'Pending',
    },
    include: { payments: true },
  });

  return record;
};

/**
 * Propagate pending balance forward to any existing future month records
 */
const propagateForward = async (clientId: string, fromMonth: string, currentRemainingPending: number) => {
  const futureRecords = await prisma.recurringMonthRecord.findMany({
    where: {
      clientId,
      month: { gt: fromMonth },
    },
    orderBy: { month: 'asc' },
  });

  let runningPending = currentRemainingPending;
  for (const rec of futureRecords) {
    const newTotalDue = rec.billAmount + runningPending;
    const newRemainingPending = newTotalDue - rec.amountPaid;
    const newStatus = newRemainingPending <= 0 ? 'Paid' : rec.amountPaid > 0 ? 'Partial' : 'Pending';

    await prisma.recurringMonthRecord.update({
      where: { id: rec.id },
      data: {
        previousPending: runningPending,
        totalDue: newTotalDue,
        remainingPending: newRemainingPending,
        status: newStatus,
      },
    });

    runningPending = Math.max(0, newRemainingPending);
  }
};

/**
 * Add a recurring client (Admin only)
 */
export const addRecurringClient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Admin role required.' });
      return;
    }

    const parseResult = createClientSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const data = parseResult.data;

    const client = await prisma.recurringClient.create({
      data: {
        name: data.name,
        company: data.company || null,
        email: data.email || null,
        phone: data.phone || null,
        currentMonthlyAmount: data.monthlyAmount,
        billingStartMonth: data.billingStartMonth,
        notes: data.notes || null,
      },
    });

    // Record initial rate history
    await prisma.recurringRateHistory.create({
      data: {
        clientId: client.id,
        previousAmount: 0,
        newAmount: data.monthlyAmount,
        effectiveMonth: data.billingStartMonth,
        reason: 'Initial onboarding rate',
      },
    });

    // Automatically initialize month record for start month
    await getOrInitMonthRecord(client.id, data.billingStartMonth);

    res.status(201).json({
      success: true,
      message: 'Recurring client added successfully.',
      data: client,
    });
  } catch (error: any) {
    console.error('Error adding recurring client:', error);
    res.status(500).json({ success: false, message: 'Failed to add recurring client.' });
  }
};

/**
 * Update client's monthly amount with rate history preservation (Admin only)
 */
export const updateClientRate = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Admin role required.' });
      return;
    }

    const { id } = req.params as { id: string };
    const parseResult = updateRateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const { newMonthlyAmount, effectiveMonth, reason } = parseResult.data;

    const client = await prisma.recurringClient.findUnique({ where: { id } });
    if (!client) {
      res.status(404).json({ success: false, message: 'Recurring client not found.' });
      return;
    }

    const previousAmount = client.currentMonthlyAmount;

    // Save history
    await prisma.recurringRateHistory.create({
      data: {
        clientId: client.id,
        previousAmount,
        newAmount: newMonthlyAmount,
        effectiveMonth,
        reason: reason || 'Rate revision',
      },
    });

    // Update client
    const updatedClient = await prisma.recurringClient.update({
      where: { id },
      data: { currentMonthlyAmount: newMonthlyAmount },
    });

    // If month record for effectiveMonth exists or needs update:
    const monthRec = await prisma.recurringMonthRecord.findUnique({
      where: { clientId_month: { clientId: id, month: effectiveMonth } },
    });
    if (monthRec) {
      const newTotalDue = newMonthlyAmount + monthRec.previousPending;
      const newRemaining = newTotalDue - monthRec.amountPaid;
      const newStatus = newRemaining <= 0 ? 'Paid' : monthRec.amountPaid > 0 ? 'Partial' : 'Pending';
      await prisma.recurringMonthRecord.update({
        where: { id: monthRec.id },
        data: {
          billAmount: newMonthlyAmount,
          totalDue: newTotalDue,
          remainingPending: newRemaining,
          status: newStatus,
        },
      });
      await propagateForward(id, effectiveMonth, newRemaining);
    }

    res.status(200).json({
      success: true,
      message: `Monthly amount updated from ₹${previousAmount} to ₹${newMonthlyAmount}. History preserved.`,
      data: updatedClient,
    });
  } catch (error: any) {
    console.error('Update rate error:', error);
    res.status(500).json({ success: false, message: 'Failed to update rate.' });
  }
};

/**
 * Record a payment for a client's monthly entry (Admin only)
 * Partial payments allowed, multiple payments in one month supported!
 */
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Admin role required.' });
      return;
    }

    const { clientId, month } = req.params as { clientId: string; month: string };
    const parseResult = recordPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const { amount, paymentDate, paymentMethod, referenceNumber, notes } = parseResult.data;

    // Ensure month record exists
    const monthRecord = await getOrInitMonthRecord(clientId, month);

    // Create payment entry
    const payment = await prisma.recurringPayment.create({
      data: {
        clientId,
        monthRecordId: monthRecord.id,
        amount,
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
      },
    });

    // Update month record totals
    const newAmountPaid = monthRecord.amountPaid + amount;
    const newRemainingPending = monthRecord.totalDue - newAmountPaid;
    const newStatus = newRemainingPending <= 0 ? 'Paid' : newAmountPaid > 0 ? 'Partial' : 'Pending';

    const updatedMonthRecord = await prisma.recurringMonthRecord.update({
      where: { id: monthRecord.id },
      data: {
        amountPaid: newAmountPaid,
        remainingPending: newRemainingPending,
        status: newStatus,
      },
      include: { payments: true },
    });

    // Propagate change to any future months
    await propagateForward(clientId, month, newRemainingPending);

    res.status(201).json({
      success: true,
      message: `Payment of ₹${amount} recorded successfully.`,
      data: {
        payment,
        monthRecord: updatedMonthRecord,
      },
    });
  } catch (error: any) {
    console.error('Record payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment.' });
  }
};

/**
 * List all recurring clients with current pending and status (Admin and CA)
 */
export const getAllRecurringClients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const clients = await prisma.recurringClient.findMany({
      include: {
        monthRecords: {
          orderBy: { month: 'desc' },
          take: 1, // latest month
        },
        rateHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = clients.map((c) => {
      const latestMonth = c.monthRecords[0];
      return {
        id: c.id,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        currentMonthlyAmount: c.currentMonthlyAmount,
        billingStartMonth: c.billingStartMonth,
        status: c.status,
        latestMonth: latestMonth?.month || c.billingStartMonth,
        currentPending: latestMonth ? latestMonth.remainingPending : c.currentMonthlyAmount,
        lastPaymentDate: latestMonth?.updatedAt || c.updatedAt,
        rateHistoryCount: c.rateHistory.length,
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch recurring clients.' });
  }
};

/**
 * Get detailed month-by-month history for a specific client (Admin and CA)
 */
export const getClientBillingHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const client = await prisma.recurringClient.findUnique({
      where: { id },
      include: {
        rateHistory: { orderBy: { createdAt: 'desc' } },
        monthRecords: {
          orderBy: { month: 'asc' },
          include: {
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
      },
    });

    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch client billing history.' });
  }
};

/**
 * Add / initialize a specific month for a client (Admin only)
 */
export const initClientMonth = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Admin role required.' });
      return;
    }

    const { clientId, month } = req.params as { clientId: string; month: string };
    const record = await getOrInitMonthRecord(clientId, month);

    res.status(200).json({
      success: true,
      message: `Billing month ${month} initialized.`,
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to initialize month.' });
  }
};
