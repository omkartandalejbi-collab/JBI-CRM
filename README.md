# JBI-CRM

A modern, role-based CRM and Financial Operations Platform designed to manage employees, attendance, invoices, recurring billing, and financial operations.

Built using **React 19, TypeScript, Node.js, Express, Prisma ORM, and SQLite**, with secure authentication and Role-Based Access Control (RBAC).

---

## 🚀 Key Features

- **Financial Dashboard:** Track total billed revenue, received payments, and pending amounts.
- **Invoice Management:** Generate tax invoices with sequential invoice numbers and downloadable PDF documents.
- **Recurring Billing:** Manage monthly client retainers, payments, and automatic carry-forward of outstanding balances.
- **Employee Attendance:** Server-verified daily check-in and check-out with attendance history.
- **Department Management:** HODs can view and manage attendance records within their respective departments.
- **User Management:** Create, update, activate, and deactivate employee accounts.
- **Role-Based Access Control:** Separate permissions for Super Admin, Chartered Accountant, HOD, and Employees.
- **Automated Testing:** Built-in browser-based system testing and backend RBAC test suite.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | SQLite |
| ORM | Prisma |
| Authentication | JWT, bcryptjs |
| Validation | Zod |
| PDF Generation | PDFKit |
| Icons | Lucide React |

---

## 🔑 Demo Credentials

The database comes pre-seeded with demo accounts for different roles and departments.

### Primary Demo Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| Super Admin | Prem Patel | `admin@jbi.com` | `Admin@123` |
| CA (Auditor) | CA Ramesh Joshi | `ca@jbi.com` | `Ca@123` |
| HOD (Engineering) | Dr. Rajesh Rao | `hod.engineering@jbi.com` | `Hod@123` |
| HOD (Sales) | Ananya Sharma | `hod.sales@jbi.com` | `Hod@123` |
| HOD (Marketing) | Vikram Verma | `hod.marketing@jbi.com` | `Hod@123` |
| HOD (Operations) | Sunita Menon | `hod.operations@jbi.com` | `Hod@123` |
| Employee (Engineering) | Alex D'souza | `emp.engineering@jbi.com` | `Emp@123` |
| Employee (Sales) | Sarah Khan | `emp.sales@jbi.com` | `Emp@123` |
| Employee (Marketing) | Mike Fernandez | `emp.marketing@jbi.com` | `Emp@123` |
| Employee (Operations) | Priya Nair | `emp.operations@jbi.com` | `Emp@123` |

### Additional Demo Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| CA | CA Sharma | `ca.sharma@jbi.com` | `Ca@123` |
| Employee | Alex D'souza | `emp.alex@jbi.com` | `Emp@123` |
| Employee | Sarah Khan | `emp.sarah@jbi.com` | `Emp@123` |
| Employee | Mike Fernandez | `emp.mike@jbi.com` | `Emp@123` |
| Employee | Priya Nair | `emp.priya@jbi.com` | `Emp@123` |

> **Note:** These credentials are intended for local demonstration and testing only. Do not use them in a production environment.

---

## 🛡️ Role-Based Access Control (RBAC)

The application supports four distinct user roles with permissions enforced through backend middleware and frontend access controls.

| Module / Permission | Super Admin | CA | HOD | Employee |
|---|---|---|---|---|
| User Management | Full Access | ❌ | ❌ | ❌ |
| Billing Dashboard | Full Access | Read-Only | ❌ | ❌ |
| Create Invoices | Yes | ❌ | ❌ | ❌ |
| View / Download Invoices | Yes | Yes | ❌ | ❌ |
| Recurring Billing | Full Access | Read-Only | ❌ | ❌ |
| Record Payments | Yes | ❌ | ❌ | ❌ |
| Daily Attendance | Yes | ❌ | Yes | Yes |
| Department Attendance | All Departments | ❌ | Own Department | ❌ |
| System Test Suite | Yes | Yes | Yes | Yes |

**Security Implementation:**
- JWT-based authentication.
- Role validation through `requireRoles` middleware.
- `caBillingGuard` restricts CA accounts to permitted read-only billing operations.
- `blockCA` prevents access to user management and attendance records.
- Passwords are securely hashed using `bcryptjs`.

---

## 💰 Recurring Billing & Carry-Forward Logic

The recurring billing module automatically carries forward unpaid balances from previous billing months.

**Calculation:**

```text
Total Due = Current Month Bill + Previous Month Pending

Remaining Pending = Total Due - Amount Paid
```

**Example:**

| Month | Monthly Fee | Previous Pending | Total Due | Paid | Remaining |
|---|---:|---:|---:|---:|---:|
| August 2026 | ₹5,000 | ₹0 | ₹5,000 | ₹2,000 | ₹3,000 |
| September 2026 | ₹5,000 | ₹3,000 | ₹8,000 | ₹7,000 | ₹1,000 |
| October 2026 | ₹6,000 | ₹1,000 | ₹7,000 | ₹5,000 | ₹2,000 |

The system maintains accurate billing balances even when monthly contract rates change.

---

## 📂 Project Structure

```text
JBI-CRM/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── attendance/
│   │   │   ├── auth/
│   │   │   ├── billing/
│   │   │   └── users/
│   │   ├── scripts/
│   │   │   └── testRbac.ts
│   │   ├── app.ts
│   │   ├── prisma.ts
│   │   ├── seed.ts
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── package.json
└── README.md
```

---

## ⚡ Installation & Setup

### Prerequisites

- Node.js v18 or later
- npm v9 or later
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Premlad1289/JBI-CRM.git

cd JBI-CRM
```

### 2. Install Dependencies

```bash
npm install
```

The root installation script installs the frontend and backend dependencies and generates the Prisma client.

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

**Windows PowerShell:**

```powershell
Copy-Item backend\.env.example backend\.env
```

**Linux / macOS:**

```bash
cp backend/.env.example backend/.env
```

Configure the following variables in `backend/.env`:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secure_random_secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 4. Initialize the Database

```bash
npm --prefix backend run db:push
```

Seed the database with demo users and sample records:

```bash
npm run seed
```

### 5. Start the Application

```bash
npm run dev
```

The application will be available at:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| API Health Check | http://localhost:5000/api/health |

---

## 🌐 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `DATABASE_URL` | SQLite database connection |
| `JWT_SECRET` | Secret key for JWT authentication |
| `JWT_EXPIRES_IN` | JWT token validity duration |
| `CORS_ORIGIN` | Allowed frontend origin |
| `NODE_ENV` | Application environment |

---

## 📡 API Overview

All protected endpoints require JWT authentication through the following header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Authentication – `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### User Management – `/api/users`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| PATCH | `/api/users/:id/toggle-status` | Activate / Deactivate user |
| GET | `/api/users/department-team` | Get department team |

### Attendance – `/api/attendance`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/attendance/check-in` | Employee check-in |
| POST | `/api/attendance/check-out` | Employee check-out |
| GET | `/api/attendance/today-status` | Get today's attendance status |
| GET | `/api/attendance/my-attendance` | Get personal attendance history |
| GET | `/api/attendance/department` | Get department attendance |
| GET | `/api/attendance/all` | Get organization-wide attendance |

### Billing – `/api/billing`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/billing/dashboard` | Financial dashboard |
| GET | `/api/billing/invoices` | List invoices |
| POST | `/api/billing/invoices` | Create invoice |
| GET | `/api/billing/invoices/:id` | Get invoice details |
| GET | `/api/billing/invoices/:id/pdf` | Download invoice PDF |
| PUT | `/api/billing/invoices/:id` | Update invoice |
| POST | `/api/billing/recurring/clients` | Create recurring client |
| GET | `/api/billing/recurring/clients` | List recurring clients |
| GET | `/api/billing/recurring/clients/:id/history` | Get billing history |
| PUT | `/api/billing/recurring/clients/:id/rate` | Update monthly rate |

---

## 🧪 Testing

The project includes two automated testing mechanisms.

### 1. In-Browser System Test Suite

Navigate to the **System Test Suite** section in the application sidebar and click **Run Complete Test Suite**.

The test suite checks:
- Authentication and JWT validation.
- Invalid login rejection.
- Role-based access restrictions.
- CA billing permissions.
- HOD department isolation.
- Attendance record persistence.
- Financial calculations.
- Sequential invoice numbering.

### 2. Backend RBAC Testing

Run the backend automated test suite:

```bash
npm run test:rbac
```

### 3. Production Build Verification

```bash
npm run build
```

---

## 🗄️ Database Management

### Open Prisma Studio

```bash
npm --prefix backend run db:studio
```

Prisma Studio will be available at:

```text
http://localhost:5555
```

### Reset / Reseed Demo Data

```bash
npm run seed
```

This repopulates the database with the configured demo records. Back up any important local data before reseeding.

---

## 📌 Project Information

**Project Name:** JBI-CRM

**Category:** Enterprise CRM & Financial Operations

**Architecture:** Full-Stack Web Application

**Repository:** [JBI-CRM on GitHub](https://github.com/Premlad1289/JBI-CRM)

---

