import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
  CheckCircle2,
  Building2,
  FileCheck2,
  Users2,
  BarChart3,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Invalid corporate email or password. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Left Showcase Side (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-r border-slate-800 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-glow-brand">
            JBI
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              JBI Enterprise CRM
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                v2.4 LTS
              </span>
            </div>
            <div className="text-xs text-slate-400">Jadhavar Business Intelligence Solutions</div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Unified Enterprise Operations & Financial Intelligence
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Next-generation platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-200">revenue, workforce</span> & compliance.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Engineered with strict Role-Based Access Control, automated recurring billing recovery, PDF tax invoice generation, and department-level workforce attendance tracking.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">Executive Billing</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Real-time revenue, recovery & PDF invoices</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-2">
                <Users2 className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">Workforce Timesheets</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Server-verified punch & department scoping</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">Strict RBAC Matrix</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Admin, HOD, Employee & CA auditor policies</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-2">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">Recurring MRR Engine</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Audit-proof rate revisions & multi-month logs</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SOC2 Type II &amp; 256-bit TLS Encrypted</span>
          </div>
          <span>&copy; {new Date().getFullYear()} JBI Inc.</span>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white text-slate-900 relative overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-6">
          {/* Mobile brand header (shown only when left is hidden) */}
          <div className="lg:hidden flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              JBI
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-slate-900">JBI Enterprise CRM</div>
              <div className="text-xs text-slate-500">Jadhavar Business Intelligence</div>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your portal</h2>
            <p className="text-xs text-slate-500">
              Enter your corporate credentials to access your authorized workspace.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@jbi.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-brand-600 focus:ring-3 focus:ring-brand-500/15 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-brand-600 focus:ring-3 focus:ring-brand-500/15 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-0 mr-2 cursor-pointer"
                />
                Remember my session
              </label>
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                TLS 256-bit
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-sm shadow-md shadow-brand-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to CRM Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Unauthorized access attempts are monitored and recorded under corporate audit policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
