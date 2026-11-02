export type Role = 'Admin' | 'HOD' | 'Employee' | 'CA';
export type Department = 'Engineering' | 'Sales' | 'Marketing' | 'Operations';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: Department | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string | null;
  status: string;
  notes?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    department: Department | null;
  };
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Cancelled';
  notes?: string | null;
  createdById: string;
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface RecurringPayment {
  id: string;
  clientId: string;
  monthRecordId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface RecurringMonthRecord {
  id: string;
  clientId: string;
  month: string;
  billAmount: number;
  previousPending: number;
  totalDue: number;
  amountPaid: number;
  remainingPending: number;
  status: 'Pending' | 'Partial' | 'Paid';
  notes?: string | null;
  payments?: RecurringPayment[];
}

export interface RecurringRateHistory {
  id: string;
  clientId: string;
  previousAmount: number;
  newAmount: number;
  effectiveMonth: string;
  reason?: string | null;
  createdAt: string;
}

export interface RecurringClient {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  currentMonthlyAmount: number;
  monthlyAmount?: number;
  billingStartMonth: string;
  status: 'Active' | 'Paused' | 'Inactive';
  latestMonth?: string;
  currentPending?: number;
  hasPendingBalance?: boolean;
  rateHistory?: RecurringRateHistory[];
  monthRecords?: RecurringMonthRecord[];
}

export interface DashboardMetrics {
  summary: {
    totalRevenueCollected: number;
    totalPendingBalances: number;
    oneTime: {
      totalBilled: number;
      totalRevenue: number;
      pendingRevenue: number;
      totalCount: number;
      paidCount: number;
      pendingCount: number;
    };
    recurring: {
      totalClients: number;
      clientsWithPending: number;
      totalPending: number;
      totalBilled: number;
      totalCollected: number;
    };
  };
  recentInvoices: Invoice[];
  recurringClients: RecurringClient[];
  monthWiseStats: {
    month: string;
    billed: number;
    collected: number;
    pending: number;
  }[];
}
