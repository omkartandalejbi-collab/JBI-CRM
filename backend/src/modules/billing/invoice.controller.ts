import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../prisma.js';
import { generateInvoicePDF, InvoiceItem } from './invoicePdf.service.js';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  amount: z.number(),
});

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email().optional().nullable().or(z.literal('')),
  clientPhone: z.string().optional().nullable(),
  clientAddress: z.string().optional().nullable(),
  invoiceDate: z.string().min(10, 'Invoice date is required (YYYY-MM-DD)'),
  dueDate: z.string().min(10, 'Due date is required (YYYY-MM-DD)'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).default(18),
  taxAmount: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  status: z.enum(['Pending', 'Paid', 'Cancelled']).default('Pending'),
  notes: z.string().optional().nullable(),
});

/**
 * Get next suggested invoice number
 */
export const getNextInvoiceNumber = async (_req: Request, res: Response): Promise<void> => {
  try {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const nextNum = String(count + 1).padStart(4, '0');
    const invoiceNumber = `INV-${year}-${nextNum}`;

    res.status(200).json({ success: true, invoiceNumber });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to generate invoice number.' });
  }
};

/**
 * Create a new Invoice (Admin only)
 */
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Only Admins can create invoices.' });
      return;
    }

    const parseResult = createInvoiceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const data = parseResult.data;

    // Check invoice number uniqueness
    const existing = await prisma.invoice.findUnique({
      where: { invoiceNumber: data.invoiceNumber },
    });
    if (existing) {
      res.status(400).json({
        success: false,
        message: `Invoice number '${data.invoiceNumber}' already exists. Please use a unique number.`,
      });
      return;
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        clientPhone: data.clientPhone || null,
        clientAddress: data.clientAddress || null,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        itemsJson: JSON.stringify(data.items),
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        discount: data.discount,
        totalAmount: data.totalAmount,
        status: data.status,
        notes: data.notes || null,
        createdById: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully.',
      data: {
        ...invoice,
        items: JSON.parse(invoice.itemsJson),
      },
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    res.status(500).json({ success: false, message: 'Failed to create invoice.' });
  }
};

/**
 * List all invoices (Admin and CA)
 */
export const getAllInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, startDate, endDate } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'All') {
      where.status = status;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { clientName: { contains: search } },
        { invoiceNumber: { contains: search } },
        { clientEmail: { contains: search } },
      ];
    }
    if (startDate && typeof startDate === 'string') {
      where.invoiceDate = { gte: startDate };
    }
    if (endDate && typeof endDate === 'string') {
      where.invoiceDate = { ...(where.invoiceDate || {}), lte: endDate };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    const parsedInvoices = invoices.map((inv) => ({
      ...inv,
      items: JSON.parse(inv.itemsJson),
    }));

    res.status(200).json({
      success: true,
      data: parsedInvoices,
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices.' });
  }
};

/**
 * Get single invoice by ID (Admin and CA)
 */
export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...invoice,
        items: JSON.parse(invoice.itemsJson),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoice.' });
  }
};

/**
 * Download Invoice PDF (Accessible by Admin and CA)
 */
export const downloadInvoicePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const items: InvoiceItem[] = JSON.parse(invoice.itemsJson);

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientPhone: invoice.clientPhone,
      clientAddress: invoice.clientAddress,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      items,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discount: invoice.discount,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      notes: invoice.notes,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF download error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
};

/**
 * Update Invoice status or details (Admin only)
 */
export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Only Admins can modify invoices.' });
      return;
    }

    const { id } = req.params as { id: string };
    const { status, notes, dueDate } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(dueDate ? { dueDate } : {}),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully.',
      data: {
        ...invoice,
        items: JSON.parse(invoice.itemsJson),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update invoice.' });
  }
};
