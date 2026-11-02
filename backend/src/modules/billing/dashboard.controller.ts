import { Request, Response } from 'express';
import prisma from '../../prisma.js';

export const getBillingDashboardMetrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    // ---------------------------------------------
    // ONE-TIME INVOICES AGGREGATIONS
    // ---------------------------------------------
    const allInvoices = await prisma.invoice.findMany({
      orderBy: { invoiceDate: 'desc' },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    const parsedInvoices = allInvoices.map((inv) => ({
      ...inv,
      items: JSON.parse(inv.itemsJson),
    }));

    let oneTimeTotalRevenue = 0; // Total from Paid invoices
    let oneTimeTotalBilled = 0; // Total of all generated invoices
    let oneTimePendingRevenue = 0; // Total from Pending invoices
    let oneTimePaidCount = 0;
    let oneTimePendingCount = 0;

    for (const inv of allInvoices) {
      oneTimeTotalBilled += inv.totalAmount;
      if (inv.status === 'Paid') {
        oneTimeTotalRevenue += inv.totalAmount;
        oneTimePaidCount++;
      } else if (inv.status === 'Pending') {
        oneTimePendingRevenue += inv.totalAmount;
        oneTimePendingCount++;
      }
    }

    // ---------------------------------------------
    // RECURRING CLIENTS & METRICS
    // ---------------------------------------------
    const recurringClients = await prisma.recurringClient.findMany({
      include: {
        monthRecords: {
          orderBy: { month: 'desc' },
          include: {
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
        rateHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    let recurringTotalPending = 0;
    let recurringClientsWithPending = 0;

    const formattedRecurringClients = recurringClients.map((client) => {
      const latestMonth = client.monthRecords[0];
      const pendingAmount = latestMonth ? latestMonth.remainingPending : client.currentMonthlyAmount;

      recurringTotalPending += Math.max(0, pendingAmount);
      if (pendingAmount > 0) {
        recurringClientsWithPending++;
      }

      return {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        monthlyAmount: client.currentMonthlyAmount,
        billingStartMonth: client.billingStartMonth,
        status: client.status,
        latestMonth: latestMonth?.month || client.billingStartMonth,
        currentPending: pendingAmount,
        hasPendingBalance: pendingAmount > 0,
        monthRecordsCount: client.monthRecords.length,
        rateHistoryCount: client.rateHistory.length,
      };
    });

    // ---------------------------------------------
    // MONTH-WISE RECURRING AGGREGATIONS (Billed vs Collected vs Pending)
    // ---------------------------------------------
    const allMonthRecords = await prisma.recurringMonthRecord.findMany({
      orderBy: { month: 'asc' },
    });

    const monthMap: Record<string, { month: string; billed: number; collected: number; pending: number }> = {};
    for (const rec of allMonthRecords) {
      if (!monthMap[rec.month]) {
        monthMap[rec.month] = {
          month: rec.month,
          billed: 0,
          collected: 0,
          pending: 0,
        };
      }
      monthMap[rec.month].billed += rec.billAmount;
      monthMap[rec.month].collected += rec.amountPaid;
      monthMap[rec.month].pending += rec.remainingPending;
    }

    const monthWiseStats = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // Grand totals
    let recurringTotalCollected = 0;
    let recurringTotalBilled = 0;
    for (const stat of monthWiseStats) {
      recurringTotalCollected += stat.collected;
      recurringTotalBilled += stat.billed;
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          // Combined Overall Revenue
          totalRevenueCollected: oneTimeTotalRevenue + recurringTotalCollected,
          totalPendingBalances: oneTimePendingRevenue + recurringTotalPending,

          // One-Time Invoice Specifics
          oneTime: {
            totalBilled: oneTimeTotalBilled,
            totalRevenue: oneTimeTotalRevenue,
            pendingRevenue: oneTimePendingRevenue,
            totalCount: allInvoices.length,
            paidCount: oneTimePaidCount,
            pendingCount: oneTimePendingCount,
          },

          // Recurring Specifics
          recurring: {
            totalClients: recurringClients.length,
            clientsWithPending: recurringClientsWithPending,
            totalPending: recurringTotalPending,
            totalBilled: recurringTotalBilled,
            totalCollected: recurringTotalCollected,
          },
        },
        recentInvoices: parsedInvoices.slice(0, 10),
        recurringClients: formattedRecurringClients,
        monthWiseStats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch billing dashboard metrics.' });
  }
};
