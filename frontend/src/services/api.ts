import axios from 'axios';
import {
  User,
  AttendanceRecord,
  Invoice,
  RecurringClient,
  RecurringMonthRecord,
  DashboardMetrics,
} from '../types/index.js';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor to inject Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jbi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jbi_token');
      localStorage.removeItem('jbi_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
  logout: async () => {
    localStorage.removeItem('jbi_token');
    localStorage.removeItem('jbi_user');
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
  },
};

export const attendanceApi = {
  checkIn: async (): Promise<AttendanceRecord> => {
    const res = await api.post('/attendance/check-in');
    return res.data.data;
  },
  checkOut: async (): Promise<AttendanceRecord> => {
    const res = await api.post('/attendance/check-out');
    return res.data.data;
  },
  getTodayStatus: async () => {
    const res = await api.get('/attendance/today-status');
    return res.data;
  },
  getMyAttendance: async (params?: { month?: string; date?: string }): Promise<AttendanceRecord[]> => {
    const res = await api.get('/attendance/my-attendance', { params });
    return res.data.data;
  },
  getDepartmentAttendance: async (params?: { date?: string; month?: string; employeeId?: string }): Promise<{ department: string; data: AttendanceRecord[] }> => {
    const res = await api.get('/attendance/department', { params });
    return res.data;
  },
  getAllAttendance: async (params?: { department?: string; employeeId?: string; date?: string; month?: string }): Promise<AttendanceRecord[]> => {
    const res = await api.get('/attendance/all', { params });
    return res.data.data;
  },
};

export const billingApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const res = await api.get('/billing/dashboard');
    return res.data.data;
  },
  getNextInvoiceNumber: async (): Promise<string> => {
    const res = await api.get('/billing/invoices/next-number');
    return res.data.invoiceNumber;
  },
  createInvoice: async (data: any): Promise<Invoice> => {
    const res = await api.post('/billing/invoices', data);
    return res.data.data;
  },
  getAllInvoices: async (params?: { status?: string; search?: string }): Promise<Invoice[]> => {
    const res = await api.get('/billing/invoices', { params });
    return res.data.data;
  },
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const res = await api.get(`/billing/invoices/${id}`);
    return res.data.data;
  },
  updateInvoice: async (id: string, data: any): Promise<Invoice> => {
    const res = await api.put(`/billing/invoices/${id}`, data);
    return res.data.data;
  },
  downloadInvoicePdfUrl: (id: string) => `/api/billing/invoices/${id}/pdf`,
  downloadPdfBlob: async (id: string, invoiceNumber: string) => {
    const res = await api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Recurring
  getAllRecurringClients: async (): Promise<RecurringClient[]> => {
    const res = await api.get('/billing/recurring/clients');
    return res.data.data;
  },
  getClientHistory: async (id: string): Promise<RecurringClient> => {
    const res = await api.get(`/billing/recurring/clients/${id}/history`);
    return res.data.data;
  },
  addRecurringClient: async (data: any): Promise<RecurringClient> => {
    const res = await api.post('/billing/recurring/clients', data);
    return res.data.data;
  },
  updateClientRate: async (id: string, data: { newMonthlyAmount: number; effectiveMonth: string; reason?: string }) => {
    const res = await api.put(`/billing/recurring/clients/${id}/rate`, data);
    return res.data.data;
  },
  initMonth: async (clientId: string, month: string): Promise<RecurringMonthRecord> => {
    const res = await api.post(`/billing/recurring/clients/${clientId}/months/${month}/init`);
    return res.data.data;
  },
  recordPayment: async (clientId: string, month: string, paymentData: any) => {
    const res = await api.post(`/billing/recurring/clients/${clientId}/months/${month}/payments`, paymentData);
    return res.data.data;
  },
};

export const usersApi = {
  getAllUsers: async (params?: { role?: string; department?: string; search?: string; isActive?: string }) => {
    const res = await api.get('/users', { params });
    return res.data;
  },
  getDepartmentTeam: async () => {
    const res = await api.get('/users/department-team');
    return res.data;
  },
  createUser: async (userData: any): Promise<User> => {
    const res = await api.post('/users', userData);
    return res.data.data;
  },
  updateUser: async (id: string, userData: any): Promise<User> => {
    const res = await api.put(`/users/${id}`, userData);
    return res.data.data;
  },
  toggleUserStatus: async (id: string) => {
    const res = await api.patch(`/users/${id}/toggle-status`);
    return res.data.data;
  },
};

export default api;
