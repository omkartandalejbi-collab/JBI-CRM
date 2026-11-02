import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { attendanceApi, usersApi } from '../services/api.js';
import { AttendanceRecord, User } from '../types/index.js';
import {
  Clock,
  CircleAlert,
  CircleCheckBig,
  Building,
  Calendar,
  Filter,
  LogOut,
  Sparkles,
  CheckCircle2,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Timer,
  LayoutGrid,
  ListFilter,
  CheckCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { user, isAdmin, isHOD, isEmployee } = useAuth();

  // Employee Punch State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);

  // Supervisor (HOD / Admin) State
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Navigation
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [rosterDate, setRosterDate] = useState<string>('2026-10-26');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'clocked-in' | 'absent'>('all');
  const [viewMode, setViewMode] = useState<'roster' | 'logs' | 'directory'>('roster');

  // Live Digital Clock
  const [liveTime, setLiveTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const status = await attendanceApi.getTodayStatus();
      setIsCheckedIn(status.isCheckedIn);
      setIsCheckedOut(status.isCheckedOut);
      setTodayRecord(status.record);
      const records = await attendanceApi.getMyAttendance();
      setMyRecords(records);
    } catch (err) {
      console.error('Failed to load employee attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHODData = async () => {
    try {
      setLoading(true);
      const teamRes = await usersApi.getDepartmentTeam();
      const users: User[] = teamRes.data || [];
      setDepartmentUsers(users);

      const attRes = await attendanceApi.getDepartmentAttendance({
        employeeId: selectedEmp === 'All' ? undefined : selectedEmp,
        date: selectedDate || undefined,
      });
      const list = attRes.data || [];
      setAttendanceList(list);

      // Auto-set roster date to latest available date
      if (list.length > 0 && !selectedDate) {
        const latest = list[0].date;
        if (latest) setRosterDate(latest);
      }
    } catch (err) {
      console.error('Failed to load department attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const usersRes = await usersApi.getAllUsers({
        department: selectedDept === 'All' ? undefined : selectedDept,
      });
      const allUsers: User[] = (usersRes.data || []).filter((u: User) => u.role === 'Employee' || u.role === 'HOD');
      setDepartmentUsers(allUsers);

      const att = await attendanceApi.getAllAttendance({
        department: selectedDept === 'All' ? undefined : selectedDept,
        employeeId: selectedEmp === 'All' ? undefined : selectedEmp,
        date: selectedDate || undefined,
      });
      setAttendanceList(att);

      // Auto-set roster date to latest available date if not set manually
      if (att.length > 0 && !selectedDate) {
        const latest = att[0].date;
        if (latest) setRosterDate(latest);
      }
    } catch (err) {
      console.error('Failed to load admin attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEmployee) {
      fetchEmployeeData();
    } else if (isHOD) {
      fetchHODData();
    } else if (isAdmin) {
      fetchAdminData();
    }
  }, [selectedDept, selectedEmp, selectedDate]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const rec = await attendanceApi.checkIn();
      setIsCheckedIn(true);
      setTodayRecord(rec);
      setFeedback({
        type: 'success',
        text: `Checked in successfully at ${new Date(rec.checkIn).toLocaleTimeString()} (Server Verified).`,
      });
      fetchEmployeeData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Check-in failed.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const rec = await attendanceApi.checkOut();
      setIsCheckedOut(true);
      setTodayRecord(rec);
      setFeedback({
        type: 'success',
        text: `Checked out successfully at ${new Date(rec.checkOut!).toLocaleTimeString()} (Workday Completed).`,
      });
      fetchEmployeeData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Check-out failed.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // Helper for 12-hour formatted time
  const formatTime = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Helper for human-readable date
  const formatReadableDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper for duration
  const formatDuration = (checkInStr?: string, checkOutStr?: string | null) => {
    if (!checkInStr) return '—';
    const start = new Date(checkInStr).getTime();
    const end = checkOutStr ? new Date(checkOutStr).getTime() : Date.now();
    if (isNaN(start) || isNaN(end) || end < start) return '—';
    const diffMinutes = Math.floor((end - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Date Stepper controls
  const handleDateStep = (delta: number) => {
    const [y, m, d] = rosterDate.split('-');
    if (!y || !m || !d) return;
    const current = new Date(Number(y), Number(m) - 1, Number(d));
    current.setDate(current.getDate() + delta);
    const newY = current.getFullYear();
    const newM = String(current.getMonth() + 1).padStart(2, '0');
    const newD = String(current.getDate()).padStart(2, '0');
    setRosterDate(`${newY}-${newM}-${newD}`);
  };

  // Build daily roster for `rosterDate`
  const rosterItems = useMemo(() => {
    const listForDate = attendanceList.filter((a) => a.date === rosterDate);
    const recordMap = new Map<string, AttendanceRecord>();
    listForDate.forEach((r) => {
      recordMap.set(r.userId, r);
    });

    return departmentUsers.map((emp) => {
      const record = recordMap.get(emp.id);
      let status: 'completed' | 'clocked-in' | 'absent' = 'absent';
      if (record) {
        if (record.checkOut) status = 'completed';
        else status = 'clocked-in';
      }
      return {
        user: emp,
        record,
        status,
        duration: record ? formatDuration(record.checkIn, record.checkOut) : '—',
      };
    });
  }, [departmentUsers, attendanceList, rosterDate]);

  // Filter roster items by search and status
  const filteredRoster = useMemo(() => {
    return rosterItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.user.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'present' && (item.status === 'completed' || item.status === 'clocked-in')) ||
        (statusFilter === 'clocked-in' && item.status === 'clocked-in') ||
        (statusFilter === 'absent' && item.status === 'absent');

      return matchesSearch && matchesStatus;
    });
  }, [rosterItems, searchQuery, statusFilter]);

  // Compute daily stats for the active roster date
  const rosterStats = useMemo(() => {
    const total = rosterItems.length;
    const completed = rosterItems.filter((i) => i.status === 'completed').length;
    const clockedIn = rosterItems.filter((i) => i.status === 'clocked-in').length;
    const present = completed + clockedIn;
    const absent = total - present;
    const turnout = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, completed, clockedIn, present, absent, turnout };
  }, [rosterItems]);

  // Filtered chronological logs for "Logs" view mode
  const filteredLogs = useMemo(() => {
    return attendanceList.filter((item) => {
      if (selectedDept !== 'All' && item.user?.department !== selectedDept) return false;
      if (selectedEmp !== 'All' && item.userId !== selectedEmp) return false;
      if (selectedDate && item.date !== selectedDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (item.user?.name || '').toLowerCase().includes(q);
        const emailMatch = (item.user?.email || '').toLowerCase().includes(q);
        const deptMatch = (item.user?.department || '').toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [attendanceList, selectedDept, selectedEmp, selectedDate, searchQuery]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Suite Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <span>Workforce Management</span>
            <span className="text-slate-300">&bull;</span>
            <span>Enterprise Timesheets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEmployee
              ? 'My Daily Attendance'
              : isHOD
              ? `${user?.department} Team Attendance`
              : 'Enterprise Attendance Monitor'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEmployee
              ? 'Real-time punch in and punch out verified with server timestamping.'
              : isHOD
              ? `Authorized workforce monitoring for ${user?.department} Department staff.`
              : 'Global workforce attendance logs across all departments.'}
          </p>
        </div>

        {/* Live Digital Clock Badge */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Live Server Clock
              </div>
              <div className="text-xs font-mono font-bold text-slate-900">{liveTime}</div>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 border shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CircleCheckBig className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <CircleAlert className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* EMPLOYEE VIEW                                            */}
      {/* ========================================================= */}
      {isEmployee && (
        <div className="space-y-6">
          {/* Daily Punch Terminal Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-crm-card relative overflow-hidden">
            <div className="max-w-xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Biometric / Punch Terminal</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">Today's Workday Session</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enforces one punch session per calendar day with tamper-proof server timestamps.
                </p>
              </div>

              {/* Status Ribbon */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-left">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Check-In Time
                  </div>
                  <div className="text-xs font-bold text-slate-800 font-mono mt-1">
                    {todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : '—'}
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-3">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Check-Out Time
                  </div>
                  <div className="text-xs font-bold text-slate-800 font-mono mt-1">
                    {todayRecord?.checkOut ? formatTime(todayRecord.checkOut) : '—'}
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-3">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Status
                  </div>
                  <div className="mt-1">
                    {isCheckedOut ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    ) : isCheckedIn ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        In Progress
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Not Punched
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Punch Action Button */}
              <div className="pt-2">
                {isCheckedIn ? (
                  isCheckedOut ? (
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Workday attendance for today is successfully recorded and sealed.
                    </div>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      disabled={actionLoading}
                      className="px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{actionLoading ? 'Recording Server Check-Out...' : 'Punch Out (End Workday)'}</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <CircleCheckBig className="w-4 h-4" />
                    <span>{actionLoading ? 'Verifying & Punching...' : 'Punch In (Start Workday)'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-crm-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>My Attendance History Log</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{myRecords.length} records</span>
            </div>

            <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Hours Logged</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatReadableDate(rec.date)}
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-mono font-semibold">
                        {formatTime(rec.checkIn)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {rec.checkOut ? formatTime(rec.checkOut) : 'In Progress'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatDuration(rec.checkIn, rec.checkOut)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            rec.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {myRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No previous attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* HOD & ADMIN SUPERVISOR VIEW                               */}
      {/* ========================================================= */}
      {(isHOD || isAdmin) && (
        <div className="space-y-6">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Staff */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-crm-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Team Members
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {rosterStats.total}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span>{isAdmin ? 'All Departments' : `${user?.department} Team`}</span>
              </div>
            </div>

            {/* Card 2: Present on Date */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-crm-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Present on Date
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {rosterStats.present}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {rosterStats.turnout}% Turnout
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="truncate">{formatReadableDate(rosterDate)}</span>
              </div>
            </div>

            {/* Card 3: Clocked In / On Duty */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-crm-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Completed Shifts
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CheckCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600 tracking-tight">
                {rosterStats.completed}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                <span>Verified check-out completed</span>
              </div>
            </div>

            {/* Card 4: Absent / Not Punched */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-crm-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Absent / Pending
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <UserX className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600 tracking-tight">
                {rosterStats.absent}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                <span>No punch logged for {rosterDate}</span>
              </div>
            </div>
          </div>

          {/* View Modes & Navigation Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-crm-card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* View Mode Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start">
                <button
                  onClick={() => setViewMode('roster')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    viewMode === 'roster'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>Daily Roster</span>
                </button>

                <button
                  onClick={() => setViewMode('logs')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    viewMode === 'logs'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 text-brand-600" />
                  <span>Timesheet Logs</span>
                </button>

                <button
                  onClick={() => setViewMode('directory')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    viewMode === 'directory'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-brand-600" />
                  <span>Employee Directory</span>
                </button>
              </div>

              {/* Date Stepper Controls (for Roster View) */}
              {viewMode === 'roster' && (
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={() => handleDateStep(-1)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 font-mono flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>{formatReadableDate(rosterDate)}</span>
                  </div>

                  <button
                    onClick={() => handleDateStep(1)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <input
                    type="date"
                    value={rosterDate}
                    onChange={(e) => {
                      if (e.target.value) setRosterDate(e.target.value);
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none cursor-pointer"
                    title="Pick specific date"
                  />
                </div>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-brand-600 outline-none"
                />
              </div>

              {/* Department Selector (Admin only) */}
              {isAdmin && (
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400 font-medium hidden sm:inline">Dept:</span>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:border-brand-600 outline-none cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              )}

              {/* Status Chips (Roster view) */}
              {viewMode === 'roster' && (
                <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    All ({rosterStats.total})
                  </button>
                  <button
                    onClick={() => setStatusFilter('present')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'present'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Present ({rosterStats.present})
                  </button>
                  <button
                    onClick={() => setStatusFilter('absent')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'absent'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Absent ({rosterStats.absent})
                  </button>
                </div>
              )}

              {/* Employee selector for Logs view */}
              {viewMode === 'logs' && (
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400 font-medium hidden sm:inline">Employee:</span>
                  <select
                    value={selectedEmp}
                    onChange={(e) => setSelectedEmp(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:border-brand-600 outline-none cursor-pointer max-w-[200px] truncate"
                  >
                    <option value="All">All Employees</option>
                    {departmentUsers.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reset filter button if any active */}
              {(searchQuery || selectedEmp !== 'All' || (isAdmin && selectedDept !== 'All')) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedEmp('All');
                    setSelectedDept('All');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-brand-600 hover:text-brand-800 font-semibold cursor-pointer underline ml-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* VIEW MODE 1: DAILY FLOOR ROSTER                           */}
          {/* ========================================================= */}
          {viewMode === 'roster' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-crm-card">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>Roster Breakdown for {formatReadableDate(rosterDate)}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live check-in status, punch times, and calculated shift durations
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {filteredRoster.length} staff members
                </span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 font-medium">
                  <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading daily roster...
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No staff members match the selected criteria for this date.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Department Scope</th>
                        <th className="py-3 px-4">Check-In</th>
                        <th className="py-3 px-4">Check-Out</th>
                        <th className="py-3 px-4">Hours Logged</th>
                        <th className="py-3 px-4">Workday Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRoster.map((item) => (
                        <tr key={item.user.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {getInitials(item.user.name)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{item.user.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{item.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.user.department || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold">
                            {item.record?.checkIn ? (
                              <span className="text-emerald-700">{formatTime(item.record.checkIn)}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold">
                            {item.record?.checkOut ? (
                              <span className="text-indigo-700">{formatTime(item.record.checkOut)}</span>
                            ) : item.record?.checkIn ? (
                              <span className="text-amber-600 flex items-center gap-1 font-sans text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                In Progress
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                            {item.duration}
                          </td>
                          <td className="py-3 px-4">
                            {item.status === 'completed' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>Shift Completed</span>
                              </span>
                            )}
                            {item.status === 'clocked-in' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                <span>On Duty / In Office</span>
                              </span>
                            )}
                            {item.status === 'absent' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-500 border-slate-200">
                                Not Punched
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW MODE 2: TIMESHEET AUDIT LOGS                         */}
          {/* ========================================================= */}
          {viewMode === 'logs' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-crm-card">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ListFilter className="w-3.5 h-3.5 text-brand-600" />
                    <span>Chronological Timesheet Ledger</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Verified server audit records across departments
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {filteredLogs.length} records found
                </span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 font-medium">
                  <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No attendance records found matching the active filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Check-In</th>
                        <th className="py-3 px-4">Check-Out</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {getInitials(item.user?.name)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{item.user?.name || 'Staff Member'}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{item.user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.user?.department || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {formatReadableDate(item.date)}
                          </td>
                          <td className="py-3 px-4 text-emerald-700 font-mono font-semibold">
                            {formatTime(item.checkIn)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono font-semibold">
                            {item.checkOut ? formatTime(item.checkOut) : 'In Progress'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {formatDuration(item.checkIn, item.checkOut)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW MODE 3: EMPLOYEE SUMMARY DIRECTORY                   */}
          {/* ========================================================= */}
          {viewMode === 'directory' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {departmentUsers
                .filter(
                  (emp) =>
                    !searchQuery ||
                    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (emp.department || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((emp) => {
                  const empRecords = attendanceList.filter((a) => a.userId === emp.id);
                  const shiftsCount = empRecords.length;
                  const latestShift = empRecords[0];

                  return (
                    <div
                      key={emp.id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-crm-card hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {getInitials(emp.name)}
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {emp.department}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.email}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-center">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Shifts</div>
                          <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                            {shiftsCount}
                          </div>
                        </div>
                        <div className="border-l border-slate-200 pl-2">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Latest Date</div>
                          <div className="text-xs font-bold text-slate-700 font-mono mt-0.5 truncate">
                            {latestShift ? latestShift.date : 'None'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedEmp(emp.id);
                          setViewMode('logs');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Inspect Detailed Log</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
