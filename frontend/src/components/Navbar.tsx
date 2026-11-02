import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Clock, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'HOD':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CA':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Brand */}
      <div className="flex items-center space-x-3.5">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-sm shadow-indigo-600/20">
          JBI
        </div>
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 text-sm tracking-tight">
              JBI Enterprise CRM
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              v2.4
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Jadhavar Business Intelligence</span>
        </div>
      </div>

      {/* Middle status & clock */}
      <div className="hidden md:flex items-center space-x-4 text-xs text-slate-500">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px]">System Online</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-500 text-xs bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[11px] font-medium text-slate-700">{time}</span>
        </div>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-slate-50 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-800">{user.name}</div>
                <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                  {user.department && (
                    <span className="text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {user.department}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                {getInitials(user.name)}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
