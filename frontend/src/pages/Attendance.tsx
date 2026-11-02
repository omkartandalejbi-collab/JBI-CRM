import React, { useState, useEffect } from 'react';
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
  User as UserIcon,
  LogOut,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { user, isAdmin, isHOD, isEmployee } = useAuth();

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);

  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date().toLocaleTimeString()), 1000);
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
      setDepartmentUsers(teamRes.data || []);
      const attRes = await attendanceApi.getDepartmentAttendance({
        employeeId: selectedEmp === 'All' ? undefined : selectedEmp,
        date: selectedDate || undefined,
      });
      setAttendanceList(attRes.data || []);
    } catch (err) {
      console.error('Failed to load department attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const att = await attendanceApi.getAllAttendance({
        department: selectedDept === 'All' ? undefined : selectedDept,
        employeeId: selectedEmp === 'All' ? undefined : selectedEmp,
        date: selectedDate || undefined,
      });
      setAttendanceList(att);
      const usersRes = await usersApi.getAllUsers({
        department: selectedDept === 'All' ? undefined : selectedDept,
      });
      setDepartmentUsers(usersRes.data || []);
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
        text: `Checked in successfully at ${new Date(rec.checkIn).toLocaleTimeString()} (Server Time).`,
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
        text: `Checked out successfully at ${new Date(rec.checkOut!).toLocaleTimeString()} (Server Time).`,
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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-600" />
            {isEmployee
              ? 'My Daily Attendance'
              : isHOD
              ? `${user?.department} Department Attendance`
              : 'Company-Wide Attendance Monitor'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEmployee
              ? 'Mark attendance with Check-in and Check-out buttons (Server timestamps recorded).'
              : isHOD
              ? `Scoped strictly to ${user?.department} Department employees only.`
              : 'Admin View: Cross-department attendance monitoring across all 4 departments.'}
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs text-right self-start sm:self-auto">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Live Server Time</div>
          <div className="text-xs font-mono font-bold text-slate-800">{liveTime}</div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
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
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {isEmployee && (
        <div className="space-y-6">
          {/* Daily Punch Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs">
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="inline-flex p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Daily Attendance Punch</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attendance can be marked once per calendar day with strict server verification.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-6 py-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Check-In
                  </div>
                  <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                    {todayRecord?.checkIn
                      ? new Date(todayRecord.checkIn).toLocaleTimeString()
                      : '—'}
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Check-Out
                  </div>
                  <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                    {todayRecord?.checkOut
                      ? new Date(todayRecord.checkOut).toLocaleTimeString()
                      : '—'}
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Status
                  </div>
                  <div className="mt-0.5">
                    {isCheckedOut ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    ) : isCheckedIn ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Active Today
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Not Checked In
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {isCheckedIn ? (
                  isCheckedOut ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs font-medium inline-flex items-center gap-2">
                      <CircleCheckBig className="w-4 h-4 text-emerald-600" />
                      You have completed your attendance for today.
                    </div>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      disabled={actionLoading}
                      className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {actionLoading ? 'Recording Check-Out...' : 'Check Out (End Day)'}
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
                  >
                    <CircleCheckBig className="w-4 h-4" />
                    {actionLoading ? 'Recording Check-In...' : 'Check In (Start Day)'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              My Attendance History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check-In Time</th>
                    <th className="py-3 px-4">Check-Out Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {rec.date}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
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
                      <td colSpan={4} className="py-8 text-center text-slate-400">
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

      {(isHOD || isAdmin) && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>Filters:</span>
            </div>

            {isAdmin && (
              <div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="All">All 4 Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            )}

            {isHOD && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-600" />
                Department: {user?.department} (Locked)
              </div>
            )}

            <div>
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="All">All Department Employees</option>
                {departmentUsers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Filter by Date"
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Clear Date
              </button>
            )}
          </div>

          {/* Department Attendance Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading attendance data...
              </div>
            ) : attendanceList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No attendance logs found for the selected department / filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-In Time</th>
                      <th className="py-3 px-4">Check-Out Time</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            {item.user?.name || 'Employee'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.user?.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {item.user?.department || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {item.date}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 font-mono font-bold">
                          {item.checkIn ? new Date(item.checkIn).toLocaleTimeString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-amber-600 font-mono font-bold">
                          {item.checkOut
                            ? new Date(item.checkOut).toLocaleTimeString()
                            : 'In Progress'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
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
        </div>
      )}
    </div>
  );
};
