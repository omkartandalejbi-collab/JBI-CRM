import React, { useState, useEffect } from 'react';
import { usersApi } from '../services/api.js';
import { User } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { Building, Mail, Phone, Users, Shield, Search, CheckCircle2 } from 'lucide-react';

export const DepartmentTeam: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const res = await usersApi.getDepartmentTeam();
        setEmployees(res.data || []);
      } catch (err) {
        console.error('Failed to load team:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <span>Workforce Management</span>
            <span className="text-slate-300">&bull;</span>
            <span>Department Scope</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-amber-600" />
            <span>My Department Team &bull; {user?.department}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct reports and staff members assigned strictly under your supervision in {user?.department}.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 flex items-center gap-2 self-start sm:self-auto">
          <Users className="w-4 h-4 text-amber-600" />
          <span>{employees.length} Total Members</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-crm-card flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search team member by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-600 rounded-xl text-xs text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-crm-card">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            <div className="w-7 h-7 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading team directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No employees found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Corporate Email</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                          {getInitials(emp.name)}
                        </div>
                        <span className="font-semibold text-slate-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {emp.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{emp.phone}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {emp.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{emp.isActive ? 'Active' : 'Deactivated'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
