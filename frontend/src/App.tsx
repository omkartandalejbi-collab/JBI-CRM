import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { Login } from './pages/Login.js';
import { BillingDashboard } from './pages/BillingDashboard.js';
import { Invoices } from './pages/Invoices.js';
import { RecurringBilling } from './pages/RecurringBilling.js';
import { Attendance } from './pages/Attendance.js';
import { UserManagement } from './pages/UserManagement.js';
import { DepartmentTeam } from './pages/DepartmentTeam.js';
import { RbacMatrix } from './pages/RbacMatrix.js';
import { SystemTest } from './pages/SystemTest.js';

const MainLayout: React.FC = () => {
  const { user, loading, isAdmin, isHOD, isEmployee, isCA } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('billing-dashboard');

  // Set default tab according to logged in role
  useEffect(() => {
    if (user) {
      if (isAdmin || isCA) {
        setActiveTab('billing-dashboard');
      } else if (isHOD || isEmployee) {
        setActiveTab('attendance');
      }
    }
  }, [user?.role, user?.department]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-semibold tracking-wide">
            Initializing JBI Enterprise CRM...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-1">
          {activeTab === 'billing-dashboard' && (isAdmin || isCA) && (
            <BillingDashboard
              onNavigateToInvoices={() => setActiveTab('invoices')}
              onNavigateToRecurring={() => setActiveTab('recurring')}
            />
          )}

          {activeTab === 'invoices' && (isAdmin || isCA) && <Invoices />}

          {activeTab === 'recurring' && (isAdmin || isCA) && <RecurringBilling />}

          {activeTab === 'attendance' && <Attendance />}

          {activeTab === 'department-team' && isHOD && <DepartmentTeam />}

          {activeTab === 'users' && isAdmin && <UserManagement />}

          {activeTab === 'rbac-matrix' && <RbacMatrix />}

          {activeTab === 'test-suite' && <SystemTest />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
