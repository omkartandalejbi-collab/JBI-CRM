import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles, caBillingGuard } from '../../middleware/rbac.js';
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  downloadInvoicePDF,
  updateInvoice,
  getNextInvoiceNumber,
} from './invoice.controller.js';
import {
  addRecurringClient,
  updateClientRate,
  recordPayment,
  getAllRecurringClients,
  getClientBillingHistory,
  initClientMonth,
} from './recurring.controller.js';
import { getBillingDashboardMetrics } from './dashboard.controller.js';

const router = Router();

// Only Admin and CA are authorized to access the Billing module
router.use(authenticate);
router.use(requireRoles('Admin', 'CA'));
router.use(caBillingGuard); // Guarantees CA has strictly read-only access (GET only)

// ---------------------------------------------
// BILLING DASHBOARD
// ---------------------------------------------
router.get('/dashboard', getBillingDashboardMetrics);

// ---------------------------------------------
// ONE-TIME INVOICES (PDF AUTOMATION)
// ---------------------------------------------
router.get('/invoices/next-number', requireRoles('Admin'), getNextInvoiceNumber);
router.post('/invoices', requireRoles('Admin'), createInvoice);
router.get('/invoices', getAllInvoices); // Admin & CA (Read)
router.get('/invoices/:id', getInvoiceById); // Admin & CA (Read)
router.get('/invoices/:id/pdf', downloadInvoicePDF); // Admin & CA (Download PDF)
router.put('/invoices/:id', requireRoles('Admin'), updateInvoice);

// ---------------------------------------------
// CONTINUOUS / RECURRING BILLING
// ---------------------------------------------
router.post('/recurring/clients', requireRoles('Admin'), addRecurringClient);
router.get('/recurring/clients', getAllRecurringClients); // Admin & CA (Read)
router.get('/recurring/clients/:id/history', getClientBillingHistory); // Admin & CA (Read)
router.put('/recurring/clients/:id/rate', requireRoles('Admin'), updateClientRate);
router.post('/recurring/clients/:clientId/months/:month/init', requireRoles('Admin'), initClientMonth);
router.post('/recurring/clients/:clientId/months/:month/payments', requireRoles('Admin'), recordPayment);

export default router;
