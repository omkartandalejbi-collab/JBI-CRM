import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

async function main() {
  console.log('🌱 Starting JBI CRM Database Seeding...');

  // Clean existing data
  await prisma.recurringPayment.deleteMany();
  await prisma.recurringMonthRecord.deleteMany();
  await prisma.recurringRateHistory.deleteMany();
  await prisma.recurringClient.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Existing data wiped.');

  // Common password hashes
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const hodPassword = await bcrypt.hash('Hod@123', 10);
  const empPassword = await bcrypt.hash('Emp@123', 10);
  const caPassword = await bcrypt.hash('Ca@123', 10);

  // ---------------------------------------------
  // 1. SEED USERS & ROLES
  // ---------------------------------------------
  // Super Admin (Cross-department, full privilege)
  const admin = await prisma.user.create({
    data: {
      name: 'Prem Patel',
      email: 'admin@jbi.com',
      password: adminPassword,
      role: 'Admin',
      department: null,
      phone: '+91 98200 11223',
      isActive: true,
    },
  });

  // Chartered Accountant (CA) (Read-only billing auditor)
  const ca = await prisma.user.create({
    data: {
      name: 'CA Ramesh Joshi',
      email: 'ca@jbi.com',
      password: caPassword,
      role: 'CA',
      department: null,
      phone: '+91 98209 00112',
      isActive: true,
    },
  });

  // Secondary CA alias for backward compatibility
  await prisma.user.create({
    data: {
      name: 'CA Sharma',
      email: 'ca.sharma@jbi.com',
      password: caPassword,
      role: 'CA',
      department: null,
      phone: '+91 98209 00113',
      isActive: true,
    },
  });

  // HODs (One for each of the 4 departments)
  const hodEng = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Rao',
      email: 'hod.engineering@jbi.com',
      password: hodPassword,
      role: 'HOD',
      department: 'Engineering',
      phone: '+91 98201 22334',
      isActive: true,
    },
  });

  const hodSales = await prisma.user.create({
    data: {
      name: 'Ananya Sharma',
      email: 'hod.sales@jbi.com',
      password: hodPassword,
      role: 'HOD',
      department: 'Sales',
      phone: '+91 98202 33445',
      isActive: true,
    },
  });

  const hodMkt = await prisma.user.create({
    data: {
      name: 'Vikram Verma',
      email: 'hod.marketing@jbi.com',
      password: hodPassword,
      role: 'HOD',
      department: 'Marketing',
      phone: '+91 98203 44556',
      isActive: true,
    },
  });

  const hodOps = await prisma.user.create({
    data: {
      name: 'Sunita Menon',
      email: 'hod.operations@jbi.com',
      password: hodPassword,
      role: 'HOD',
      department: 'Operations',
      phone: '+91 98204 55667',
      isActive: true,
    },
  });

  // Employees (One primary for each department)
  const empEng = await prisma.user.create({
    data: {
      name: 'Alex D’souza',
      email: 'emp.engineering@jbi.com',
      password: empPassword,
      role: 'Employee',
      department: 'Engineering',
      phone: '+91 98205 66778',
      isActive: true,
    },
  });

  const empSales = await prisma.user.create({
    data: {
      name: 'Sarah Khan',
      email: 'emp.sales@jbi.com',
      password: empPassword,
      role: 'Employee',
      department: 'Sales',
      phone: '+91 98206 77889',
      isActive: true,
    },
  });

  const empMkt = await prisma.user.create({
    data: {
      name: 'Mike Fernandez',
      email: 'emp.marketing@jbi.com',
      password: empPassword,
      role: 'Employee',
      department: 'Marketing',
      phone: '+91 98207 88990',
      isActive: true,
    },
  });

  const empOps = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'emp.operations@jbi.com',
      password: empPassword,
      role: 'Employee',
      department: 'Operations',
      phone: '+91 98208 99001',
      isActive: true,
    },
  });

  // Named personal aliases for convenience
  const empAlex = await prisma.user.create({
    data: {
      name: 'Alex D’souza (Sr. Dev)',
      email: 'emp.alex@jbi.com',
      password: empPassword,
      role: 'Employee',
      department: 'Engineering',
      phone: '+91 98205 66779',
      isActive: true,
    },
  });

  const empSarah = await prisma.user.create({
    data: {
      name: 'Sarah Khan (Sr. Exec)',
      email: 'emp.sarah@jbi.com',
      password: empPassword,
      role: 'Employee',
      department: 'Sales',
      phone: '+91 98206 77890',
      isActive: true,
    },
  });

  const empMike = await prisma.user.create({
    data: {
      name: 'Mike Fernandez (SEO Lead)',
      email: 'emp.mike@jbi.com',
      password: empPassword,
      role: 'Employee',
      department: 'Marketing',
      phone: '+91 98207 88991',
      isActive: true,
    },
  });

  const empPriya = await prisma.user.create({
    data: {
      name: 'Priya Nair (Ops Lead)',
      email: 'emp.priya@jbi.com',
      password: empPassword,
      role: 'Employee',
      department: 'Operations',
      phone: '+91 98208 99002',
      isActive: true,
    },
  });

  console.log('✔ Users seeded successfully:');
  console.log('  👑 Super Admin: admin@jbi.com / Admin@123');
  console.log('  💼 CA:          ca@jbi.com / Ca@123 (and ca.sharma@jbi.com)');
  console.log('  🏛️  HOD (Eng):   hod.engineering@jbi.com / Hod@123');
  console.log('  🏛️  HOD (Sales): hod.sales@jbi.com / Hod@123');
  console.log('  🏛️  HOD (Mkt):   hod.marketing@jbi.com / Hod@123');
  console.log('  🏛️  HOD (Ops):   hod.operations@jbi.com / Hod@123');
  console.log('  👤 Emp (Eng):   emp.engineering@jbi.com (or emp.alex@jbi.com) / Emp@123');
  console.log('  👤 Emp (Sales): emp.sales@jbi.com (or emp.sarah@jbi.com) / Emp@123');
  console.log('  👤 Emp (Mkt):   emp.marketing@jbi.com (or emp.mike@jbi.com) / Emp@123');
  console.log('  👤 Emp (Ops):   emp.operations@jbi.com (or emp.priya@jbi.com) / Emp@123');

  // ---------------------------------------------
  // 2. SEED ONE-TIME INVOICES (PDF AUTOMATION)
  // ---------------------------------------------
  const inv1Items = [
    { description: 'Enterprise CRM Cloud Setup & Integration', quantity: 1, unitPrice: 75000, amount: 75000 },
    { description: 'Data Migration & Security Hardening', quantity: 1, unitPrice: 20000, amount: 20000 },
    { description: 'Staff Training & Onboarding Workshops (5 Sessions)', quantity: 5, unitPrice: 3000, amount: 15000 },
  ];
  const subtotal1 = 110000;
  const taxRate1 = 18;
  const taxAmount1 = subtotal1 * (taxRate1 / 100);
  const discount1 = 5000;
  const totalAmount1 = subtotal1 + taxAmount1 - discount1;

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      clientName: 'Apex Logistics International',
      clientEmail: 'billing@apexlogistics.com',
      clientPhone: '+91 91234 56789',
      clientAddress: '12th Floor, Trade Center, BKC, Mumbai - 400051',
      invoiceDate: '2026-10-15',
      dueDate: '2026-11-15',
      itemsJson: JSON.stringify(inv1Items),
      subtotal: subtotal1,
      taxRate: taxRate1,
      taxAmount: taxAmount1,
      discount: discount1,
      totalAmount: totalAmount1,
      status: 'Paid',
      notes: 'Paid in full via RTGS bank transfer. Reference: UTR9876543210.',
      createdById: admin.id,
    },
  });

  const inv2Items = [
    { description: 'Custom Analytics Dashboard & Power BI Pipeline', quantity: 1, unitPrice: 45000, amount: 45000 },
    { description: 'API Gateway & Webhook Synchronization', quantity: 2, unitPrice: 12500, amount: 25000 },
  ];
  const subtotal2 = 70000;
  const taxAmount2 = subtotal2 * 0.18;
  const totalAmount2 = subtotal2 + taxAmount2;

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      clientName: 'Zenith Healthcare Ltd',
      clientEmail: 'accounts@zenithhealth.org',
      clientPhone: '+91 99887 76655',
      clientAddress: 'Plot 44, Electronic City, Bengaluru - 560100',
      invoiceDate: '2026-10-22',
      dueDate: '2026-11-05',
      itemsJson: JSON.stringify(inv2Items),
      subtotal: subtotal2,
      taxRate: 18,
      taxAmount: taxAmount2,
      discount: 0,
      totalAmount: totalAmount2,
      status: 'Pending',
      notes: 'Payment scheduled for release in the first week of November.',
      createdById: admin.id,
    },
  });

  console.log('✔ One-Time Invoices seeded.');

  // ---------------------------------------------
  // 3. SEED RECURRING BILLING (Continuous with Carry-Forward Example)
  // ---------------------------------------------
  // Client A: Exactly mirrors the user's specification!
  // Client A has a monthly amount of ₹5,000.
  // Month 1 (2026-08): Bill = ₹5,000, Paid = ₹2,000, Pending = ₹3,000
  // Month 2 (2026-09): New bill = ₹5,000 + previous pending ₹3,000 = ₹8,000 due. Paid = ₹7,000, pending = ₹1,000
  // Month 3 (2026-10): Rate changed to ₹6,000 + previous pending ₹1,000 = ₹7,000 due. Paid = ₹5,000, pending = ₹2,000.
  const clientA = await prisma.recurringClient.create({
    data: {
      name: 'TechSoft India Pvt. Ltd.',
      company: 'TechSoft Solutions',
      email: 'finance@techsoft.in',
      phone: '+91 98450 12345',
      currentMonthlyAmount: 6000, // Updated from 5000
      billingStartMonth: '2026-08',
      status: 'Active',
      notes: 'Monthly enterprise CRM support & managed server SLA.',
    },
  });

  // Rate history for Client A
  await prisma.recurringRateHistory.create({
    data: {
      clientId: clientA.id,
      previousAmount: 0,
      newAmount: 5000,
      effectiveMonth: '2026-08',
      reason: 'Initial contract signing',
    },
  });
  await prisma.recurringRateHistory.create({
    data: {
      clientId: clientA.id,
      previousAmount: 5000,
      newAmount: 6000,
      effectiveMonth: '2026-10',
      reason: 'SLA scope upgrade & 24/7 dedicated support',
    },
  });

  // Month 1: 2026-08
  const m1 = await prisma.recurringMonthRecord.create({
    data: {
      clientId: clientA.id,
      month: '2026-08',
      billAmount: 5000,
      previousPending: 0,
      totalDue: 5000,
      amountPaid: 2000,
      remainingPending: 3000,
      status: 'Partial',
      notes: 'Initial monthly bill',
    },
  });
  await prisma.recurringPayment.create({
    data: {
      clientId: clientA.id,
      monthRecordId: m1.id,
      amount: 2000,
      paymentDate: '2026-08-14',
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'NEFT-8849201',
      notes: 'Partial payment received',
    },
  });

  // Month 2: 2026-09 (Total Due = 5000 + 3000 = 8000. Paid = 7000. Pending = 1000)
  const m2 = await prisma.recurringMonthRecord.create({
    data: {
      clientId: clientA.id,
      month: '2026-09',
      billAmount: 5000,
      previousPending: 3000,
      totalDue: 8000,
      amountPaid: 7000,
      remainingPending: 1000,
      status: 'Partial',
      notes: 'Carried forward ₹3,000 from August',
    },
  });
  // 2 payments in month 2 demonstrating multiple payments per month
  await prisma.recurringPayment.create({
    data: {
      clientId: clientA.id,
      monthRecordId: m2.id,
      amount: 4000,
      paymentDate: '2026-09-08',
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-992011',
      notes: 'First installment',
    },
  });
  await prisma.recurringPayment.create({
    data: {
      clientId: clientA.id,
      monthRecordId: m2.id,
      amount: 3000,
      paymentDate: '2026-09-24',
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'IMPS-334192',
      notes: 'Second installment',
    },
  });

  // Month 3: 2026-10 (New rate 6000 + previous pending 1000 = 7000 due. Paid 5000. Pending = 2000)
  const m3 = await prisma.recurringMonthRecord.create({
    data: {
      clientId: clientA.id,
      month: '2026-10',
      billAmount: 6000,
      previousPending: 1000,
      totalDue: 7000,
      amountPaid: 5000,
      remainingPending: 2000,
      status: 'Partial',
      notes: 'Carried forward ₹1,000 from September. New rate ₹6,000 applied.',
    },
  });
  await prisma.recurringPayment.create({
    data: {
      clientId: clientA.id,
      monthRecordId: m3.id,
      amount: 5000,
      paymentDate: '2026-10-18',
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'RTGS-009182',
      notes: 'October billing payment',
    },
  });

  // Client B: Fully paid client
  const clientB = await prisma.recurringClient.create({
    data: {
      name: 'Nexus Retail Systems',
      company: 'Nexus Global',
      email: 'nexus@retail.com',
      phone: '+91 97654 32100',
      currentMonthlyAmount: 12000,
      billingStartMonth: '2026-09',
      status: 'Active',
      notes: 'POS & CRM monthly cloud sync',
    },
  });
  const mb1 = await prisma.recurringMonthRecord.create({
    data: {
      clientId: clientB.id,
      month: '2026-09',
      billAmount: 12000,
      previousPending: 0,
      totalDue: 12000,
      amountPaid: 12000,
      remainingPending: 0,
      status: 'Paid',
    },
  });
  await prisma.recurringPayment.create({
    data: {
      clientId: clientB.id,
      monthRecordId: mb1.id,
      amount: 12000,
      paymentDate: '2026-09-05',
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'HDFC-882910',
    },
  });
  const mb2 = await prisma.recurringMonthRecord.create({
    data: {
      clientId: clientB.id,
      month: '2026-10',
      billAmount: 12000,
      previousPending: 0,
      totalDue: 12000,
      amountPaid: 12000,
      remainingPending: 0,
      status: 'Paid',
    },
  });
  await prisma.recurringPayment.create({
    data: {
      clientId: clientB.id,
      monthRecordId: mb2.id,
      amount: 12000,
      paymentDate: '2026-10-06',
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'HDFC-991821',
    },
  });

  console.log('✔ Recurring Billing & Payment Histories seeded.');

  // ---------------------------------------------
  // 4. SEED SAMPLE ATTENDANCE RECORDS
  // ---------------------------------------------
  const dates = ['2026-10-24', '2026-10-25', '2026-10-26'];
  const employees = [empEng, empSales, empMkt, empOps, empAlex, empSarah, empMike, empPriya];

  for (const date of dates) {
    for (const emp of employees) {
      const checkInHour = 9;
      const checkInMinute = Math.floor(Math.random() * 20); // 9:00 - 9:20 AM
      const checkInDate = new Date(`${date}T0${checkInHour}:${String(checkInMinute).padStart(2, '0')}:00Z`);

      const checkOutHour = 18;
      const checkOutMinute = Math.floor(Math.random() * 30); // 6:00 - 6:30 PM
      const checkOutDate = new Date(`${date}T${checkOutHour}:${String(checkOutMinute).padStart(2, '0')}:00Z`);

      await prisma.attendance.create({
        data: {
          userId: emp.id,
          date,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: 'Completed',
        },
      });
    }
  }

  console.log('✔ Sample Attendance records seeded across departments.');
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
