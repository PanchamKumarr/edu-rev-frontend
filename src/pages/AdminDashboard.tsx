import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Users, BookOpen, BarChart3, Settings, LogOut, Menu, X,
  TrendingUp, Award, DollarSign, FileCheck, Plus,
  Edit, Trash2, Eye, Lock, Loader2, Search,
  CheckCircle, AlertCircle, ChevronDown, Shield,
  GraduationCap, BookMarked, Home, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { API_BASE, getAuthHeaders } from '../lib/api';
import { setAdminUserDashboardPreview } from '../lib/adminPreview';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const panelCls = 'bg-neutral-900/60 border border-white/[0.06] rounded-xl';
const inputCls =
  'w-full bg-[#111113] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none text-white placeholder-zinc-500 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20 transition-all';
const selectCls =
  'bg-[#111113] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] outline-none text-white [color-scheme:dark] focus:border-amber-400/60 transition-all';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useApi<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`${API_BASE}${url}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d as T);
        else setError(d.message || 'Error');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => { load(); }, [load, ...deps]);

  return { data, loading, error, reload: load };
}

function Toast({ msg, onDone }: { msg: { type: 'ok' | 'err'; text: string } | null; onDone: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[500] flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg text-[13px] font-medium transition-all ${
      msg.type === 'ok'
        ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-200'
        : 'bg-red-900/80 border-red-500/30 text-red-200'
    }`}>
      {msg.type === 'ok' ? <CheckCircle size={15} strokeWidth={2} /> : <AlertCircle size={15} strokeWidth={2} />}
      {msg.text}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-zinc-500" strokeWidth={1.75} />
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[20px] font-semibold tracking-tight text-white">{title}</h2>
      {sub && <p className="text-[13px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className={`${panelCls} p-5`}>
      <div className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.025] flex items-center justify-center text-zinc-300 mb-5">
        {icon}
      </div>
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-[26px] leading-none font-semibold tracking-tight text-white tabular-nums">{value}</p>
        {sub && <p className="text-[11.5px] text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: 'bg-amber-500/[0.1] text-amber-300 border-amber-500/20',
    instructor: 'bg-indigo-500/[0.1] text-indigo-300 border-indigo-500/20',
    student: 'bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/20',
  };
  return (
    <span className={`text-[10.5px] font-medium border px-2 py-0.5 rounded capitalize ${map[role] || 'bg-white/[0.04] text-zinc-400 border-white/[0.07]'}`}>
      {role}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/20',
    inactive: 'bg-red-500/[0.08] text-red-300 border-red-500/20',
    published: 'bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/20',
    draft: 'bg-amber-500/[0.08] text-amber-300 border-amber-500/20',
    archived: 'bg-zinc-500/[0.1] text-zinc-400 border-zinc-500/20',
    completed: 'bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/20',
    pending: 'bg-amber-500/[0.08] text-amber-300 border-amber-500/20',
    failed: 'bg-red-500/[0.08] text-red-300 border-red-500/20',
  };
  return (
    <span className={`text-[10.5px] font-medium border px-2 py-0.5 rounded capitalize ${map[status] || 'bg-white/[0.04] text-zinc-400 border-white/[0.07]'}`}>
      {status}
    </span>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'err', text: string) => setToast({ type, text });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/[0.08] border border-red-500/20 flex items-center justify-center mx-auto">
            <Lock size={28} strokeWidth={1.5} className="text-red-400" />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-white">Access Denied</h1>
          <p className="text-[13px] text-zinc-400">Only administrators can access this dashboard.</p>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 bg-white text-black px-5 py-2 rounded-md text-[13px] font-semibold hover:bg-zinc-200 transition-colors">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const MENU = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'A';

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection showToast={showToast} />;
      case 'users': return <UserManagement showToast={showToast} />;
      case 'courses': return <CourseManagement showToast={showToast} />;
      case 'payments': return <PaymentManagement />;
      case 'certificates': return <CertificateManagement />;
      case 'analytics': return <AnalyticsSection />;
      case 'settings': return <AdminSettingsSection showToast={showToast} />;
      default: return <OverviewSection showToast={showToast} />;
    }
  };

  const goTo = (id: string) => { setActiveSection(id); setSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans antialiased">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#0c0c0e] border-r border-white/[0.06] flex flex-col transition-transform duration-200 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-amber-500 text-black flex items-center justify-center shrink-0">
            <Shield size={14} strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <h1 className="text-[13px] font-semibold tracking-tight text-white">EDU<span className="text-zinc-600">·</span>REV</h1>
            <p className="text-[9px] uppercase tracking-[0.18em] text-amber-500/80 mt-1 font-semibold">Admin Panel</p>
          </div>
        </div>

        {/* Admin pill */}
        <div className="mx-3 mb-4 px-2.5 py-2 rounded-lg border border-white/[0.06] bg-white/[0.018] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11.5px] font-bold text-white shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium text-white truncate">{user?.name}</p>
            <p className="text-[9.5px] uppercase tracking-[0.14em] text-amber-500/80 font-semibold mt-0.5">Administrator</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-0.5">
          {MENU.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button key={id} onClick={() => goTo(id)}
                className={`relative w-full flex items-center gap-2.5 pl-3 pr-2 py-[7px] rounded-md transition-colors text-left ${
                  isActive ? 'bg-white/[0.045] text-white' : 'text-zinc-400 hover:text-white hover:bg-white/[0.025]'
                }`}
              >
                <span className={`absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full transition-colors ${isActive ? 'bg-amber-400' : 'bg-transparent'}`} />
                <Icon size={14.5} strokeWidth={1.75} className={isActive ? 'text-amber-300' : 'text-zinc-500'} />
                <span className="text-[13px] font-medium">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-3 py-3">
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
          >
            <LogOut size={14} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="md:ml-[240px] flex flex-col min-h-dvh">
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-3 px-4 md:px-8 border-b border-white/[0.06] bg-[#0a0a0b]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-white/[0.04] transition-colors">
              <Menu size={18} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-[12px] font-medium">
              <span className="text-zinc-500">Admin</span>
              <span className="text-zinc-700">/</span>
              <span className="text-white capitalize">{MENU.find(m => m.id === activeSection)?.label || activeSection}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAdminUserDashboardPreview();
                navigate('/dashboard/overview');
              }}
              className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-200 px-2.5 py-1.5 rounded-md border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
            >
              <Home size={12} strokeWidth={1.75} /> User dashboard
            </button>
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[12px] font-bold text-white">
              {initial}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1280px] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Toast msg={toast} onDone={() => setToast(null)} />
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewSection({ showToast }: { showToast: (t: 'ok' | 'err', m: string) => void }) {
  const { data: statsData, loading: statsLoading } = useApi<any>('/api/admin/stats');
  const { data: actData, loading: actLoading } = useApi<any>('/api/admin/activity');
  const stats = statsData?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 pb-2 border-b border-white/[0.05]">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Administration</p>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white mt-2 leading-tight">Platform overview</h1>
          <p className="text-[13.5px] text-zinc-400 mt-1">Monitor users, courses, revenue and activity in real time.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-amber-400/90 px-2.5 py-1.5 rounded-md border border-amber-500/[0.2] bg-amber-500/[0.07] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Admin mode
        </span>
      </div>

      {/* KPIs */}
      {statsLoading ? <Spinner /> : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<Users size={15} strokeWidth={1.75} />} label="Total users" value={stats.totalUsers} sub={`+${stats.newUsersThisMonth} this month`} />
          <StatCard icon={<BookOpen size={15} strokeWidth={1.75} />} label="Published courses" value={stats.publishedCourses} sub={`${stats.totalCourses} total`} />
          <StatCard icon={<GraduationCap size={15} strokeWidth={1.75} />} label="Enrollments" value={stats.totalEnrollments} />
          <StatCard icon={<DollarSign size={15} strokeWidth={1.75} />} label="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} sub="completed orders" />
        </div>
      )}

      {/* Secondary row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Users size={14} strokeWidth={1.75} />} label="Students" value={stats.students} />
          <StatCard icon={<BookMarked size={14} strokeWidth={1.75} />} label="Instructors" value={stats.instructors} />
          <StatCard icon={<Award size={14} strokeWidth={1.75} />} label="Certificates" value={stats.totalCertificates} />
          <StatCard icon={<TrendingUp size={14} strokeWidth={1.75} />} label="Pending payments" value={stats.pendingPayments} />
        </div>
      )}

      {/* Recent activity */}
      {!actLoading && actData && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent users */}
          <div className={`${panelCls} p-5`}>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-4">Recent registrations</p>
            <div className="space-y-2">
              {actData.recentUsers?.length === 0 && <p className="text-[13px] text-zinc-500">No users yet.</p>}
              {actData.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 py-1">
                  <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[11px] font-semibold text-zinc-300 shrink-0">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">{u.name}</p>
                    <p className="text-[11.5px] text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <RolePill role={u.role} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent courses */}
          <div className={`${panelCls} p-5`}>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-4">Recent courses</p>
            <div className="space-y-2">
              {actData.recentCourses?.length === 0 && <p className="text-[13px] text-zinc-500">No courses yet.</p>}
              {actData.recentCourses?.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 py-1">
                  <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <BookOpen size={12} strokeWidth={1.75} className="text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">{c.title}</p>
                    <p className="text-[11.5px] text-zinc-500">{c.enrollmentCount || 0} enrolled</p>
                  </div>
                  <StatusPill status={c.status || 'draft'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
function UserManagement({ showToast }: { showToast: (t: 'ok' | 'err', m: string) => void }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState({ search: '', role: '' });

  const url = `/api/admin/users?search=${encodeURIComponent(query.search)}&role=${query.role}&limit=50`;
  const { data, loading, reload } = useApi<any>(url, [query]);

  const users: any[] = data?.users || [];

  const applyFilter = () => setQuery({ search, role: roleFilter });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const r = await fetch(`${API_BASE}/api/admin/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success) { showToast('ok', 'User deleted'); reload(); }
      else showToast('err', d.message || 'Failed');
    } catch { showToast('err', 'Network error'); }
    finally { setDeletingId(null); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const d = await r.json();
      if (d.success) { showToast('ok', 'Role updated'); reload(); setEditUser(null); }
      else showToast('err', d.message || 'Failed');
    } catch { showToast('err', 'Network error'); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const d = await r.json();
      if (d.success) { showToast('ok', `User ${isActive ? 'activated' : 'deactivated'}`); reload(); }
      else showToast('err', d.message || 'Failed');
    } catch { showToast('err', 'Network error'); }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="User management" sub={`${data?.total ?? 0} total accounts`} />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilter()} placeholder="Search by name or email…" className={`${inputCls} max-w-xs`} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
        <button onClick={applyFilter} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[13px] font-semibold transition-colors">
          <Search size={13} strokeWidth={2} /> Search
        </button>
        <button onClick={() => { setSearch(''); setRoleFilter(''); setQuery({ search: '', role: '' }); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:text-white text-[13px] transition-colors">
          <RefreshCw size={13} strokeWidth={1.75} />
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className={`${panelCls} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">User</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Role</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Joined</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Enrollments</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-zinc-500">No users found.</td></tr>
                )}
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[11px] font-semibold text-zinc-300 shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[160px]">{u.name}</p>
                          <p className="text-[11.5px] text-zinc-500 truncate max-w-[160px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RolePill role={u.role} /></td>
                    <td className="px-4 py-3"><StatusPill status={u.isActive ? 'active' : 'inactive'} /></td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums text-[12px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">{u.enrollments ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setEditUser(u)} className="p-1.5 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-amber-300 transition-colors" title="Edit role">
                          <Edit size={13} strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id, !u.isActive)}
                          className={`p-1.5 rounded transition-colors ${u.isActive ? 'hover:bg-red-500/[0.08] text-zinc-500 hover:text-red-400' : 'hover:bg-emerald-500/[0.08] text-zinc-500 hover:text-emerald-400'}`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? <X size={13} strokeWidth={2} /> : <CheckCircle size={13} strokeWidth={1.75} />}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          disabled={deletingId === u.id}
                          className="p-1.5 rounded hover:bg-red-500/[0.08] text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          {deletingId === u.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} strokeWidth={1.75} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditUser(null)}
          >
            <motion.div initial={{ scale: 0.97, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97 }}
              className="bg-[#0c0c0e] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <p className="text-[15px] font-semibold text-white">Edit user role</p>
                <p className="text-[13px] text-zinc-500 mt-0.5">{editUser.name} · {editUser.email}</p>
              </div>
              <div className="space-y-2">
                {['student', 'instructor', 'admin'].map(r => (
                  <button key={r} onClick={() => handleRoleChange(editUser.id, r)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors text-[13.5px] font-medium ${
                      editUser.role === r ? 'border-amber-500/30 bg-amber-500/[0.08] text-amber-200' : 'border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-white/[0.12] hover:text-white'
                    }`}
                  >
                    <span className="capitalize">{r}</span>
                    {editUser.role === r && <CheckCircle size={14} strokeWidth={2} className="text-amber-400" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setEditUser(null)} className="w-full py-2 rounded-lg border border-white/[0.07] text-zinc-400 hover:text-white text-[13px] transition-colors">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Course Management ────────────────────────────────────────────────────────
function CourseManagement({ showToast }: { showToast: (t: 'ok' | 'err', m: string) => void }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const url = `/api/admin/courses?search=${encodeURIComponent(query)}&limit=50`;
  const { data, loading, reload } = useApi<any>(url, [query]);
  const courses: any[] = data?.courses || [];

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete course "${title}"? This will also remove all enrollments.`)) return;
    setDeletingId(id);
    try {
      const r = await fetch(`${API_BASE}/api/admin/courses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success) { showToast('ok', 'Course deleted'); reload(); }
      else showToast('err', d.message || 'Failed');
    } catch { showToast('err', 'Network error'); }
    finally { setDeletingId(null); }
  };

  const handleStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const r = await fetch(`${API_BASE}/api/admin/courses/${id}`, {
        method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (d.success) { showToast('ok', 'Status updated'); reload(); }
      else showToast('err', d.message || 'Failed');
    } catch { showToast('err', 'Network error'); }
    finally { setUpdatingId(null); }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Course management" sub={`${data?.total ?? 0} total courses`} />

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setQuery(search)} placeholder="Search by title…" className={`${inputCls} max-w-xs`} />
        <button onClick={() => setQuery(search)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[13px] font-semibold transition-colors">
          <Search size={13} strokeWidth={2} /> Search
        </button>
        <button onClick={() => { setSearch(''); setQuery(''); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:text-white text-[13px] transition-colors">
          <RefreshCw size={13} strokeWidth={1.75} />
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className={`${panelCls} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Course</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Instructor</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Students</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Price</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {courses.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-zinc-500">No courses found.</td></tr>
                )}
                {courses.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[200px]">{c.title}</p>
                      <p className="text-[11.5px] text-zinc-500 capitalize">{c.difficulty || c.level || '—'} · {c.category}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 truncate max-w-[140px]">{c.instructorName || '—'}</td>
                    <td className="px-4 py-3 text-zinc-300 tabular-nums">{c.enrollmentCount || 0}</td>
                    <td className="px-4 py-3 text-zinc-300">{c.isFree ? <span className="text-emerald-400">Free</span> : `$${c.price}`}</td>
                    <td className="px-4 py-3">
                      <div className="relative group">
                        <button className="flex items-center gap-1 text-[12px]">
                          <StatusPill status={c.status || 'draft'} />
                          <ChevronDown size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </button>
                        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:flex flex-col bg-[#111113] border border-white/[0.1] rounded-lg overflow-hidden shadow-xl min-w-[130px]">
                          {['draft', 'published', 'archived'].map(s => (
                            <button key={s} onClick={() => handleStatus(c.id, s)}
                              className={`px-3 py-2 text-left text-[12.5px] hover:bg-white/[0.06] transition-colors capitalize flex items-center justify-between ${c.status === s ? 'text-amber-300' : 'text-zinc-300'}`}
                            >
                              {s}
                              {updatingId === c.id && c.status !== s && <Loader2 size={11} className="animate-spin text-zinc-500" />}
                              {c.status === s && <CheckCircle size={11} className="text-amber-400" strokeWidth={2} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(c.id, c.title)}
                        disabled={deletingId === c.id}
                        className="p-1.5 rounded hover:bg-red-500/[0.08] text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete course"
                      >
                        {deletingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} strokeWidth={1.75} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────
function PaymentManagement() {
  const { data, loading } = useApi<any>('/api/admin/payments?limit=50');
  const orders: any[] = data?.orders || [];

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (Number(o.amount) || 0), 0);

  return (
    <div className="space-y-5">
      <SectionHeader title="Payment orders" sub={`${data?.total ?? 0} total orders · $${totalRevenue.toLocaleString()} revenue`} />

      {loading ? <Spinner /> : (
        <div className={`${panelCls} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Student</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Course</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Amount</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-zinc-500">No payment orders yet.</td></tr>
                )}
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-[12px] text-zinc-400">{o._id?.toString().slice(-8) || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{o.userName}</p>
                      <p className="text-[11.5px] text-zinc-500">{o.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 truncate max-w-[180px]">{o.courseTitle}</td>
                    <td className="px-4 py-3 font-semibold text-white tabular-nums">${Number(o.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusPill status={o.status || 'pending'} /></td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums text-[12px]">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Certificates ─────────────────────────────────────────────────────────────
function CertificateManagement() {
  const { data, loading } = useApi<any>('/api/admin/certificates?limit=50');
  const certs: any[] = data?.certificates || [];

  return (
    <div className="space-y-5">
      <SectionHeader title="Certificates" sub={`${data?.total ?? 0} total certificates issued`} />

      {loading ? <Spinner /> : (
        <div className={`${panelCls} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Cert ID</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Student</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Course</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Issued</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Verify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {certs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[13px] text-zinc-500">No certificates issued yet.</td></tr>
                )}
                {certs.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-[12px] text-zinc-400">{c.certId || c._id?.toString().slice(-8)}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{c.studentName}</p>
                      <p className="text-[11.5px] text-zinc-500">{c.studentEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 truncate max-w-[200px]">{c.courseTitle}</td>
                    <td className="px-4 py-3 text-zinc-400 text-[12px] tabular-nums">
                      {c.issuedDate ? new Date(c.issuedDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/verify/${c.certId}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[12.5px] text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Eye size={12} strokeWidth={1.75} /> View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function AnalyticsSection() {
  const { data: statsData, loading } = useApi<any>('/api/admin/stats');
  const stats = statsData?.stats;

  if (loading) return <Spinner />;
  if (!stats) return null;

  const roles = [
    { label: 'Students', value: stats.students, total: stats.totalUsers },
    { label: 'Instructors', value: stats.instructors, total: stats.totalUsers },
    { label: 'Admins', value: stats.admins, total: stats.totalUsers },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Platform analytics" sub="Real-time platform statistics from the database." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users size={14} strokeWidth={1.75} />} label="Total users" value={stats.totalUsers} sub={`+${stats.newUsersThisMonth} this month`} />
        <StatCard icon={<BookOpen size={14} strokeWidth={1.75} />} label="Total courses" value={stats.totalCourses} sub={`${stats.publishedCourses} published`} />
        <StatCard icon={<GraduationCap size={14} strokeWidth={1.75} />} label="Enrollments" value={stats.totalEnrollments} />
        <StatCard icon={<DollarSign size={14} strokeWidth={1.75} />} label="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} sub="completed orders" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Role distribution */}
        <div className={`${panelCls} p-5 space-y-4`}>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">User role distribution</p>
          {roles.map(({ label, value, total }) => {
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex justify-between mb-1.5 text-[13px]">
                  <span className="text-zinc-300">{label}</span>
                  <span className="text-zinc-400 tabular-nums">{value} <span className="text-zinc-600">({pct}%)</span></span>
                </div>
                <div className="h-[5px] bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Course health */}
        <div className={`${panelCls} p-5 space-y-4`}>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Course health</p>
          {[
            { label: 'Published', value: stats.publishedCourses, total: stats.totalCourses, color: 'bg-emerald-400' },
            { label: 'Draft', value: stats.totalCourses - stats.publishedCourses, total: stats.totalCourses, color: 'bg-amber-400' },
          ].map(({ label, value, total, color }) => {
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex justify-between mb-1.5 text-[13px]">
                  <span className="text-zinc-300">{label}</span>
                  <span className="text-zinc-400 tabular-nums">{value} <span className="text-zinc-600">({pct}%)</span></span>
                </div>
                <div className="h-[5px] bg-white/[0.05] rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t border-white/[0.05] grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10.5px] text-zinc-500">Certificates issued</p>
              <p className="text-[20px] font-semibold text-white tabular-nums mt-1">{stats.totalCertificates}</p>
            </div>
            <div>
              <p className="text-[10.5px] text-zinc-500">Pending payments</p>
              <p className="text-[20px] font-semibold text-white tabular-nums mt-1">{stats.pendingPayments}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function AdminSettingsSection({ showToast }: { showToast: (t: 'ok' | 'err', m: string) => void }) {
  return (
    <div className="space-y-5 max-w-2xl">
      <SectionHeader title="System settings" sub="Platform configuration and feature toggles." />

      <div className={`${panelCls} p-5 space-y-4`}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">General</p>
        {[
          { label: 'Platform name', value: 'EDU-REV' },
          { label: 'Support email', value: 'support@edu-rev.com' },
          { label: 'Default currency', value: 'USD' },
        ].map(s => (
          <div key={s.label}>
            <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 block mb-1.5">{s.label}</label>
            <input type="text" defaultValue={s.value} className={inputCls} />
          </div>
        ))}
        <button
          onClick={() => showToast('ok', 'Settings saved (demo — no backend persist yet)')}
          className="inline-flex items-center gap-2 bg-white text-black px-5 py-2 rounded-md text-[13px] font-semibold hover:bg-zinc-200 transition-colors mt-2"
        >
          Save changes
        </button>
      </div>

      <div className={`${panelCls} p-5 space-y-3`}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Feature toggles</p>
        {[
          { name: 'AI MCQ generation', on: true },
          { name: 'Career roadmap (Groq)', on: true },
          { name: 'Certificate generation', on: true },
          { name: 'Payment processing', on: true },
          { name: 'Live classes', on: true },
          { name: 'CAROA recommendations', on: true },
        ].map(f => (
          <div key={f.name} className="flex items-center justify-between bg-white/[0.025] border border-white/[0.06] rounded-lg px-4 py-3">
            <p className="text-[13px] text-white">{f.name}</p>
            <div className={`w-10 h-[22px] rounded-full p-[3px] ${f.on ? 'bg-amber-500' : 'bg-white/[0.08]'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${f.on ? 'translate-x-[18px]' : ''}`} />
            </div>
          </div>
        ))}
      </div>

      <div className={`${panelCls} p-5 space-y-3`}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Platform info</p>
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          {[
            { label: 'Backend', value: 'Node.js + Express' },
            { label: 'Database', value: 'MongoDB' },
            { label: 'AI Provider', value: 'Groq (Llama 3.3 70B)' },
            { label: 'Auth', value: 'JWT + Google OAuth' },
            { label: 'Version', value: '2.0' },
            { label: 'Features', value: '16 modules' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2.5">
              <p className="text-[10.5px] text-zinc-500 uppercase tracking-[0.12em]">{label}</p>
              <p className="text-white font-medium mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
