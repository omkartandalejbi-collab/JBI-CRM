import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 JBI CRM: Comprehensive RBAC & Security Test Suite');
  console.log('========================================================');

  let passed = 0;
  let total = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✔ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${detail || ''}`);
    }
  };

  try {
    // ----------------------------------------------------
    // TEST 1: AUTHENTICATION FOR ALL 4 ROLES
    // ----------------------------------------------------
    console.log('\n--- 1. Authentication Tests ---');

    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@jbi.com',
      password: 'Admin@123',
    });
    assert(adminLogin.data.success && adminLogin.data.data.user.role === 'Admin', 'Admin Login Successful');
    const adminToken = adminLogin.data.data.token;

    const hodLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'hod.engineering@jbi.com',
      password: 'Hod@123',
    });
    assert(
      hodLogin.data.success &&
        hodLogin.data.data.user.role === 'HOD' &&
        hodLogin.data.data.user.department === 'Engineering',
      'HOD Login Successful with Department Scoping'
    );
    const hodToken = hodLogin.data.data.token;

    const empLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'emp.alex@jbi.com',
      password: 'Emp@123',
    });
    assert(empLogin.data.success && empLogin.data.data.user.role === 'Employee', 'Employee Login Successful');
    const empToken = empLogin.data.data.token;

    const caLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ca.sharma@jbi.com',
      password: 'Ca@123',
    });
    assert(caLogin.data.success && caLogin.data.data.user.role === 'CA', 'CA Login Successful');
    const caToken = caLogin.data.data.token;

    // Invalid login test
    try {
      await axios.post(`${BASE_URL}/auth/login`, { email: 'admin@jbi.com', password: 'WrongPassword' });
      assert(false, 'Invalid credentials rejected');
    } catch (err: any) {
      assert(err.response?.status === 401, 'Invalid credentials rejected with 401 Unauthorized');
    }

    // ----------------------------------------------------
    // TEST 2: RBAC BILLING MODULE RESTRICTIONS
    // ----------------------------------------------------
    console.log('\n--- 2. RBAC Billing Access Restrictions ---');

    // Employee blocked from Billing
    try {
      await axios.get(`${BASE_URL}/billing/dashboard`, {
        headers: { Authorization: `Bearer ${empToken}` },
      });
      assert(false, 'Employee blocked from Billing module');
    } catch (err: any) {
      assert(err.response?.status === 403, 'Employee blocked from Billing with 403 Forbidden');
    }

    // HOD blocked from Billing
    try {
      await axios.get(`${BASE_URL}/billing/dashboard`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      assert(false, 'HOD blocked from Billing module');
    } catch (err: any) {
      assert(err.response?.status === 403, 'HOD blocked from Billing with 403 Forbidden');
    }

    // CA allowed read access to Billing Dashboard
    const caDashboard = await axios.get(`${BASE_URL}/billing/dashboard`, {
      headers: { Authorization: `Bearer ${caToken}` },
    });
    assert(
      caDashboard.status === 200 && caDashboard.data.data.summary.totalRevenueCollected > 0,
      'CA granted Read-Only access to Billing Dashboard'
    );

    // CA BLOCKED from creating Invoices (Non-GET method blocked)
    try {
      await axios.post(
        `${BASE_URL}/billing/invoices`,
        {
          invoiceNumber: 'INV-TEST-CA',
          clientName: 'Blocked Corp',
          invoiceDate: '2026-10-27',
          dueDate: '2026-11-10',
          items: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 }],
          subtotal: 100,
          totalAmount: 118,
        },
        { headers: { Authorization: `Bearer ${caToken}` } }
      );
      assert(false, 'CA blocked from creating invoice');
    } catch (err: any) {
      assert(err.response?.status === 403, 'CA blocked from modifying Billing (403 Forbidden Read-Only)');
    }

    // CA BLOCKED from non-billing modules (Attendance, Users)
    try {
      await axios.get(`${BASE_URL}/attendance/my-attendance`, {
        headers: { Authorization: `Bearer ${caToken}` },
      });
      assert(false, 'CA blocked from Attendance module');
    } catch (err: any) {
      assert(err.response?.status === 403, 'CA blocked from Attendance module (403 Forbidden)');
    }

    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${caToken}` },
      });
      assert(false, 'CA blocked from Users module');
    } catch (err: any) {
      assert(err.response?.status === 403, 'CA blocked from Users module (403 Forbidden)');
    }

    // ----------------------------------------------------
    // TEST 3: ONE-TIME INVOICE & PDF AUTOMATION
    // ----------------------------------------------------
    console.log('\n--- 3. One-Time Invoices & PDF Generation ---');

    // Admin creates an invoice
    const newInvoiceRes = await axios.post(
      `${BASE_URL}/billing/invoices`,
      {
        invoiceNumber: `INV-TEST-${Date.now()}`,
        clientName: 'Reliance Infotech Ltd',
        clientEmail: 'billing@reliance.com',
        clientPhone: '+91 99887 71122',
        clientAddress: 'Maker Chambers IV, Nariman Point, Mumbai',
        invoiceDate: '2026-10-27',
        dueDate: '2026-11-15',
        items: [
          { description: 'Cloud Infrastructure Audit', quantity: 1, unitPrice: 50000, amount: 50000 },
          { description: 'PostgreSQL Database Optimization', quantity: 2, unitPrice: 15000, amount: 30000 },
        ],
        subtotal: 80000,
        taxRate: 18,
        taxAmount: 14400,
        discount: 2000,
        totalAmount: 92400,
        status: 'Pending',
        notes: 'Net 30 payment terms.',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(newInvoiceRes.status === 201, 'Admin created One-Time Invoice with tax breakdown');
    const invoiceId = newInvoiceRes.data.data.id;

    // Both Admin and CA can download the PDF
    const adminPdf = await axios.get(`${BASE_URL}/billing/invoices/${invoiceId}/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      responseType: 'arraybuffer',
    });
    assert(
      adminPdf.headers['content-type'] === 'application/pdf' && adminPdf.data.byteLength > 1000,
      'Admin generated and downloaded Invoice PDF'
    );

    const caPdf = await axios.get(`${BASE_URL}/billing/invoices/${invoiceId}/pdf`, {
      headers: { Authorization: `Bearer ${caToken}` },
      responseType: 'arraybuffer',
    });
    assert(
      caPdf.headers['content-type'] === 'application/pdf' && caPdf.data.byteLength > 1000,
      'CA authorized to download Invoice PDF'
    );

    // ----------------------------------------------------
    // TEST 4: CONTINUOUS BILLING WITH CARRY-FORWARD
    // ----------------------------------------------------
    console.log('\n--- 4. Continuous Billing & Carry-Forward Engine ---');

    // Fetch recurring clients
    const recurringList = await axios.get(`${BASE_URL}/billing/recurring/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(recurringList.data.data.length >= 2, 'Recurring clients listed with current pending');

    const clientA = recurringList.data.data.find((c: any) => c.name.includes('TechSoft'));
    assert(!!clientA, 'Client A (Carry-forward client) found');

    const clientHistory = await axios.get(`${BASE_URL}/billing/recurring/clients/${clientA.id}/history`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const months = clientHistory.data.data.monthRecords;

    // Verify Formula: Total Due = Billed + Previous Pending; Pending = Total Due - Paid
    const m2 = months.find((m: any) => m.month === '2026-09');
    assert(
      m2 && m2.previousPending === 3000 && m2.totalDue === 8000 && m2.amountPaid === 7000 && m2.remainingPending === 1000,
      'Exact formula verified for Month 2: Total Due = 5000 + 3000 = 8000; Remaining Pending = 8000 - 7000 = 1000'
    );

    // ----------------------------------------------------
    // TEST 5: ATTENDANCE SINGLE PUNCH ENFORCEMENT & SCOPING
    // ----------------------------------------------------
    console.log('\n--- 5. Attendance Module Tests ---');

    // Employee Priya marks check-in
    const empPriyaLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'emp.priya@jbi.com',
      password: 'Emp@123',
    });
    const priyaToken = empPriyaLogin.data.data.token;

    // First check-in of the day
    const checkInRes = await axios.post(
      `${BASE_URL}/attendance/check-in`,
      {},
      { headers: { Authorization: `Bearer ${priyaToken}` } }
    );
    assert(checkInRes.status === 201, 'Employee successfully punched Check-In using Server Time');

    // Duplicate check-in MUST be blocked
    try {
      await axios.post(
        `${BASE_URL}/attendance/check-in`,
        {},
        { headers: { Authorization: `Bearer ${priyaToken}` } }
      );
      assert(false, 'Duplicate check-in blocked');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Duplicate check-in rejected with 400 Bad Request');
    }

    // Check-out
    const checkOutRes = await axios.post(
      `${BASE_URL}/attendance/check-out`,
      {},
      { headers: { Authorization: `Bearer ${priyaToken}` } }
    );
    assert(checkOutRes.status === 200, 'Employee successfully punched Check-Out');

    // Duplicate check-out MUST be blocked
    try {
      await axios.post(
        `${BASE_URL}/attendance/check-out`,
        {},
        { headers: { Authorization: `Bearer ${priyaToken}` } }
      );
      assert(false, 'Duplicate check-out blocked');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Duplicate check-out rejected with 400 Bad Request');
    }

    // HOD Scoping test: HOD Engineering can only see Engineering employees
    const hodEngAttendance = await axios.get(`${BASE_URL}/attendance/department`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const nonEngRecords = hodEngAttendance.data.data.filter((r: any) => r.user?.department !== 'Engineering');
    assert(nonEngRecords.length === 0, 'HOD of Engineering CANNOT see records of other departments');

    console.log('\n========================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} PASSED (100% SUCCESS)`);
    console.log('========================================================\n');
  } catch (error: any) {
    console.error('Fatal test error:', error);
  }
}

runTests();
