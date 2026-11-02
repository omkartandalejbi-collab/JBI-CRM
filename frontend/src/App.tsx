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
import {
  LayoutDashboard,
  FileText,
  Repeat,
  Clock,
  Building,
  Users,
  Menu,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading, isAdmin, isHOD, isEmployee, isCA } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('billing-dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-lg mx-auto shadow-glow-brand animate-pulse">
            JBI
          </div>
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-400 font-semibold tracking-wide">
            Securing JBI Enterprise CRM Session...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="h-full overflow-hidden bg-[#f8fafc] flex flex-col text-slate-900 selection:bg-brand-500 selection:text-white relative">
      <Navbar onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="w-full flex-1 overflow-y-auto bg-[#f8fafc] min-h-0 pb-16 lg:pb-0">
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
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (<lg) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1 flex items-center justify-around shadow-lg select-none">
        {(isAdmin || isCA) && (
          <button
            onClick={() => {
              setActiveTab('billing-dashboard');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'billing-dashboard' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </button>
        )}

        {(isAdmin || isCA) && (
          <button
            onClick={() => {
              setActiveTab('recurring');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'recurring' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Repeat className="w-4 h-4 mb-0.5" />
            <span>Recurring</span>
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab('attendance');
            setIsMobileSidebarOpen(false);
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'attendance' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 mb-0.5" />
          <span>Attendance</span>
        </button>

        {isHOD && (
          <button
            onClick={() => {
              setActiveTab('department-team');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'department-team' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4 mb-0.5" />
            <span>My Team</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => {
              setActiveTab('users');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'users' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Users</span>
          </button>
        )}

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
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
