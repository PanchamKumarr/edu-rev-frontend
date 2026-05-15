import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut, Menu, X, Home, BookOpen, BarChart3, Settings,
  Clock, Trophy, TrendingUp, Bell, Star, Zap, Target, Timer,
  Plus, Trash2, Edit, Users, Bot, Brain, CheckCircle,
  ChevronRight, Send, RefreshCw, GraduationCap,
  Upload, Loader2, Video, MessageSquare, Award, CreditCard,
  FileText, Globe, Play, ArrowLeft, ArrowRight, CheckCircle2,
  BookMarked, ClipboardList, Sparkles, Eye, UserCheck, Maximize2, Minimize2, LayoutList,
  School, Mic2, NotebookText, Route,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../components/AuthProvider';
import { useConfirm } from '../components/ConfirmProvider';
import { API_BASE, getAuthHeaders } from '../lib/api';
import { getYoutubeEmbedSrc } from '../lib/youtube';
import { useI18n } from '../lib/i18n';
import {
  clearAdminUserDashboardPreview,
  isAdminUserDashboardPreview,
} from '../lib/adminPreview';
import { AssignmentsSection } from '../components/dashboard/AssignmentsSection';
import { LessonFilesManager } from '../components/dashboard/LessonFilesManager';
import ReactMarkdown from 'react-markdown';
import { CertificatesSection } from '../components/dashboard/CertificatesSection';
import { LiveClassesSection } from '../components/dashboard/LiveClassesSection';
import { DiscussionsSection } from '../components/dashboard/DiscussionsSection';
import { AnalyticsEnhanced } from '../components/dashboard/AnalyticsEnhanced';
import { MCQGeneratorSection } from '../components/dashboard/MCQGeneratorSection';
import { InstructorStudentInsightsSection } from '../components/dashboard/InstructorStudentInsightsSection';
import { InterviewModeSection } from '../components/dashboard/InterviewModeSection';
import { CareerPathSection } from '../components/dashboard/CareerPathSection';
import { SyllabusMatchPanel } from '../components/dashboard/SyllabusMatchPanel';
import { PaymentSection } from '../components/dashboard/PaymentSection';
import { NotificationsPanel, NotificationBadge } from '../components/dashboard/NotificationsPanel';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Course {
  id: string; title: string; description: string; category: string;
  instructorId: string; instructorName: string; price: number; isFree: boolean;
  thumbnail?: string; difficulty: string; modules: any[];
  rating: number; reviewCount: number; enrollmentCount: number; status: string;
  assignmentCount?: number;
}
interface Enrollment {
  id: string; courseId: string; progress: number;
  completedModules: string[]; enrolledAt: string; course: Course | null;
}
interface MCQQuestion { question: string; options: string[]; correctAnswer: number; explanation: string; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: Date; }

const inputCls = 'w-full bg-[#111113] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/20 transition-all text-white placeholder-zinc-500';
const selectCls = 'w-full bg-[#111113] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/20 transition-all text-white [color-scheme:dark]';
const panelCls = 'bg-neutral-900/60 border border-white/[0.06] rounded-xl';
const sectionHeading = (label: string, sub?: string) => (
  <div className="mb-6">
    <h2 className="text-[20px] font-semibold tracking-tight text-white">{label}</h2>
    {sub && <p className="text-[13px] text-zinc-500 mt-1 leading-relaxed">{sub}</p>}
  </div>
);

// ─── Main Dashboard Layout ────────────────────────────────────────────────────
export function DashboardLayout() {
  const navigate = useNavigate();
  const { section: sectionParam } = useParams<{ section?: string }>();
  const { user, logout, updateUser } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (user?.role === 'admin' && !isAdminUserDashboardPreview()) {
      navigate('/admin', { replace: true });
    }
  }, [user?.role, navigate]);

  const handleLogout = () => { logout(); navigate('/'); };

  const goTo = (id: string) => {
    navigate(`/dashboard/${id}`);
    setSidebarOpen(false);
  };

  const getMenuGroups = () => {
    const workspace = [
      { id: 'overview', label: t('overview'), icon: Home },
      { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    ];
    const studentItems = [
      { id: 'browse', label: t('browse'), icon: BookOpen },
      { id: 'enrolled', label: t('enrolled'), icon: GraduationCap },
      { id: 'assignments', label: t('assignments'), icon: FileText },
      { id: 'live', label: t('liveClasses'), icon: Video },
      { id: 'discussions', label: t('discussions'), icon: MessageSquare },
      { id: 'certificates', label: t('certificates'), icon: Award },
      { id: 'payment', label: t('payment'), icon: CreditCard },
    ];
    const instructorItems = [
      { id: 'my-courses', label: t('myCourses'), icon: BookOpen },
      { id: 'create-course', label: t('createCourse'), icon: Plus },
      { id: 'student-insights', label: 'Student insights', icon: School },
      { id: 'assignments', label: t('assignments'), icon: FileText },
      { id: 'live', label: t('liveClasses'), icon: Video },
      { id: 'discussions', label: t('discussions'), icon: MessageSquare },
    ];
    const intelligence = [
      { id: 'interview', label: 'Interview mode', icon: Mic2 },
      { id: 'career-path', label: t('careerPath'), icon: Route },
      { id: 'mcq-generator', label: t('mcqGenerator'), icon: Brain },
      { id: 'ai-assistant', label: t('aiAssistant'), icon: Bot },
    ];
    const account = [{ id: 'settings', label: t('settings'), icon: Settings }];

    return [
      { id: 'workspace', label: 'Workspace', items: workspace },
      {
        id: 'role',
        label: user?.role === 'instructor' ? 'Teaching' : 'Learning',
        items: user?.role === 'instructor' ? instructorItems : studentItems,
      },
      { id: 'intelligence', label: 'Intelligence', items: intelligence },
      { id: 'account', label: 'Account', items: account },
    ];
  };

  const getMenuItems = () => getMenuGroups().flatMap((g) => g.items);

  const VALID_SECTIONS = new Set(getMenuItems().map((m) => m.id));
  const activeSection = (sectionParam && VALID_SECTIONS.has(sectionParam)) ? sectionParam : 'overview';

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection user={user} role={user?.role || 'student'} onNavigate={goTo} />;
      case 'browse': return <BrowseCoursesSection />;
      case 'enrolled': return <EnrolledCoursesSection />;
      case 'my-courses': return <MyCoursesSection user={user} onNavigate={goTo} />;
      case 'student-insights': return <InstructorStudentInsightsSection />;
      case 'create-course': return <CreateCourseSection onSuccess={() => goTo('my-courses')} />;
      case 'assignments': return <AssignmentsSection user={user} role={user?.role || 'student'} />;
      case 'live': return <LiveClassesSection role={user?.role || 'student'} />;
      case 'discussions': return <DiscussionsSection user={user} />;
      case 'certificates': return <CertificatesSection />;
      case 'payment': return <PaymentSection />;
      case 'mcq-generator': return <MCQGeneratorSection />;
      case 'interview': return <InterviewModeSection />;
      case 'career-path': return <CareerPathSection />;
      case 'ai-assistant': return <AIAssistantSection />;
      case 'analytics': return <AnalyticsEnhanced role={user?.role || 'student'} />;
      case 'settings': return <SettingsSection user={user} lang={lang} setLang={setLang} updateUser={updateUser} />;
      default: return <OverviewSection user={user} role={user?.role || 'student'} onNavigate={goTo} />;
    }
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';
  const sectionLabel = getMenuItems().find((m) => m.id === activeSection)?.label || activeSection;
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden font-sans antialiased">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed so it stays pinned while main content scrolls */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] min-h-0 h-dvh max-h-dvh bg-[#0c0c0e] border-r border-white/[0.06] flex flex-col shrink-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-black text-[13px] tracking-tighter shadow-sm">
            E
          </div>
          <div className="leading-none">
            <h1 className="text-[13px] font-semibold tracking-tight text-white">
              EDU<span className="text-zinc-600">·</span>REV
            </h1>
            <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500 mt-1 font-medium">
              Learning OS
            </p>
          </div>
        </div>

        {/* User pill */}
        <div className="mx-3 mb-4 px-2.5 py-2 rounded-lg border border-white/[0.06] bg-white/[0.018] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11.5px] font-bold shadow-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium text-white truncate leading-snug tracking-tight">
              {user?.name ?? 'Account'}
            </p>
            <p className="text-[9.5px] uppercase tracking-[0.14em] text-zinc-500 font-semibold mt-0.5">
              {user?.role ?? 'guest'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-emerald-400/90 px-1.5 py-0.5 rounded-md bg-emerald-500/[0.08] border border-emerald-500/[0.16]">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        {/* Grouped nav */}
        <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-5">
          {getMenuGroups().map((group) => (
            <div key={group.id}>
              <p className="px-2.5 mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(item.id)}
                      className={`group relative w-full flex items-center gap-2.5 pl-3 pr-2 py-[7px] rounded-md transition-colors text-left ${
                        isActive
                          ? 'bg-white/[0.045] text-white'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.025]'
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full transition-colors ${
                          isActive ? 'bg-indigo-400' : 'bg-transparent'
                        }`}
                      />
                      <Icon
                        size={14.5}
                        strokeWidth={1.75}
                        className={isActive ? 'text-indigo-300' : 'text-zinc-500 group-hover:text-zinc-300'}
                      />
                      <span className="text-[13px] font-medium tracking-[-0.005em] truncate">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-3 py-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
          >
            <LogOut size={14} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
          <p className="px-3 mt-2 text-[10px] text-zinc-600 truncate" title={user?.email || ''}>
            {user?.email || ''}
          </p>
        </div>
      </aside>

      {/* Main Content — offset on md+ for fixed sidebar */}
      <main className="min-h-dvh md:ml-[260px] overflow-hidden flex flex-col min-w-0">
        {user?.role === 'admin' && isAdminUserDashboardPreview() && (
          <div className="shrink-0 z-40 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-amber-500/25 bg-amber-950/35 text-[12.5px] text-amber-100/95">
            <span>
              Admin preview: you are using the learner dashboard layout (same as students).
            </span>
            <button
              type="button"
              onClick={() => {
                clearAdminUserDashboardPreview();
                navigate('/admin');
              }}
              className="shrink-0 rounded-md border border-amber-400/35 bg-amber-500/15 px-3 py-1.5 font-semibold text-amber-50 hover:bg-amber-500/25 transition-colors"
            >
              Back to admin
            </button>
          </div>
        )}
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-3 px-4 md:px-8 border-b border-white/[0.06] bg-[#0a0a0b]/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-zinc-400 hover:text-white p-1.5 -ml-1 rounded-md hover:bg-white/[0.04] transition-colors"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-[12px] font-medium">
              <span className="text-zinc-500">Dashboard</span>
              <span className="text-zinc-700">/</span>
              <span className="text-white tracking-tight">{sectionLabel}</span>
            </div>
            <h2 className="md:hidden text-[15px] font-semibold text-white tracking-tight truncate">
              {sectionLabel}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Date pill */}
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 px-2.5 py-1.5 rounded-md border border-white/[0.06] bg-white/[0.018] tabular-nums">
              <Clock size={11} strokeWidth={1.75} />
              {todayLabel}
            </span>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                aria-label="Notifications"
              >
                <Bell size={16} strokeWidth={1.75} />
                <NotificationBadge />
              </button>
              <div className="absolute right-0 top-0">
                <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
              </div>
            </div>

            {/* Language */}
            <div className="hidden sm:flex items-center gap-0.5 bg-white/[0.025] border border-white/[0.06] rounded-md p-0.5">
              {(['en', 'hi', 'es'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-[5px] tracking-[0.06em] transition-colors ${
                    lang === l ? 'bg-white/[0.07] text-white' : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Avatar */}
            <button
              type="button"
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-white/[0.04] transition-colors"
              onClick={() => goTo('settings')}
              title="Account settings"
            >
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[12px] font-bold text-white shadow-sm">
                {initial}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-[12px] font-medium text-white tracking-tight">
                  {user?.name?.split(' ')[0] ?? 'Account'}
                </p>
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-zinc-500 font-semibold">
                  {user?.role}
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1280px] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

const EMPTY_WEEK_CHART = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, minutes: 0 }));

// ─── Overview Section ─────────────────────────────────────────────────────────
function OverviewSection({ user, role, onNavigate }: { user: any; role: string; onNavigate: (s: string) => void }) {
  const { t } = useI18n();
  const [stats, setStats] = useState({ enrollments: 0, courses: 0, progress: 0, completed: 0 });
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; minutes: number }[]>(() => [...EMPTY_WEEK_CHART]);
  const [weekRangeLabel, setWeekRangeLabel] = useState('This week');

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/weekly-activity`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.days) && d.days.length > 0) {
          setWeeklyActivity(d.days);
          if (d.weekStart) {
            const a = new Date(d.weekStart);
            const b = new Date(a);
            b.setUTCDate(a.getUTCDate() + 6);
            const fmt = (x: Date) =>
              x.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
            setWeekRangeLabel(`${fmt(a)} – ${fmt(b)}`);
          }
        }
      })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    if (role === 'student') {
      fetch(`${API_BASE}/api/enrollments`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            const enrs: Enrollment[] = d.enrollments;
            setEnrollments(enrs);
            const avg = enrs.length > 0 ? enrs.reduce((s, e) => s + e.progress, 0) / enrs.length : 0;
            const completed = enrs.filter(e => e.progress >= 100).length;
            setStats({ enrollments: enrs.length, courses: enrs.length, progress: Math.round(avg), completed });
          }
        }).catch(() => {});
    } else if (role === 'instructor') {
      fetch(`${API_BASE}/api/courses/my`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            const total = d.courses.reduce((s: number, c: Course) => s + (c.enrollmentCount || 0), 0);
            setStats({ enrollments: total, courses: d.courses.length, progress: 0, completed: 0 });
          }
        }).catch(() => {});
    }
  }, [role]);

  const completionPct = stats.enrollments > 0 ? Math.round((stats.completed / stats.enrollments) * 100) : 0;

  const studentFeatures = [
    { icon: Route, label: t('careerPath'), desc: 'Plan a path from a single goal.', section: 'career-path' },
    { icon: Brain, label: t('mcqGenerator'), desc: 'Generate practice questions on any topic.', section: 'mcq-generator' },
    { icon: Bot, label: t('aiAssistant'), desc: 'Ask, summarize, and study faster.', section: 'ai-assistant' },
  ];

  const instructorFeatures = [
    { icon: Plus, label: t('createCourse'), desc: 'Build a new course end-to-end.', section: 'create-course' },
    { icon: School, label: 'Student insights', desc: 'Per-learner progress and AI briefs.', section: 'student-insights' },
    { icon: Bot, label: t('aiAssistant'), desc: 'Drafting and teaching support.', section: 'ai-assistant' },
  ];

  const features = role === 'instructor' ? instructorFeatures : studentFeatures;

  const now = new Date();
  const hour = now.getHours();
  const partOfDay = hour < 5 ? 'evening' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user?.name?.split(' ')[0] || 'there';

  const subline =
    role === 'student'
      ? stats.enrollments === 0
        ? 'Pick a course to start; your activity will populate here as you go.'
        : `You're enrolled in ${stats.enrollments} course${stats.enrollments === 1 ? '' : 's'} — ${stats.progress}% average progress, ${stats.completed} completed.`
      : stats.courses === 0
      ? 'Publish a course to start tracking enrollments, submissions, and engagement.'
      : `You're managing ${stats.courses} course${stats.courses === 1 ? '' : 's'} with ${stats.enrollments} active enrollment${stats.enrollments === 1 ? '' : 's'}.`;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-white/[0.05]">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {dateLabel}
          </p>
          <h1 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-white mt-2 leading-tight">
            Good {partOfDay}, {firstName}.
          </h1>
          <p className="text-[13.5px] text-zinc-400 mt-2 max-w-2xl leading-relaxed">{subline}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-emerald-400/90 px-2 py-1 rounded-md border border-emerald-500/[0.18] bg-emerald-500/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            All systems operational
          </span>
        </div>
      </header>

      {/* KPI strip */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            icon={<Trophy size={15} strokeWidth={1.75} />}
            label={role === 'instructor' ? 'Published courses' : 'Enrolled courses'}
            value={String(stats.courses)}
            sublabel={role === 'instructor' ? 'live in catalog' : 'in catalog'}
          />
          <MetricCard
            icon={<Users size={15} strokeWidth={1.75} />}
            label={role === 'instructor' ? 'Total students' : 'In progress'}
            value={String(
              role === 'instructor' ? stats.enrollments : Math.max(0, stats.enrollments - stats.completed)
            )}
            sublabel={role === 'instructor' ? 'across courses' : 'still active'}
          />
          <MetricCard
            icon={<TrendingUp size={15} strokeWidth={1.75} />}
            label={role === 'student' ? 'Average progress' : 'Engagement'}
            value={role === 'student' ? `${stats.progress}%` : '—'}
            sublabel={role === 'student' ? 'across enrolments' : 'updated daily'}
          />
          <MetricCard
            icon={role === 'instructor' ? <BarChart3 size={15} strokeWidth={1.75} /> : <CheckCircle2 size={15} strokeWidth={1.75} />}
            label={role === 'instructor' ? 'Active learners' : 'Completed'}
            value={String(role === 'instructor' ? stats.enrollments : stats.completed)}
            sublabel={role === 'instructor' ? 'this period' : `${completionPct}% completion`}
          />
        </div>
      </section>

      {/* Activity + snapshot */}
      <section className="grid lg:grid-cols-3 gap-3">
        {/* Activity */}
        <div className="lg:col-span-2 bg-neutral-900/60 border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Activity
              </p>
              <h3 className="text-[15px] font-semibold tracking-tight text-white mt-1.5">
                Weekly learning activity
              </h3>
              <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed max-w-md">
                {role === 'instructor'
                  ? 'Submissions on your courses plus your own activity.'
                  : 'Study time estimated from activity, quizzes, and interview sessions.'}
              </p>
            </div>
            <span className="text-[10.5px] font-medium text-zinc-400 px-2 py-1 rounded-md border border-white/[0.06] bg-white/[0.02] tabular-nums whitespace-nowrap">
              {weekRangeLabel}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyActivity} margin={{ top: 5, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fill: '#71717a', fontSize: 10.5, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={4}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10.5, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: '#0f0f10',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: 11,
                  padding: '6px 10px',
                }}
                labelStyle={{ color: '#a1a1aa', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#818cf8"
                strokeWidth={1.5}
                fill="url(#activityGrad)"
                dot={false}
                activeDot={{ r: 3.5, fill: '#a5b4fc', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Snapshot */}
        <div className="bg-neutral-900/60 border border-white/[0.06] rounded-xl p-5 flex flex-col">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Snapshot
          </p>
          <h3 className="text-[15px] font-semibold tracking-tight text-white mt-1.5">
            {role === 'student' ? 'Completion' : 'Coverage'}
          </h3>
          {stats.enrollments > 0 ? (
            <>
              <div className="mt-5 flex items-baseline gap-2">
                <p className="text-[34px] leading-none font-semibold tracking-[-0.02em] text-white tabular-nums">
                  {completionPct}%
                </p>
                <p className="text-[12px] text-zinc-500">
                  {stats.completed} of {stats.enrollments}
                </p>
              </div>
              <div className="w-full h-[5px] bg-white/[0.05] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-indigo-400 rounded-full transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="mt-5 space-y-2 text-[12px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Completed
                  </span>
                  <span className="tabular-nums text-zinc-200">{stats.completed}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    In progress
                  </span>
                  <span className="tabular-nums text-zinc-200">
                    {Math.max(0, stats.enrollments - stats.completed)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center mt-4">
              <div>
                <BookOpen size={22} className="text-zinc-700 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-[12px] text-zinc-500 max-w-[180px] leading-relaxed">
                  {role === 'student'
                    ? 'Enroll in a course to populate this panel.'
                    : 'Publish a course to populate this panel.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Continue learning (student) */}
      {role === 'student' && enrollments.length > 0 && (
        <section className="bg-neutral-900/60 border border-white/[0.06] rounded-xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Learning
              </p>
              <h3 className="text-[15px] font-semibold tracking-tight text-white mt-1">
                Continue where you left off
              </h3>
            </div>
            <button
              onClick={() => onNavigate('enrolled')}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-400 hover:text-white transition-colors"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="border-t border-white/[0.05]">
            {enrollments.slice(0, 4).map((enr, idx) => {
              const status =
                enr.progress >= 100
                  ? { label: 'Completed', cls: 'text-emerald-400 bg-emerald-500/[0.08] border-emerald-500/[0.18]' }
                  : enr.progress > 0
                  ? { label: 'In progress', cls: 'text-indigo-300 bg-indigo-500/[0.08] border-indigo-500/[0.18]' }
                  : { label: 'Not started', cls: 'text-zinc-400 bg-white/[0.03] border-white/[0.08]' };
              return (
                <div
                  key={enr.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    idx > 0 ? 'border-t border-white/[0.04]' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {enr.course?.thumbnail ? (
                      <img
                        src={`${API_BASE}${enr.course.thumbnail}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen size={14} className="text-zinc-400" strokeWidth={1.75} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-white truncate tracking-tight">
                        {enr.course?.title || 'Course'}
                      </p>
                      <span
                        className={`hidden md:inline-flex shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md border ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full transition-all"
                          style={{ width: `${enr.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-zinc-500 tabular-nums shrink-0 w-9 text-right">
                        {enr.progress}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('enrolled')}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-md border border-white/[0.06] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.05] transition-colors shrink-0"
                  >
                    Resume <ArrowRight size={11} strokeWidth={1.75} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tools */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Tools
            </p>
            <h3 className="text-[15px] font-semibold tracking-tight text-white mt-1">
              {role === 'instructor' ? 'Teaching workspace' : 'Learning workspace'}
            </h3>
          </div>
          <button
            onClick={() => onNavigate(role === 'instructor' ? 'my-courses' : 'browse')}
            className="text-[12px] font-medium text-zinc-400 hover:text-white transition-colors hidden md:inline-flex items-center gap-1"
          >
            View library <ChevronRight size={13} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <button
              key={f.section}
              onClick={() => onNavigate(f.section)}
              className="group bg-neutral-900/60 border border-white/[0.06] rounded-xl p-5 text-left hover:border-white/[0.14] hover:bg-neutral-900 transition-colors"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.025] flex items-center justify-center text-zinc-300">
                  <f.icon size={15} strokeWidth={1.75} />
                </div>
                <ArrowRight
                  size={13}
                  strokeWidth={1.75}
                  className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <p className="text-[13.5px] font-semibold text-white tracking-tight">{f.label}</p>
              <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">{f.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Browse: single-page course preview ──────────────────────────────────────
function BrowseCourseDetailOverlay({
  courseId,
  onClose,
  enrolled,
  enrolling,
  onEnroll,
}: {
  courseId: string;
  onClose: () => void;
  enrolled: boolean;
  enrolling: boolean;
  onEnroll: (id: string, isFree: boolean, price: number) => void;
}) {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    setErr('');
    fetch(`${API_BASE}/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCourse(d.course);
        else setErr(d.message || 'Could not load course');
      })
      .catch(() => setErr('Network error'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const canSyllabusMatch =
    !!course &&
    (enrolled ||
      user?.role === 'admin' ||
      (!!user?.id && course.instructorId === user.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-[#0a0a0b] overflow-y-auto"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-white/[0.06] bg-[#0a0a0b]/90 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-[13px] font-medium px-2.5 py-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={2} /> Back to browse
        </button>
        {course && (
          <span className="hidden sm:block text-[13px] text-zinc-600 truncate">/ {course.title}</span>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {loading ? (
          <Spinner />
        ) : err ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-5 text-red-300 text-[13px]">{err}</div>
        ) : course ? (
          <div className="space-y-6">
            {/* ── Hero ── */}
            <div className="rounded-xl border border-white/[0.06] bg-neutral-900/60 overflow-hidden">
              {/* Thumbnail */}
              <div className="h-[200px] sm:h-[240px] bg-[#141415] relative overflow-hidden">
                {course.thumbnail ? (
                  <img src={`${API_BASE}${course.thumbnail}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={48} className="text-zinc-700" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <span className="text-[10.5px] bg-indigo-500/[0.15] text-indigo-200 border border-indigo-500/[0.2] px-2 py-0.5 rounded font-medium">{course.category}</span>
                    <span className="text-[10.5px] bg-white/[0.08] text-zinc-300 border border-white/[0.1] px-2 py-0.5 rounded capitalize">{course.difficulty}</span>
                    <span className={`text-[10.5px] px-2 py-0.5 rounded font-medium border ${course.isFree ? 'bg-emerald-500/[0.12] text-emerald-200 border-emerald-500/[0.2]' : 'bg-amber-500/[0.12] text-amber-200 border-amber-500/[0.2]'}`}>
                      {course.isFree ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                  <h1 className="text-[22px] sm:text-[26px] font-semibold text-white tracking-tight leading-tight">{course.title}</h1>
                  {course.instructorName ? (
                    <p className="text-[12.5px] text-zinc-400 mt-1.5">Instructor · {course.instructorName}</p>
                  ) : null}
                </div>
              </div>

              {/* Body — two columns on lg+ */}
              <div className="grid lg:grid-cols-[1fr_260px] gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
                {/* Left: about + stats */}
                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-2">About this course</p>
                    <p className="text-[13.5px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[12.5px] text-zinc-400 border-t border-white/[0.05] pt-4">
                    <span className="flex items-center gap-1.5"><Users size={13} strokeWidth={1.75} className="text-zinc-500" />{course.enrollmentCount || 0} learners</span>
                    <span className="flex items-center gap-1.5"><LayoutList size={13} strokeWidth={1.75} className="text-zinc-500" />{course.modules?.length || 0} modules</span>
                    {course.rating > 0 ? (
                      <span className="flex items-center gap-1.5"><Star size={13} strokeWidth={0} className="fill-amber-400 text-amber-400" />{course.rating.toFixed(1)} ({course.reviewCount} reviews)</span>
                    ) : null}
                  </div>
                </div>

                {/* Right: enrollment CTA */}
                <div className="p-5 sm:p-6 flex flex-col gap-3 justify-center">
                  {enrolled ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/[0.1] border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-emerald-400" strokeWidth={1.75} />
                      </div>
                      <p className="text-[13.5px] font-semibold text-white">You are enrolled</p>
                      <p className="text-[12px] text-zinc-500">Head to My Learning to continue.</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="text-[28px] font-semibold text-white tracking-tight">
                          {course.isFree ? 'Free' : `$${course.price}`}
                        </p>
                        <p className="text-[12px] text-zinc-500 mt-0.5">Full lifetime access</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEnroll(course.id, course.isFree, course.price)}
                        disabled={enrolling}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-md text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        {enrolling ? <Loader2 size={15} className="animate-spin" strokeWidth={2} /> : <Play size={14} fill="currentColor" strokeWidth={0} />}
                        {course.isFree ? 'Enroll free' : `Buy for $${course.price}`}
                      </button>
                      <p className="text-[11px] text-zinc-600 text-center">No commitment — unenroll anytime</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Reviews ── */}
            <CourseReviewsReadOnlyBlock courseId={course.id} />

            {/* ── Curriculum ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LayoutList size={15} strokeWidth={1.75} className="text-zinc-400" />
                <h2 className="text-[15px] font-semibold text-white tracking-tight">Curriculum</h2>
                <span className="text-[11px] text-zinc-500 ml-1">{course.modules?.length || 0} module{(course.modules?.length || 0) !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {(course.modules || []).map((mod: any, mi: number) => (
                  <div key={mi} className="rounded-lg border border-white/[0.06] bg-neutral-900/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.05] flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-indigo-600/60 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">{mi + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-white">{mod.title || `Module ${mi + 1}`}</p>
                        {mod.description ? <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">{mod.description}</p> : null}
                      </div>
                    </div>
                    <ul className="divide-y divide-white/[0.04]">
                      {(mod.lessons || []).map((les: any, li: number) => (
                        <li key={li} className="px-4 py-2.5 flex items-center gap-3">
                          <span className="w-5 h-5 rounded bg-white/[0.04] flex items-center justify-center text-[10.5px] font-mono text-zinc-500 shrink-0">{li + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-zinc-200 truncate">{les.title || `Lesson ${li + 1}`}</p>
                          </div>
                          <span className="text-[10.5px] text-zinc-600 shrink-0">
                            {les.videoUrl ? 'Video' : les.content ? 'Notes' : 'Lesson'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Syllabus vs course ── */}
            <div className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <NotebookText size={15} strokeWidth={1.75} className="text-violet-300" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-white tracking-tight">Syllabus vs course</h2>
                  <p className="text-[12px] text-zinc-500">AI-powered curriculum alignment check</p>
                </div>
              </div>
              {canSyllabusMatch ? (
                <SyllabusMatchPanel courseId={course.id} courseTitle={course.title} />
              ) : (
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  Enroll in this course to paste or upload your class syllabus and compare it to this curriculum with AI (coverage, gaps, and tips).
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── Browse Courses Section ───────────────────────────────────────────────────
function BrowseCoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ category: '', difficulty: '', free: '' });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewCourseId, setViewCourseId] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/courses`).then(r => r.json()),
      fetch(`${API_BASE}/api/enrollments`, { headers: getAuthHeaders() }).then(r => r.json())
    ]).then(([c, e]) => {
      if (c.success) setCourses(c.courses);
      if (e.success) setEnrolled(new Set(e.enrollments.map((en: Enrollment) => en.courseId)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (courseId: string, isFree: boolean, price: number) => {
    if (!isFree && price > 0) {
      setMsg({ type: 'error', text: 'This is a paid course. Go to Payments to purchase.' });
      return;
    }
    setEnrolling(courseId);
    setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/enrollments`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ courseId }),
      });
      const d = await r.json();
      if (d.success) {
        setEnrolled(prev => new Set([...prev, courseId]));
        setMsg({ type: 'success', text: 'Enrolled successfully!' });
      } else {
        setMsg({ type: 'error', text: d.message || 'Failed to enroll' });
      }
    } catch { setMsg({ type: 'error', text: 'Network error' }); }
    finally { setEnrolling(null); }
  };

  const categories = [...new Set(courses.map(c => c.category))];
  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filter.category || c.category === filter.category;
    const matchDiff = !filter.difficulty || c.difficulty === filter.difficulty;
    const matchFree = !filter.free || (filter.free === 'free' ? c.isFree : !c.isFree);
    return matchSearch && matchCat && matchDiff && matchFree;
  });

  if (loading) return <Spinner />;

  return (
    <>
    <div className="space-y-5">
      {sectionHeading('Browse courses', `${filtered.length} course${filtered.length === 1 ? '' : 's'} in catalog`)}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or category…"
          className={`${inputCls} flex-1`} />
        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))} className="bg-[#111113] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] outline-none text-white [color-scheme:dark] min-w-[130px]">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filter.difficulty} onChange={e => setFilter(f => ({ ...f, difficulty: e.target.value }))} className="bg-[#111113] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] outline-none text-white [color-scheme:dark] min-w-[110px]">
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select value={filter.free} onChange={e => setFilter(f => ({ ...f, free: e.target.value }))} className="bg-[#111113] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] outline-none text-white [color-scheme:dark] min-w-[100px]">
          <option value="">All prices</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] border ${msg.type === 'success' ? 'bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-300' : 'bg-red-500/[0.07] border-red-500/20 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={<BookOpen size={40} />} title="No courses found" desc="Try adjusting your filters or search term." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((course, idx) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03, duration: 0.2 }}
              className="group bg-neutral-900/60 border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors flex flex-col"
            >
              {/* Thumbnail */}
              <div className="h-[140px] bg-[#141415] flex items-center justify-center relative overflow-hidden shrink-0">
                {course.thumbnail
                  ? <img src={`${API_BASE}${course.thumbnail}`} alt={course.title} className="w-full h-full object-cover" />
                  : <BookOpen size={36} className="text-zinc-700" strokeWidth={1.5} />}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-transparent to-transparent" />
                <span className={`absolute top-2.5 left-2.5 text-[10.5px] px-2 py-0.5 rounded font-semibold tracking-wide ${course.isFree ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-300 border border-amber-500/20'}`}>
                  {course.isFree ? 'Free' : `$${course.price}`}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1 gap-2.5">
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[10.5px] bg-indigo-500/[0.12] text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/[0.15] font-medium">{course.category}</span>
                  <span className="text-[10.5px] bg-white/[0.04] text-zinc-400 px-2 py-0.5 rounded border border-white/[0.06] capitalize">{course.difficulty}</span>
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight text-white leading-snug line-clamp-2">{course.title}</h3>
                  <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{course.description}</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1"><Users size={10} strokeWidth={1.75} />{course.enrollmentCount || 0}</span>
                  <span className="flex items-center gap-1"><BookOpen size={10} strokeWidth={1.75} />{course.modules?.length || 0} modules</span>
                  {course.rating > 0 && <span className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" strokeWidth={0} />{course.rating.toFixed(1)}</span>}
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setViewCourseId(course.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[12.5px] font-medium border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 transition-colors"
                  >
                    <Eye size={13} strokeWidth={1.75} /> View course
                  </button>
                  {enrolled.has(course.id) ? (
                    <div className="flex items-center justify-center gap-1.5 py-2 rounded-md text-[12.5px] font-medium bg-emerald-500/[0.08] border border-emerald-500/[0.16] text-emerald-300">
                      <CheckCircle size={13} strokeWidth={1.75} /> Enrolled
                    </div>
                  ) : (
                    <button onClick={() => handleEnroll(course.id, course.isFree, course.price)}
                      disabled={enrolling === course.id}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[12.5px] font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
                    >
                      {enrolling === course.id ? <Loader2 size={13} className="animate-spin" /> : null}
                      {course.isFree ? 'Enroll free' : `Buy · $${course.price}`}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    <AnimatePresence>
      {viewCourseId && (
        <BrowseCourseDetailOverlay
          courseId={viewCourseId}
          onClose={() => setViewCourseId(null)}
          enrolled={enrolled.has(viewCourseId)}
          enrolling={enrolling === viewCourseId}
          onEnroll={handleEnroll}
        />
      )}
    </AnimatePresence>
    </>
  );
}

// ─── Enrolled Courses Section ─────────────────────────────────────────────────
function EnrolledCoursesSection() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { t } = useI18n();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);
  const [activeCourse, setActiveCourse] = useState<Enrollment | null>(null);
  const [playerInitialTab, setPlayerInitialTab] = useState<
    'content' | 'quizReview' | 'courseReviews' | 'assignments'
  >('content');
  const [learningTab, setLearningTab] = useState<'courses' | 'community'>('courses');
  const [communityCourseId, setCommunityCourseId] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/enrollments`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setEnrollments(d.enrollments); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (learningTab !== 'community' || enrollments.length !== 1) return;
    setCommunityCourseId((id) => id || enrollments[0].courseId);
  }, [learningTab, enrollments]);

  const handleUnenroll = async (courseId: string) => {
    const ok = await confirm({
      title: 'Unenroll from course',
      message: 'Unenroll from this course? You can enroll again later if the course is still available.',
      variant: 'danger',
      confirmLabel: 'Unenroll',
      cancelLabel: 'Stay enrolled',
    });
    if (!ok) return;
    setUnenrolling(courseId);
    try {
      const r = await fetch(`${API_BASE}/api/enrollments/${courseId}`, { method: 'DELETE', headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success) {
        setEnrollments(prev => prev.filter(e => e.courseId !== courseId));
        setCommunityCourseId(id => (id === courseId ? '' : id));
      }
    } finally { setUnenrolling(null); }
  };

  if (loading) return <Spinner />;

  if (activeCourse) {
    return (
      <CoursePlayerView
        user={user}
        enrollment={activeCourse}
        initialLearnerTab={playerInitialTab}
        onBack={() => { setPlayerInitialTab('content'); setActiveCourse(null); load(); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-white">My Learning</h2>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {learningTab === 'courses'
              ? `${enrollments.length} course${enrollments.length === 1 ? '' : 's'} enrolled`
              : communityCourseId
                ? (enrollments.find(e => e.courseId === communityCourseId)?.course?.title || 'Course') + ' — community'
                : 'Pick a course to open its discussion board'}
          </p>
        </div>
        <div className="flex p-0.5 bg-white/[0.025] border border-white/[0.06] rounded-md w-fit gap-0.5">
          {(['courses', 'community'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setLearningTab(tab)}
              className={`px-3.5 py-1.5 rounded-[5px] text-[12.5px] font-medium transition-colors flex items-center gap-1.5 ${
                learningTab === tab ? 'bg-white/[0.07] text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {tab === 'courses' ? <GraduationCap size={13} strokeWidth={1.75} /> : <MessageSquare size={13} strokeWidth={1.75} />}
              {tab === 'courses' ? 'Courses' : t('community')}
            </button>
          ))}
        </div>
      </div>

      {learningTab === 'community' ? (
        enrollments.length === 0 ? (
          <EmptyState icon={<MessageSquare size={40} />} title="No courses yet" desc="Enroll in a course to join its community." />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {enrollments.map((enr) => (
                <button
                  key={enr.courseId}
                  type="button"
                  onClick={() => setCommunityCourseId(enr.courseId)}
                  className={`px-3.5 py-2 rounded-md text-[13px] font-medium text-left transition-colors border ${
                    communityCourseId === enr.courseId
                      ? 'bg-indigo-600/80 border-indigo-500/50 text-white'
                      : 'bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-white hover:border-white/[0.12]'
                  }`}
                >
                  <span className="line-clamp-1">{enr.course?.title || 'Course'}</span>
                </button>
              ))}
            </div>
            {communityCourseId && user ? (
              <div className={`${panelCls} p-4 md:p-6`}>
                <DiscussionsSection user={user} selectedCourseId={communityCourseId} />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/[0.07] bg-white/[0.012] px-6 py-12 text-center text-[13px] text-zinc-500">
                Select a course above to view and post in that course&apos;s community.
              </div>
            )}
          </div>
        )
      ) : enrollments.length === 0 ? (
        <EmptyState icon={<GraduationCap size={40} />} title="No courses yet" desc="Browse courses to start learning." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {enrollments.map((enr, idx) => {
            const totalLessons = enr.course?.modules?.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0) || 0;
            const completedLessons = enr.completedModules?.length || 0;
            return (
              <motion.div key={enr.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="group bg-neutral-900/60 border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors flex flex-col"
              >
                {/* Thumbnail */}
                <div className="h-[130px] bg-[#141415] relative overflow-hidden shrink-0">
                  {enr.course?.thumbnail
                    ? <img src={`${API_BASE}${enr.course.thumbnail}`} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen size={32} className="text-zinc-700" strokeWidth={1.5} /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-transparent to-transparent" />
                  {enr.progress >= 100 && (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10.5px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                      <CheckCircle2 size={10} strokeWidth={2} /> Completed
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10.5px] bg-indigo-500/[0.12] text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/[0.15] font-medium">{enr.course?.category}</span>
                    <span className="text-[10.5px] bg-white/[0.04] text-zinc-400 px-2 py-0.5 rounded border border-white/[0.06] capitalize">{enr.course?.difficulty}</span>
                  </div>
                  <h3 className="text-[14px] font-semibold tracking-tight text-white leading-snug line-clamp-2">{enr.course?.title || 'Unknown Course'}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1"><BookOpen size={10} strokeWidth={1.75} />{enr.course?.modules?.length || 0} modules</span>
                    <span className="flex items-center gap-1"><ClipboardList size={10} strokeWidth={1.75} />{totalLessons} lessons</span>
                    <span className="flex items-center gap-1"><CheckCircle size={10} strokeWidth={1.75} />{completedLessons} done</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-zinc-500">
                      <span>Progress</span>
                      <span className="text-white tabular-nums font-medium">{enr.progress}%</span>
                    </div>
                    <div className="w-full h-[5px] bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${enr.progress}%` }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => { setPlayerInitialTab('content'); setActiveCourse(enr); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[12.5px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      <Play size={12} fill="currentColor" strokeWidth={0} />
                      {enr.progress === 0 ? 'Start' : enr.progress >= 100 ? 'Review' : 'Continue'}
                    </button>
                    <div className="flex gap-1.5">
                      {[
                        { tab: 'quizReview' as const, icon: <BarChart3 size={13} strokeWidth={1.75} />, label: 'Scores', cls: 'bg-violet-500/[0.08] border-violet-500/20 text-violet-300 hover:bg-violet-500/[0.15]' },
                        { tab: 'assignments' as const, icon: <ClipboardList size={13} strokeWidth={1.75} />, label: 'Tasks', cls: 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/[0.15]' },
                      ].map(({ tab, icon, label, cls }) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => { setPlayerInitialTab(tab); setActiveCourse(enr); }}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11.5px] font-medium border transition-colors ${cls}`}
                        >
                          {icon} <span>{label}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setCommunityCourseId(enr.courseId); setLearningTab('community'); }}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium border border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Community"
                      >
                        <MessageSquare size={13} strokeWidth={1.75} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => { setPlayerInitialTab('courseReviews'); setActiveCourse(enr); }}
                        className="flex items-center gap-1 text-[11.5px] text-zinc-500 hover:text-amber-300 transition-colors"
                      >
                        <Star size={11} strokeWidth={1.75} /> Rate &amp; review
                      </button>
                      <button onClick={() => handleUnenroll(enr.courseId)} disabled={unenrolling === enr.courseId}
                        className="flex items-center gap-1 text-[11.5px] text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        {unenrolling === enr.courseId ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} strokeWidth={1.75} />}
                        <span>Leave</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LessonSidebarList({
  modules,
  activeLessonKey,
  completedKeys,
  onLessonPick,
}: {
  modules: any[];
  activeLessonKey: string | null | undefined;
  completedKeys: Set<string>;
  onLessonPick: (les: any, mi: number, li: number, moduleTitle: string) => void;
}) {
  return (
    <>
      {(modules || []).map((mod: any, mi: number) => (
        <div key={mi}>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-2.5 border-b border-white/5 bg-black/20">
            Module {mi + 1}: <span className="text-zinc-400 font-semibold normal-case">{mod.title}</span>
          </p>
          {(mod.lessons || []).map((les: any, li: number) => {
            const key = les.id || `${mi}-${li}`;
            const isActive = activeLessonKey === key;
            const isDone = completedKeys.has(key);
            return (
              <button
                type="button"
                key={li}
                onClick={() => onLessonPick(les, mi, li, mod.title)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500/40 shadow-lg shadow-indigo-900/20'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-white/25 text-white' : 'bg-zinc-800 text-zinc-500 ring-1 ring-white/10'
                }`}>
                  {isDone ? <CheckCircle2 size={13} /> : <span>{li + 1}</span>}
                </div>
                <span className="truncate flex-1 text-[13px] leading-tight">{les.title}</span>
                {les.videoUrl && <Video size={11} className={`flex-shrink-0 ${isActive ? 'text-white/50' : 'text-zinc-600'}`} />}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}

function LessonVideoPanel({ videoUrl, className = '', fillHeight }: { videoUrl: string; className?: string; fillHeight?: boolean }) {
  const embedSrc = getYoutubeEmbedSrc(videoUrl);
  const frame = (
    <>
      {embedSrc ? (
        <iframe
          src={embedSrc}
          title="YouTube video player"
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40" />
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 flex flex-col items-center justify-center gap-3 group-hover:scale-105 transition-transform min-h-[160px]"
          >
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/30">
              <Play size={28} fill="white" className="text-white ml-1" />
            </div>
            <span className="text-xs text-white/70 font-medium px-4 text-center">Open video</span>
          </a>
        </>
      )}
    </>
  );

  if (fillHeight) {
    return (
      <div className={`h-full min-h-0 flex flex-col rounded-xl overflow-hidden border border-white/10 bg-black ${className}`}>
        <div className="flex-1 relative min-h-[140px] bg-black">{frame}</div>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-800/90 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 ring-1 ring-indigo-500/10 ${className}`}>
      <div className={embedSrc ? 'aspect-video relative bg-black' : 'aspect-video flex items-center justify-center bg-black relative group'}>
        {frame}
      </div>
    </div>
  );
}

function PersonalNotesPanel({ courseId, lessonKey, compact }: { courseId: string; lessonKey: string; compact?: boolean }) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    if (!lessonKey) return;
    let cancelled = false;
    setLoading(true);
    setSaveOk(false);
    fetch(`${API_BASE}/api/enrollments/${courseId}/personal-notes/${encodeURIComponent(lessonKey)}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setDraft(typeof d.text === 'string' ? d.text : '');
      })
      .catch(() => {
        if (!cancelled) setDraft('');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonKey]);

  const save = async () => {
    setSaving(true);
    setSaveOk(false);
    try {
      const r = await fetch(`${API_BASE}/api/enrollments/${courseId}/personal-notes/${encodeURIComponent(lessonKey)}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft }),
      });
      const d = await r.json();
      if (d.success) setSaveOk(true);
    } finally {
      setSaving(false);
    }
  };

  const wrapCls = compact
    ? 'space-y-2'
    : 'rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] to-zinc-900/55 p-5 sm:p-6 backdrop-blur-sm';

  return (
    <div className={wrapCls}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h4 className={`font-bold text-white ${compact ? 'text-xs' : 'text-sm'}`}>Your notes</h4>
          <p className={`text-zinc-500 ${compact ? 'text-[10px] leading-snug' : 'text-xs mt-0.5'}`}>
            {compact ? 'Private. Instructor text is read-only.' : 'Only you can see these. Instructor lesson content is read-only — add your own summary or reminders here.'}
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold border border-amber-500/30 disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          Save
        </button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500 py-3">
          <Loader2 size={14} className="animate-spin text-amber-400" /> Loading…
        </div>
      ) : (
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaveOk(false);
          }}
          placeholder="Your summary, key points, code snippets, or reminders…"
          rows={compact ? 4 : 8}
          className={`${inputCls} resize-y w-full ${compact ? 'min-h-[88px] max-h-[160px] text-xs' : 'min-h-[140px] text-sm leading-relaxed'}`}
        />
      )}
      {saveOk && <p className="text-[11px] text-emerald-400 mt-1.5 font-medium">Saved.</p>}
    </div>
  );
}

// ─── Course Player: quiz review + lesson quiz constants ─────────────────────
const QUIZ_PASS_PERCENT = 65;
const QUIZ_SEC_PER_QUESTION = 75;

type QuizAttemptSummary = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  createdAt?: string;
};

type TopicInsightRow = {
  lessonId: string;
  lessonTitle: string;
  attempts: number;
  bestPct: number;
  latestPct: number;
  latestPassed: boolean;
};

function reviewUserIdEq(a: unknown, b: unknown) {
  return String(a ?? '') === String(b ?? '');
}

async function fetchCourseRatingsSummary(courseId: string) {
  const r = await fetch(`${API_BASE}/api/reviews/${courseId}/summary`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: '{}',
  });
  return r.json();
}

function RatingsAiSummaryContent({
  loading,
  err,
  data,
}: {
  loading: boolean;
  err: string;
  data: Record<string, unknown> | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-zinc-500 justify-center">
        <Loader2 size={18} className="animate-spin text-amber-400" /> Generating ratings summary…
      </div>
    );
  }
  if (err) return <p className="text-sm text-red-400 py-2">{err}</p>;
  if (!data) return null;
  const strengths = Array.isArray(data.strengths) ? (data.strengths as string[]) : [];
  const watchouts = Array.isArray(data.watchouts) ? (data.watchouts as string[]) : [];
  const themes = Array.isArray(data.themes) ? (data.themes as string[]) : [];
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-3 text-sm">
      <div className="flex items-start gap-2">
        <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white">{String(data.headline || '')}</p>
          {data.ratingOverview ? <p className="text-xs text-amber-200/80 mt-1">{String(data.ratingOverview)}</p> : null}
          <p className="mt-2 text-zinc-300 leading-relaxed">{String(data.summary || '')}</p>
        </div>
      </div>
      {strengths.length > 0 ? (
        <div>
          <p className="text-[10px] font-bold uppercase text-emerald-400/90">Strengths</p>
          <ul className="mt-1 list-disc pl-4 text-zinc-400 space-y-0.5">
            {strengths.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {watchouts.length > 0 ? (
        <div>
          <p className="text-[10px] font-bold uppercase text-amber-400/90">Watchouts</p>
          <ul className="mt-1 list-disc pl-4 text-zinc-400 space-y-0.5">
            {watchouts.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {themes.length > 0 ? (
        <div>
          <p className="text-[10px] font-bold uppercase text-zinc-500">Themes</p>
          <ul className="mt-1 list-disc pl-4 text-zinc-500 space-y-0.5">
            {themes.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Read-only list + average for browse / course preview (GET is public). */
function CourseReviewsReadOnlyBlock({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ratingSumOpen, setRatingSumOpen] = useState(false);
  const [ratingSumLoading, setRatingSumLoading] = useState(false);
  const [ratingSumData, setRatingSumData] = useState<Record<string, unknown> | null>(null);
  const [ratingSumErr, setRatingSumErr] = useState('');

  const loadRatingSummary = async () => {
    if (!user) return;
    setRatingSumOpen(true);
    setRatingSumLoading(true);
    setRatingSumErr('');
    setRatingSumData(null);
    try {
      const d = await fetchCourseRatingsSummary(courseId);
      if (d.success && d.summary) setRatingSumData(d.summary);
      else setRatingSumErr(d.message || 'Could not load summary.');
    } catch {
      setRatingSumErr('Network error.');
    } finally {
      setRatingSumLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/api/reviews/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.success) return;
        setReviews(d.reviews || []);
        setAvgRating(typeof d.avgRating === 'number' ? d.avgRating : 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-amber-400 fill-amber-400 shrink-0" />
          <h2 className="text-lg font-bold text-white">Learner reviews</h2>
        </div>
        {user ? (
          <button
            type="button"
            onClick={() => {
              if (!ratingSumOpen) setRatingSumOpen(true);
              loadRatingSummary();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
          >
            <Sparkles size={14} /> AI summary
          </button>
        ) : null}
      </div>
      <div className="p-5 sm:p-6 space-y-5">
        {user && ratingSumOpen ? (
          <div>
            <RatingsAiSummaryContent loading={ratingSumLoading} err={ratingSumErr} data={ratingSumData} />
          </div>
        ) : null}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-zinc-500 text-sm">
            <Loader2 size={22} className="animate-spin mr-2 text-amber-400" /> Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">No reviews yet. Enroll to be the first to rate this course.</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-center sm:text-left">
                <div className="text-3xl font-black text-amber-400 tabular-nums">{avgRating.toFixed(1)}</div>
                <div className="flex justify-center sm:justify-start gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={12} className={s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  From {reviews.length} learner{reviews.length !== 1 ? 's' : ''} (one review each)
                </p>
              </div>
              <p className="text-sm text-zinc-400 flex-1 leading-relaxed">
                Ratings are from enrolled students. After you join, you can add or update your own single review from the course player.
              </p>
            </div>
            <ul className="space-y-3 max-h-[min(360px,50vh)] overflow-y-auto custom-scrollbar pr-1">
              {reviews.map((review: any) => (
                <li key={review.id} className="rounded-xl border border-white/10 bg-zinc-950/50 p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-xs font-bold text-indigo-200">
                        {(review.userName || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm text-zinc-200">{review.userName}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                      ))}
                    </div>
                  </div>
                  {review.comment ? <p className="text-sm text-zinc-400 leading-relaxed">{review.comment}</p> : null}
                  <p className="text-xs text-zinc-600 mt-2">{new Date(review.updatedAt || review.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function CourseReviewsPanel({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const { user } = useAuth();
  const uid = user?.id || '';
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [ratingSumOpen, setRatingSumOpen] = useState(false);
  const [ratingSumLoading, setRatingSumLoading] = useState(false);
  const [ratingSumData, setRatingSumData] = useState<Record<string, unknown> | null>(null);
  const [ratingSumErr, setRatingSumErr] = useState('');

  const loadRatingSummary = React.useCallback(async () => {
    setRatingSumOpen(true);
    setRatingSumLoading(true);
    setRatingSumErr('');
    setRatingSumData(null);
    try {
      const d = await fetchCourseRatingsSummary(courseId);
      if (d.success && d.summary) setRatingSumData(d.summary);
      else setRatingSumErr(d.message || 'Could not load summary.');
    } catch {
      setRatingSumErr('Network error.');
    } finally {
      setRatingSumLoading(false);
    }
  }, [courseId]);

  const loadReviews = React.useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/reviews/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setReviews(d.reviews || []);
          setAvgRating(typeof d.avgRating === 'number' ? d.avgRating : 0);
          const mine = (d.reviews || []).find((r: any) => reviewUserIdEq(r.userId, uid));
          if (mine) setForm({ rating: mine.rating, comment: mine.comment || '' });
          else setForm({ rating: 5, comment: '' });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, uid]);

  const reloadReviewsQuiet = React.useCallback(() => {
    fetch(`${API_BASE}/api/reviews/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setReviews(d.reviews || []);
          setAvgRating(typeof d.avgRating === 'number' ? d.avgRating : 0);
          const mine = (d.reviews || []).find((r: any) => reviewUserIdEq(r.userId, uid));
          if (mine) setForm({ rating: mine.rating, comment: mine.comment || '' });
        }
      })
      .catch(() => {});
  }, [courseId, uid]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const submit = async () => {
    setSubmitting(true);
    setMsg('');
    try {
      const r = await fetch(`${API_BASE}/api/reviews/${courseId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: form.rating, comment: form.comment }),
      });
      const d = await r.json();
      if (d.success) {
        setMsg('Review saved.');
        reloadReviewsQuiet();
        void loadRatingSummary();
      } else setMsg(d.message || 'Failed');
    } catch {
      setMsg('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
        <Loader2 size={24} className="animate-spin mr-2 text-amber-400" /> Loading reviews…
      </div>
    );
  }

  const hasMine = reviews.some((r: any) => reviewUserIdEq(r.userId, uid));
  const othersReviews = reviews.filter((r: any) => !reviewUserIdEq(r.userId, uid));

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-10 py-6 max-w-3xl mx-auto pb-28">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star size={22} className="text-amber-400 fill-amber-400" /> Rate &amp; review
          </h2>
          <p className="text-sm text-zinc-500 mt-1">{courseTitle}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadRatingSummary()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20 shrink-0"
        >
          <Sparkles size={15} /> Ratings AI summary
        </button>
      </div>

      {ratingSumOpen ? (
        <div>
          <RatingsAiSummaryContent loading={ratingSumLoading} err={ratingSumErr} data={ratingSumData} />
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="text-center sm:text-left">
          <div className="text-4xl font-black text-amber-400 tabular-nums">{avgRating.toFixed(1)}</div>
          <div className="flex justify-center sm:justify-start gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={14} className={s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {reviews.length === 0
              ? 'No ratings yet'
              : `${reviews.length} learner${reviews.length !== 1 ? 's' : ''} rated (one review each)`}
          </p>
        </div>
        <p className="text-sm text-zinc-400 flex-1 leading-relaxed">
          Each enrolled student may leave <span className="text-zinc-200 font-medium">one</span> review for this course. You can edit yours anytime — it helps the instructor and future learners.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-bold text-white">Your review</h3>
          <p className="text-xs text-zinc-500 mt-1">
            {hasMine ? 'Update your rating or comment below.' : 'You have not submitted a review yet.'}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-2">Rating</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, rating: s }))} className="p-1">
                <Star size={28} className={`transition-colors ${s <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600 hover:text-amber-300/80'}`} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1.5">Comment (optional)</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            rows={3}
            placeholder="Share your experience with this course…"
            className={`${inputCls} resize-none`}
          />
        </div>
        {msg ? (
          <p className={`text-sm ${msg.includes('saved') || msg.includes('submitted') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>
        ) : null}
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
          {hasMine ? 'Update review' : 'Save review'}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">What others said</h3>
        <div className="space-y-3">
          {othersReviews.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8 border border-dashed border-white/10 rounded-2xl">
              {reviews.length === 0
                ? 'No reviews yet — add yours above.'
                : 'No other reviews yet. You are the only reviewer so far.'}
            </p>
          ) : (
            othersReviews.map((review: any) => (
              <div key={review.id} className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-xs font-bold text-indigo-200">
                      {(review.userName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm text-zinc-200">{review.userName}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                    ))}
                  </div>
                </div>
                {review.comment ? <p className="text-sm text-zinc-400 leading-relaxed">{review.comment}</p> : null}
                <p className="text-xs text-zinc-600 mt-2">{new Date(review.updatedAt || review.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CourseQuizReviewPanel({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [detail, setDetail] = useState<{
    id: string;
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      userAnswer?: number;
    }[];
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr('');
    setAiAdvice('');
    setAiError('');
    fetch(`${API_BASE}/api/enrollments/${courseId}/quiz-attempts`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAttempts(d.attempts || []);
        else setErr(d.message || 'Could not load attempts');
      })
      .catch(() => setErr('Network error'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const { overallAvg, passRate, topicInsights, needsWork } = useMemo(() => {
    if (!attempts.length) {
      return {
        overallAvg: null as number | null,
        passRate: null as number | null,
        topicInsights: [] as TopicInsightRow[],
        needsWork: [] as TopicInsightRow[],
      };
    }
    const passRateN = Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100);
    const overallAvgN = Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length);
    const byLesson = new Map<string, { title: string; rows: QuizAttemptSummary[] }>();
    attempts.forEach((a) => {
      const lid = a.lessonId || 'unknown';
      if (!byLesson.has(lid)) byLesson.set(lid, { title: a.lessonTitle || 'Lesson', rows: [] });
      byLesson.get(lid)!.rows.push(a);
    });
    const topicInsightsInner: TopicInsightRow[] = [...byLesson.entries()].map(([lessonId, v]) => {
      const pcts = v.rows.map((r) => r.percentage);
      const best = Math.max(...pcts);
      const latest = v.rows[0];
      return {
        lessonId,
        lessonTitle: v.title,
        attempts: v.rows.length,
        bestPct: best,
        latestPct: latest.percentage,
        latestPassed: latest.passed,
      };
    });
    topicInsightsInner.sort((a, b) => a.bestPct - b.bestPct);
    const needsWorkInner = topicInsightsInner.filter((t) => t.bestPct < QUIZ_PASS_PERCENT || !t.latestPassed);
    return { overallAvg: overallAvgN, passRate: passRateN, topicInsights: topicInsightsInner, needsWork: needsWorkInner };
  }, [attempts]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const r = await fetch(`${API_BASE}/api/enrollments/${courseId}/quiz-attempts/${id}`, { headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success && d.attempt) {
        setDetail({
          id: d.attempt.id,
          questions: d.attempt.questions || [],
        });
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const runAiCoach = async () => {
    if (!attempts.length) return;
    setAiLoading(true);
    setAiError('');
    try {
      const r = await fetch(`${API_BASE}/api/enrollments/${courseId}/quiz-ai-insights`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: '{}',
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) {
        setAiError(d.message || 'Could not get AI suggestions');
        return;
      }
      setAiAdvice(typeof d.advice === 'string' ? d.advice : '');
    } catch {
      setAiError('Network error');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">
        <Loader2 size={22} className="animate-spin mr-2 text-indigo-400" /> Loading quiz history…
      </div>
    );
  }

  if (err) {
    return <div className="p-6 text-center text-red-400 text-sm">{err}</div>;
  }

  if (!attempts.length) {
    return (
      <div className="px-6 py-16 text-center max-w-md mx-auto">
        <Target size={40} className="mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-300 font-semibold">No quiz attempts yet</p>
        <p className="text-sm text-zinc-500 mt-2">
          Open <span className="text-indigo-300">Learn</span>, pick a lesson, then use <span className="text-violet-300">Lesson quiz</span> to build your record here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-10 py-6 max-w-4xl mx-auto pb-28">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={22} className="text-indigo-400" /> Your quiz performance
        </h2>
        <p className="text-sm text-zinc-500 mt-1">{courseTitle}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Across all attempts</p>
          <p className="text-3xl font-black text-white mt-1 tabular-nums">{overallAvg != null ? `${overallAvg}%` : '—'}</p>
          <p className="text-xs text-zinc-500 mt-1">Mean score percentage</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pass rate</p>
          <p className="text-3xl font-black text-emerald-300 mt-1 tabular-nums">{passRate != null ? `${passRate}%` : '—'}</p>
          <p className="text-xs text-zinc-500 mt-1">{attempts.filter((a) => a.passed).length} passed / {attempts.length} attempts</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={runAiCoach}
          disabled={aiLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-violet-950/30 border border-white/10 transition-all"
        >
          {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Check with AI
        </button>
        <p className="text-[11px] text-zinc-500 max-w-xl">
          Analyses your saved quiz attempts in this course and suggests which lesson topics to revisit and how to study.
        </p>
      </div>
      {aiError ? <p className="text-sm text-red-400">{aiError}</p> : null}
      {aiAdvice ? (
        <div className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-5 sm:p-6">
          <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bot size={14} /> AI study coach
          </p>
          <div className="text-sm text-zinc-200 leading-relaxed [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_strong]:text-white [&_p]:mb-2">
            <ReactMarkdown>{aiAdvice}</ReactMarkdown>
          </div>
        </div>
      ) : null}

      {needsWork.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
          <p className="text-sm font-bold text-amber-200 mb-2 flex items-center gap-2">
            <Brain size={16} className="text-amber-300" /> Key improvements (by lesson topic)
          </p>
          <ul className="space-y-2 text-sm text-zinc-300">
            {needsWork.map((t) => (
              <li key={t.lessonId} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="font-medium text-white">{t.lessonTitle}</span>
                <span className="text-xs text-zinc-500">
                  Best {t.bestPct}% · Latest {t.latestPct}% {t.latestPassed ? '(pass)' : '(below pass)'}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-zinc-500 mt-3">
            Sorted by weakest best score. Revisit these lessons and retake the quiz to strengthen weak topics.
          </p>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Best score per lesson</p>
        <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
          {topicInsights.map((t) => (
            <div key={t.lessonId} className="px-4 py-3 flex flex-wrap justify-between gap-2 text-sm bg-white/[0.02]">
              <span className="font-medium text-zinc-200">{t.lessonTitle}</span>
              <span className="text-zinc-400 text-xs tabular-nums">
                Best <span className="text-white font-bold">{t.bestPct}%</span> · {t.attempts} attempt{t.attempts !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Attempts & questions you tried</p>
        <div className="space-y-2">
          {attempts.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/10 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpand(a.id)}
                className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{a.lessonTitle || 'Lesson quiz'}</p>
                  <p className="text-[11px] text-zinc-500">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold tabular-nums ${a.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {a.score}/{a.total} · {a.percentage}%
                  </span>
                  <ChevronRight size={16} className={`text-zinc-500 transition-transform ${expandedId === a.id ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expandedId === a.id && (
                <div className="border-t border-white/10 px-4 py-4 bg-black/30 space-y-4">
                  {detailLoading && <p className="text-xs text-zinc-500">Loading questions…</p>}
                  {!detailLoading && detail?.id === a.id && detail.questions.map((q, qi) => {
                    const ok = q.userAnswer === q.correctAnswer;
                    return (
                      <div key={qi} className={`rounded-lg border p-3 text-sm ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-zinc-900/80'}`}>
                        <p className="font-medium text-zinc-200 mb-2">{q.question}</p>
                        <div className="space-y-1 text-xs text-zinc-400">
                          <p>
                            <span className="text-zinc-500">Your answer: </span>
                            {q.userAnswer !== undefined && q.options[q.userAnswer] != null ? q.options[q.userAnswer] : '— (skipped or time ran out)'}
                          </p>
                          {!ok && (
                            <p>
                              <span className="text-emerald-400/90">Correct: </span>
                              {q.options[q.correctAnswer] ?? '—'}
                            </p>
                          )}
                          {q.explanation ? <p className="text-zinc-500 mt-2">{q.explanation}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Course Player View ───────────────────────────────────────────────────────

function CoursePlayerView({
  user,
  enrollment,
  onBack,
  initialLearnerTab = 'content',
}: {
  user: any;
  enrollment: Enrollment;
  onBack: () => void;
  initialLearnerTab?: 'content' | 'quizReview' | 'courseReviews' | 'assignments';
}) {
  const { confirm } = useConfirm();
  const course = enrollment.course;
  const allLessons = (course?.modules || []).flatMap((mod: any, mi: number) =>
    (mod.lessons || []).map((les: any, li: number) => ({
      ...les, moduleIndex: mi, lessonIndex: li, moduleTitle: mod.title,
      key: les.id || `${mi}-${li}`,
    }))
  );

  const [activeLesson, setActiveLesson] = useState(allLessons[0] || null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set(enrollment.completedModules || []));
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<MCQQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_SEC_PER_QUESTION);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [quizFromTranscript, setQuizFromTranscript] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lessonQuizAttempts, setLessonQuizAttempts] = useState<any[]>([]);
  const attemptSavedRef = useRef(false);
  const theaterRootRef = useRef<HTMLDivElement>(null);
  const [theaterMode, setTheaterMode] = useState(false);
  const [learnerTab, setLearnerTab] = useState<'content' | 'quizReview' | 'courseReviews' | 'assignments'>(initialLearnerTab);

  useEffect(() => {
    setLearnerTab(initialLearnerTab);
  }, [enrollment.courseId, initialLearnerTab]);

  useEffect(() => {
    if ((learnerTab === 'quizReview' || learnerTab === 'courseReviews' || learnerTab === 'assignments') && theaterMode) setTheaterMode(false);
  }, [learnerTab, theaterMode]);

  const pickLesson = (les: any, mi: number, li: number, modTitle: string) => {
    const key = les.id || `${mi}-${li}`;
    setActiveLesson({ ...les, moduleIndex: mi, lessonIndex: li, moduleTitle: modTitle, key });
    setShowQuiz(false);
    setLearnerTab('content');
  };

  const currentIndex = allLessons.findIndex((l: any) => l.key === activeLesson?.key);
  const totalLessons = allLessons.length;
  const completedCount = completedLessons.size;
  const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  useEffect(() => {
    if (!activeLesson?.key) return;
    fetch(`${API_BASE}/api/enrollments/${enrollment.courseId}/quiz-attempts?lessonId=${encodeURIComponent(activeLesson.key)}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setLessonQuizAttempts(d.attempts); })
      .catch(() => {});
  }, [enrollment.courseId, activeLesson?.key]);

  useEffect(() => {
    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizCurrentIndex(0);
    setQuizError('');
    setQuizFromTranscript(false);
    attemptSavedRef.current = false;
  }, [activeLesson?.key]);

  useEffect(() => {
    if (!showQuiz || quizSubmitted || quizQuestions.length === 0) return;
    let s = QUIZ_SEC_PER_QUESTION;
    setTimeLeft(s);
    const id = setInterval(() => {
      s -= 1;
      setTimeLeft(s);
      if (s <= 0) {
        clearInterval(id);
        setQuizCurrentIndex((idx) => {
          if (idx >= quizQuestions.length - 1) {
            setQuizSubmitted(true);
            return idx;
          }
          return idx + 1;
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [showQuiz, quizSubmitted, quizCurrentIndex, quizQuestions.length]);

  useEffect(() => {
    if (!quizSubmitted || !activeLesson || quizQuestions.length === 0) return;
    if (attemptSavedRef.current) return;
    attemptSavedRef.current = true;
    const score = quizQuestions.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correctAnswer ? 1 : 0), 0);
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const passed = percentage >= QUIZ_PASS_PERCENT;
    fetch(`${API_BASE}/api/enrollments/${enrollment.courseId}/quiz-attempts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        lessonId: activeLesson.key,
        lessonTitle: activeLesson.title,
        questions: quizQuestions,
        answers: quizAnswers,
        score,
        percentage,
        passed,
        secondsPerQuestion: QUIZ_SEC_PER_QUESTION,
        transcriptUsed: quizFromTranscript,
      }),
    })
      .then(() => fetch(`${API_BASE}/api/enrollments/${enrollment.courseId}/quiz-attempts?lessonId=${encodeURIComponent(activeLesson.key)}`, { headers: getAuthHeaders() }))
      .then(r => r.json())
      .then(d => { if (d.success) setLessonQuizAttempts(d.attempts); })
      .catch(() => {});
  }, [quizSubmitted, activeLesson, quizQuestions, quizAnswers, quizFromTranscript, enrollment.courseId]);

  const exitQuiz = async () => {
    if (!quizSubmitted && quizQuestions.length) {
      const ok = await confirm({
        title: 'Leave quiz?',
        message: 'Leave the quiz? Your progress on this attempt will be lost.',
        variant: 'danger',
        confirmLabel: 'Leave quiz',
        cancelLabel: 'Continue quiz',
      });
      if (!ok) return;
    }
    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizCurrentIndex(0);
    attemptSavedRef.current = false;
  };

  const generateQuiz = async () => {
    if (!activeLesson) return;
    setGeneratingQuiz(true);
    setQuizError('');
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizCurrentIndex(0);
    setQuizFromTranscript(false);
    attemptSavedRef.current = false;
    try {
      const r = await fetch(`${API_BASE}/api/ai/generate-mcq`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({
          topic: activeLesson.title,
          content: activeLesson.content || '',
          videoUrl: activeLesson.videoUrl || undefined,
          numQuestions: 5, difficulty: 'medium',
        }),
      });
      const d = await r.json();
      if (d.success && d.questions?.length) {
        setQuizQuestions(d.questions);
        setShowQuiz(true);
        setQuizFromTranscript(!!d.transcriptUsed);
      } else {
        setQuizError(d.message || 'Could not generate quiz. Check GROQ_API_KEY.');
      }
    } catch { setQuizError('Network error'); }
    finally { setGeneratingQuiz(false); }
  };

  const handleQuizAdvance = () => {
    if (quizCurrentIndex >= quizQuestions.length - 1) setQuizSubmitted(true);
    else setQuizCurrentIndex((c) => c + 1);
  };

  const [browserFs, setBrowserFs] = useState(false);
  useEffect(() => {
    const onFs = () => setBrowserFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const leaveTheater = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch { /* ignore */ }
    setTheaterMode(false);
  };

  const toggleBrowserFullscreen = async () => {
    const el = theaterRootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* ignore */ }
  };

  const quizScore = quizSubmitted ? quizQuestions.reduce((s, q, i) => s + (quizAnswers[i] === q.correctAnswer ? 1 : 0), 0) : 0;
  const quizPct = quizQuestions.length ? Math.round((quizScore / quizQuestions.length) * 100) : 0;
  const passed = quizSubmitted && quizPct >= QUIZ_PASS_PERCENT;
  const lessonQuizPassed = lessonQuizAttempts.some((a: any) => a.passed);

  const markComplete = async () => {
    if (!activeLesson) return;
    const key = activeLesson.key;
    if (completedLessons.has(key)) return;
    if (!lessonQuizPassed && !passed) return;

    const updated = new Set(completedLessons);
    updated.add(key);
    const progress = Math.round((updated.size / totalLessons) * 100);
    const prev = new Set(completedLessons);
    setCompletedLessons(updated);
    try {
      const r = await fetch(`${API_BASE}/api/enrollments/${enrollment.courseId}/progress`, {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ progress, completedModules: Array.from(updated) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) {
        setCompletedLessons(prev);
      } else if (Array.isArray(d.completedModules)) {
        setCompletedLessons(new Set(d.completedModules as string[]));
      }
    } catch {
      setCompletedLessons(prev);
    }
  };

  const currentQ = quizQuestions[quizCurrentIndex];
  const hasVideo = !!activeLesson?.videoUrl;
  const hasNotes = !!activeLesson?.content;

  if (!course) return <div className="text-zinc-500 py-20 text-center">Course data unavailable</div>;

  return (
    <div
      ref={theaterRootRef}
      className={`flex overflow-hidden ${
        theaterMode
          ? 'fixed inset-0 z-[200] h-[100dvh] max-h-[100dvh] w-full flex-row bg-black text-white'
          : 'relative h-[min(100vh-5.5rem,920px)] min-h-[560px] max-h-[calc(100vh-4.5rem)] rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-black text-white shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]'
      }`}
    >
      {!theaterMode && (
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/10 flex flex-col overflow-hidden flex-shrink-0 bg-gradient-to-b from-zinc-900 via-zinc-900/98 to-zinc-950"
            style={{ width: 300 }}
          >
            <div className="p-5 border-b border-white/10 bg-black/25">
              <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-semibold mb-4 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <ArrowLeft size={14} /> Back to courses
              </button>
              <h3 className="font-bold text-[15px] leading-snug line-clamp-3 text-white tracking-tight">{course.title}</h3>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
                  <span>Progress</span>
                  <span className="text-zinc-300 tabular-nums">{completedCount}/{totalLessons} · {overallProgress}%</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden ring-1 ring-white/5">
                  <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
              <LessonSidebarList
                modules={course.modules || []}
                activeLessonKey={activeLesson?.key}
                completedKeys={completedLessons}
                onLessonPick={pickLesson}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 min-h-0 ${!theaterMode ? 'bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(99,102,241,0.07),transparent_50%)]' : ''}`}>
        <header className={`flex items-center justify-between gap-4 px-4 sm:px-7 py-3.5 border-b border-white/10 flex-shrink-0 ${theaterMode ? 'bg-black/70' : 'bg-zinc-900/95 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {theaterMode ? (
              <button type="button" onClick={leaveTheater} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-white flex-shrink-0">
                <Minimize2 size={16} /> <span className="hidden sm:inline">Exit theater</span>
              </button>
            ) : (
              <button type="button" onClick={() => setSidebarOpen(o => !o)} className="p-2.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all flex-shrink-0 ring-1 ring-white/10 hover:ring-white/20" title="Lesson list">
                <BookMarked size={18} />
              </button>
            )}
            <div className="min-w-0">
              <p className={`truncate ${theaterMode ? 'text-[10px] font-bold text-zinc-500 uppercase tracking-wider' : 'text-[11px] flex items-center gap-1.5 text-zinc-500'}`}>
                {learnerTab === 'assignments' && !theaterMode ? (
                  <span className="font-semibold text-emerald-300/90 uppercase tracking-wider text-[10px]">Course work</span>
                ) : learnerTab === 'quizReview' && !theaterMode ? (
                  <span className="font-semibold text-indigo-300/90 uppercase tracking-wider text-[10px]">Performance</span>
                ) : learnerTab === 'courseReviews' && !theaterMode ? (
                  <span className="font-semibold text-amber-300/90 uppercase tracking-wider text-[9px] sm:text-[10px]">Rate &amp; review</span>
                ) : theaterMode ? (
                  activeLesson?.moduleTitle
                ) : (
                  <>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 tabular-nums">{currentIndex + 1}/{totalLessons}</span>
                    <ChevronRight size={12} className="text-zinc-600 flex-shrink-0" />
                    <span className="truncate font-medium">{activeLesson?.moduleTitle}</span>
                  </>
                )}
              </p>
              <h3 className={`font-bold truncate ${theaterMode ? 'text-sm sm:text-base' : 'text-base sm:text-lg text-white tracking-tight'}`}>
                {learnerTab === 'quizReview' && !theaterMode ? 'Your marks & quiz history' : learnerTab === 'courseReviews' && !theaterMode ? 'Rate & review' : learnerTab === 'assignments' && !theaterMode ? 'Assignments' : activeLesson?.title}
              </h3>
            </div>
            {!showQuiz && !theaterMode && (
              <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 flex-shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => { setLearnerTab('content'); setShowQuiz(false); }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    learnerTab === 'content' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Learn
                </button>
                <button
                  type="button"
                  onClick={() => { setLearnerTab('quizReview'); setShowQuiz(false); }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    learnerTab === 'quizReview' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Quiz scores
                </button>
                <button
                  type="button"
                  onClick={() => { setLearnerTab('assignments'); setShowQuiz(false); }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    learnerTab === 'assignments' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Assignments
                </button>
                <button
                  type="button"
                  onClick={() => { setLearnerTab('courseReviews'); setShowQuiz(false); }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    learnerTab === 'courseReviews' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Rate &amp; review
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {!showQuiz && !theaterMode && learnerTab === 'content' && (
              <button
                type="button"
                onClick={() => { setTheaterMode(true); setSidebarOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 text-xs font-bold border border-indigo-500/25 shadow-sm shadow-indigo-950/20"
                title="Focus layout: full-height video with navigation sidebar"
              >
                <Maximize2 size={15} /> <span className="hidden sm:inline">Theater</span>
              </button>
            )}
            {!showQuiz && theaterMode && (
              <button
                type="button"
                onClick={toggleBrowserFullscreen}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold"
              >
                {browserFs ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                <span className="hidden md:inline">{browserFs ? 'Exit full screen' : 'Full screen'}</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-black/30 pl-3 pr-2 py-1.5 ring-1 ring-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Course</span>
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
              <span className="text-[10px] font-mono text-zinc-400 tabular-nums">{overallProgress}%</span>
            </div>
          </div>
        </header>

        <div className={`flex-1 min-h-0 ${theaterMode && !showQuiz && learnerTab === 'content' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto custom-scrollbar'}`}>
          {!showQuiz ? (
            learnerTab === 'courseReviews' ? (
              <CourseReviewsPanel courseId={enrollment.courseId} courseTitle={course?.title || 'Course'} />
            ) : learnerTab === 'quizReview' ? (
              <CourseQuizReviewPanel courseId={enrollment.courseId} courseTitle={course?.title || 'Course'} />
            ) : learnerTab === 'assignments' ? (
              <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto pb-10">
                {user ? (
                  <AssignmentsSection user={user} role="student" selectedCourseId={enrollment.courseId} embedded />
                ) : (
                  <p className="text-sm text-zinc-500">Sign in to view assignments.</p>
                )}
              </div>
            ) : theaterMode ? (
              <div className="flex flex-1 min-h-0 flex-col lg:flex-row bg-black">
                <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-3 lg:min-w-0">
                  {hasVideo ? (
                    <LessonVideoPanel videoUrl={activeLesson!.videoUrl} fillHeight className="flex-1 min-h-0" />
                  ) : (
                    <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center text-zinc-500 text-sm rounded-xl border border-white/10 bg-zinc-900/40 p-6">
                      <BookOpen size={40} className="opacity-30 mb-2" />
                      <p>No video linked for this lesson.</p>
                    </div>
                  )}
                </div>
                <aside className="w-full lg:w-[min(380px,38vw)] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10 bg-zinc-950 min-h-0 max-h-[44vh] lg:max-h-none">
                  <div className="px-3 py-2 border-b border-white/10 bg-black/50">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Course navigation</p>
                  </div>
                  <div className="flex-1 min-h-[100px] lg:max-h-[32vh] overflow-y-auto custom-scrollbar p-2">
                    <LessonSidebarList
                      modules={course.modules || []}
                      activeLessonKey={activeLesson?.key}
                      completedKeys={completedLessons}
                      onLessonPick={pickLesson}
                    />
                  </div>
                  <div className="flex-1 min-h-[100px] overflow-y-auto border-t border-white/10 p-3 sm:p-4 bg-zinc-900/40">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Lesson notes</p>
                    <p className="text-[10px] text-zinc-600 mb-2">From instructor · read-only</p>
                    {hasNotes ? (
                      <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{activeLesson?.content}</div>
                    ) : (
                      <p className="text-xs text-zinc-600">No lesson notes from instructor.</p>
                    )}
                  </div>
                  <div className="shrink-0 border-t border-white/10 px-3 py-3 bg-zinc-900/50 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {activeLesson && <PersonalNotesPanel courseId={enrollment.courseId} lessonKey={activeLesson.key} compact />}
                  </div>
                  <div className="shrink-0 border-t border-white/10 p-3 bg-black/60 max-h-[220px] overflow-y-auto custom-scrollbar">
                    {activeLesson && (
                      <>
                        <p className="text-xs font-bold text-zinc-400 mb-2">Materials</p>
                        <LessonFilesManager courseId={enrollment.courseId} lessonId={activeLesson.key} canUpload={false} />
                      </>
                    )}
                  </div>
                </aside>
              </div>
            ) : (
            <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto space-y-8 pb-6 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.1),transparent)]">
              <AnimatePresence mode="wait">
                <motion.div key={activeLesson?.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
                  <div className={`grid gap-6 lg:gap-8 ${hasVideo && hasNotes ? 'lg:grid-cols-2 lg:items-start' : ''}`}>
                    {hasVideo && (
                      <div className="space-y-3 lg:sticky lg:top-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/90">Video</span>
                          {hasNotes && <span className="text-[10px] text-zinc-600">Then read notes alongside →</span>}
                        </div>
                        <LessonVideoPanel videoUrl={activeLesson!.videoUrl} className="rounded-3xl" />
                      </div>
                    )}
                    {hasNotes && (
                      <div className="relative rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 shadow-xl shadow-black/25 backdrop-blur-sm overflow-hidden">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent" />
                        <p className="text-[11px] font-semibold text-indigo-300/90 uppercase tracking-wider mb-2">Lesson notes · instructor (read-only)</p>
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-5 text-white border-l-4 border-indigo-500 pl-4">{activeLesson?.title}</h2>
                        <div className="text-zinc-300 text-[15px] leading-[1.65] whitespace-pre-wrap font-medium">{activeLesson?.content}</div>
                      </div>
                    )}
                  </div>

                  {!hasNotes && !hasVideo && (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-zinc-900/25 px-8 py-14 text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-800/80 flex items-center justify-center ring-1 ring-white/10">
                        <BookOpen size={28} className="text-zinc-600" />
                      </div>
                      <h2 className="text-lg font-bold mb-2 text-zinc-200">{activeLesson?.title}</h2>
                      <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">This lesson does not have a video or notes yet. Continue to the next lesson or check back later.</p>
                    </div>
                  )}

                  {activeLesson && (
                    <PersonalNotesPanel courseId={enrollment.courseId} lessonKey={activeLesson.key} />
                  )}

                  {activeLesson && (
                    <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center ring-1 ring-indigo-500/20">
                          <FileText size={18} className="text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Learning materials</h4>
                          <p className="text-[11px] text-zinc-500">Files attached to this lesson</p>
                        </div>
                      </div>
                      <LessonFilesManager courseId={enrollment.courseId} lessonId={activeLesson.key} canUpload={false} />
                    </div>
                  )}

                  {lessonQuizAttempts.length > 0 && (
                    <div className="rounded-3xl border border-white/10 bg-zinc-900/30 p-5 sm:p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <ClipboardList size={16} className="text-indigo-400" />
                        <p className="text-sm font-bold text-zinc-200">Quiz attempts</p>
                        <span className="text-[10px] text-zinc-600 ml-auto uppercase tracking-wider font-semibold">This lesson</span>
                      </div>
                      <div className="rounded-xl border border-white/5 overflow-hidden divide-y divide-white/5">
                        {lessonQuizAttempts.slice(0, 6).map((a: any) => (
                          <div key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-xs bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <span className="text-zinc-500">{a.createdAt ? new Date(a.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
                            <span className={a.passed ? 'text-emerald-400 font-semibold tabular-nums' : 'text-amber-400 font-semibold tabular-nums'}>
                              {a.score}/{a.total} · {a.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            )
          ) : !quizSubmitted ? (
            <div className="p-5 md:p-8 max-w-2xl mx-auto flex flex-col min-h-[min(70vh,560px)]">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Lesson Quiz</h2>
                  <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{activeLesson?.title}</p>
                  {quizFromTranscript && <p className="text-xs text-emerald-400/90 mt-1">Based on the lesson video transcript.</p>}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold tabular-nums ${timeLeft <= 10 ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'border-white/10 bg-white/5 text-zinc-200'}`}>
                  <Timer size={16} className="opacity-80" />
                  {timeLeft}s
                </div>
              </div>

              <div className="flex gap-1.5 mb-6">
                {quizQuestions.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < quizCurrentIndex ? 'bg-emerald-500' : i === quizCurrentIndex ? 'bg-indigo-500' : 'bg-white/10'}`} />
                ))}
              </div>
              <p className="text-xs text-zinc-500 mb-4">Question {quizCurrentIndex + 1} of {quizQuestions.length} · {QUIZ_SEC_PER_QUESTION}s per question</p>

              {currentQ && (
                <motion.div key={quizCurrentIndex} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="bg-zinc-900 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 flex-1 shadow-xl">
                  <p className="font-medium text-base leading-snug">{currentQ.question}</p>
                  <div className="grid gap-2">
                    {currentQ.options.map((opt, oi) => {
                      const sel = quizAnswers[quizCurrentIndex] === oi;
                      return (
                        <button type="button" key={oi} onClick={() => setQuizAnswers((a) => ({ ...a, [quizCurrentIndex]: oi }))}
                          className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${sel ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          <span className="font-bold mr-2 text-xs opacity-70">{String.fromCharCode(65 + oi)}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-6 pb-8">
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-2xl border p-6 text-center ${passed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/5'}`}>
                {passed ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Trophy size={32} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-emerald-300 mb-1">You passed!</h2>
                    <p className="text-sm text-emerald-200/80">You scored {quizPct}% — at or above the {QUIZ_PASS_PERCENT}% pass mark. Great work.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/15 flex items-center justify-center">
                      <Target size={28} className="text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-amber-200 mb-1">Keep practicing</h2>
                    <p className="text-sm text-zinc-400">You scored {quizPct}%. Pass mark is {QUIZ_PASS_PERCENT}%. Review the lesson and try again.</p>
                  </>
                )}
                <p className="mt-4 text-lg font-bold text-white tabular-nums">{quizScore} / {quizQuestions.length} correct</p>
              </motion.div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Review</p>
                {quizQuestions.map((q, qi) => {
                  const ua = quizAnswers[qi];
                  const ok = ua === q.correctAnswer;
                  return (
                    <div key={qi} className={`rounded-xl border p-4 text-sm ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-zinc-900/80'}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 flex-shrink-0 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{ok ? <CheckCircle2 size={16} /> : <X size={16} />}</span>
                        <div>
                          <p className="font-medium text-zinc-200">{q.question}</p>
                          {quizAnswers[qi] === undefined ? <p className="text-xs text-zinc-500 mt-1">No answer (time ran out)</p> : !ok && (
                            <p className="text-xs text-zinc-500 mt-1">Your answer: {q.options[ua]}</p>
                          )}
                          {q.explanation && <p className="text-xs text-zinc-500 mt-2"><span className="font-bold text-zinc-400">Why: </span>{q.explanation}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button type="button" onClick={() => { setShowQuiz(false); if (passed) markComplete(); }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {passed ? <><CheckCircle2 size={18} /> Continue lesson</> : <><RefreshCw size={18} /> Back to lesson</>}
              </button>
            </div>
          )}
        </div>

        {!showQuiz ? (
          learnerTab === 'quizReview' || learnerTab === 'courseReviews' || learnerTab === 'assignments' ? (
            <div className="border-t border-white/10 px-4 sm:px-7 py-4 flex justify-center bg-gradient-to-t from-black/90 via-zinc-950/95 to-zinc-950/90 flex-shrink-0 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setLearnerTab('content')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-900/30"
              >
                <ArrowLeft size={14} /> Back to Learn
              </button>
            </div>
          ) : (
          <div className="border-t border-white/10 px-4 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-black/90 via-zinc-950/95 to-zinc-950/90 flex-shrink-0 backdrop-blur-md">
            <button type="button" onClick={() => { if (currentIndex > 0) setActiveLesson(allLessons[currentIndex - 1]); }} disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-sm font-medium transition-all ring-1 ring-white/5"
            >
              <ArrowLeft size={14} /> Previous
            </button>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 order-last w-full sm:order-none sm:w-auto rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2.5 shadow-inner shadow-black/20">
              {quizError && <p className="text-xs text-red-400 w-full text-center sm:w-auto">{quizError}</p>}
              <button type="button" onClick={generateQuiz} disabled={generatingQuiz}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 border border-violet-500/25 disabled:opacity-50 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-violet-950/20"
              >
                {generatingQuiz ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Brain size={14} /> Lesson quiz</>}
              </button>
              {completedLessons.has(activeLesson?.key) ? (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-medium ring-1 ring-emerald-500/20">
                  <CheckCircle2 size={14} /> Completed
                </div>
              ) : lessonQuizPassed ? (
                <button type="button" onClick={markComplete} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/30">
                  <CheckCircle size={14} /> Mark complete
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Take the lesson quiz and reach the pass mark to mark this lesson complete."
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-zinc-500 cursor-not-allowed ring-1 ring-white/10"
                >
                  <CheckCircle size={14} /> Mark complete
                </button>
              )}
            </div>
            <button type="button" onClick={() => { if (currentIndex < allLessons.length - 1) setActiveLesson(allLessons[currentIndex + 1]); }} disabled={currentIndex >= allLessons.length - 1}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-sm font-medium transition-all ring-1 ring-white/5"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
          )
        ) : !quizSubmitted ? (
          <div className="border-t border-white/10 px-4 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/90 backdrop-blur-md flex-shrink-0">
            <button type="button" onClick={exitQuiz} className="text-sm text-zinc-500 hover:text-red-400 transition-colors px-2">Exit quiz</button>
            <button type="button" onClick={handleQuizAdvance}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all"
            >
              {quizCurrentIndex >= quizQuestions.length - 1 ? <><CheckCircle size={16} /> Finish</> : <>Next <ArrowRight size={16} /></>}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── My Courses Section (Instructor) ─────────────────────────────────────────
function MyCoursesSection({ user, onNavigate }: { user: any; onNavigate: (s: string) => void }) {
  const { confirm } = useConfirm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [manageFilesCourse, setManageFilesCourse] = useState<Course | null>(null);
  const [viewCourse, setViewCourse] = useState<Course | null>(null);
  const [editCourse, setEditCourse] = useState<Course | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/courses/my`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setCourses(d.courses); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (courseId: string, title: string) => {
    const ok = await confirm({
      title: 'Delete course',
      message: `Delete "${title}"? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    setDeleting(courseId);
    try {
      const r = await fetch(`${API_BASE}/api/courses/${courseId}`, { method: 'DELETE', headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success) setCourses(prev => prev.filter(c => c.id !== courseId));
    } finally { setDeleting(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <button onClick={() => onNavigate('create-course')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> New Course
        </button>
      </div>
      {courses.length === 0 ? (
        <EmptyState icon={<BookOpen size={48} />} title="No courses yet" desc="Create your first course"
          action={{ label: 'Create Course', onClick: () => onNavigate('create-course') }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, idx) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
            >
              <div className="h-32 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center relative overflow-hidden">
                {course.thumbnail ? <img src={`${API_BASE}${course.thumbnail}`} alt={course.title} className="w-full h-full object-cover" /> : <BookOpen size={40} className="text-indigo-400/40" />}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{course.status}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-3 mb-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Users size={11} /> {course.enrollmentCount || 0}</span>
                  <span className="flex items-center gap-1"><BookOpen size={11} /> {course.modules?.length || 0} modules</span>
                  <span className="flex items-center gap-1"><ClipboardList size={11} /> {course.assignmentCount ?? 0} assignments</span>
                  <span>{course.isFree ? 'Free' : `$${course.price}`}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setViewCourse(course)}
                    className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Eye size={11} /> View
                  </button>
                  <button onClick={() => setManageFilesCourse(course)}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Upload size={11} /> Files
                  </button>
                  <button onClick={() => setEditCourse(course)} className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                    <Edit size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(course.id, course.title)} disabled={deleting === course.id}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {deleting === course.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lesson Files Management Modal */}
      <AnimatePresence>
        {viewCourse && (
          <InstructorCourseView course={viewCourse} user={user} onClose={() => setViewCourse(null)} />
        )}
        {editCourse && (
          <EditCourseModal course={editCourse} onClose={() => setEditCourse(null)}
            onSaved={() => { setEditCourse(null); load(); }}
          />
        )}
        {manageFilesCourse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setManageFilesCourse(null)}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Manage Lesson Files</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">{manageFilesCourse.title}</p>
                </div>
                <button onClick={() => setManageFilesCourse(null)} className="p-2 hover:bg-white/10 rounded-xl">
                  <X size={18} />
                </button>
              </div>
              {(manageFilesCourse.modules || []).length === 0 ? (
                <p className="text-zinc-500 text-sm">No modules in this course yet. Add modules when creating/editing the course.</p>
              ) : (
                (manageFilesCourse.modules || []).map((mod: any, mi: number) => (
                  <div key={mi} className="space-y-3">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Module {mi + 1}: {mod.title}</p>
                    <div className="pl-3 border-l border-white/10 space-y-4">
                      {(mod.lessons || []).map((les: any, li: number) => (
                        <div key={li} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                          <p className="text-sm font-medium text-zinc-300">Lesson {li + 1}: {les.title}</p>
                          <LessonFilesManager
                            courseId={manageFilesCourse.id}
                            lessonId={les.id || `${mi}-${li}`}
                            canUpload={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InstructorCourseView({ course, user, onClose }: { course: Course; user: any; onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'students' | 'discussions' | 'assignments'>('preview');

  useEffect(() => {
    setLoadingStudents(true);
    fetch(`${API_BASE}/api/enrollments/course/${course.id}/students`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setStudents(d.students); })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [course.id]);

  const avgProgress = students.length
    ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length)
    : 0;

  const TABS = [
    { id: 'preview', label: 'Preview', icon: BookOpen },
    { id: 'students', label: `Students (${students.length})`, icon: UserCheck },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 sm:p-5 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.97, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
        className="bg-[#0c0c0e] border border-white/[0.07] rounded-2xl w-full max-w-5xl max-h-full overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-white tracking-tight truncate">{course.title}</h2>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">Preview, students, assignments &amp; discussions</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-md text-zinc-500 hover:text-white transition-colors shrink-0 ml-3">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-white/[0.06] bg-white/[0.012] shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'bg-white/[0.07] text-white'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={13} strokeWidth={1.75} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'preview' && (
            <div className="space-y-5">
              {/* Two-column preview */}
              <div className="grid lg:grid-cols-[300px_1fr] gap-4">
                {/* Left: thumbnail + stats */}
                <div className="space-y-3">
                  <div className="aspect-video rounded-xl bg-[#141415] border border-white/[0.06] overflow-hidden flex items-center justify-center">
                    {course.thumbnail
                      ? <img src={`${API_BASE}${course.thumbnail}`} alt={course.title} className="w-full h-full object-cover" />
                      : <BookOpen size={36} className="text-zinc-700" strokeWidth={1.5} />}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCard icon={<Users size={14} strokeWidth={1.75} />} label="Students" value={students.length} />
                    <MetricCard icon={<TrendingUp size={14} strokeWidth={1.75} />} label="Avg Progress" value={`${avgProgress}%`} />
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-4 space-y-2">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Course details</p>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">{course.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10.5px] bg-indigo-500/[0.1] text-indigo-300 border border-indigo-500/[0.15] px-2 py-0.5 rounded">{course.category}</span>
                      <span className="text-[10.5px] bg-white/[0.04] text-zinc-400 border border-white/[0.06] px-2 py-0.5 rounded capitalize">{course.difficulty}</span>
                      <span className="text-[10.5px] bg-emerald-500/[0.08] text-emerald-300 border border-emerald-500/[0.15] px-2 py-0.5 rounded">{course.isFree ? 'Free' : `$${course.price}`}</span>
                    </div>
                  </div>
                </div>

                {/* Right: curriculum preview */}
                <div className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-4 space-y-3 overflow-y-auto max-h-[420px]">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sticky top-0 bg-neutral-900/95 py-1">Curriculum</p>
                  {(course.modules || []).map((mod: any, mi: number) => (
                    <div key={mi} className="rounded-lg border border-white/[0.05] overflow-hidden">
                      <div className="bg-white/[0.03] px-3.5 py-2.5 flex items-center gap-2 border-b border-white/[0.05]">
                        <span className="w-4 h-4 rounded bg-indigo-600/60 border border-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-white shrink-0">{mi + 1}</span>
                        <p className="text-[13px] font-medium text-white">{mod.title}</p>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {(mod.lessons || []).map((les: any, li: number) => (
                          <div key={li} className="px-3.5 py-2 flex items-center gap-2.5">
                            <span className="w-4 h-4 bg-white/[0.04] rounded flex items-center justify-center text-[10px] text-zinc-500 font-mono shrink-0">{li + 1}</span>
                            <p className="text-[12.5px] text-zinc-300 flex-1 truncate">{les.title}</p>
                            {les.videoUrl ? <Video size={11} className="text-zinc-600 shrink-0" strokeWidth={1.75} /> : <FileText size={11} className="text-zinc-600 shrink-0" strokeWidth={1.75} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Syllabus match */}
              <div className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                    <NotebookText size={13} strokeWidth={1.75} className="text-violet-300" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white tracking-tight">Syllabus vs course</p>
                    <p className="text-[11.5px] text-zinc-500">Compare an external syllabus to your published curriculum.</p>
                  </div>
                </div>
                <SyllabusMatchPanel courseId={course.id} courseTitle={course.title} />
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-3">
              {loadingStudents ? <Spinner /> : students.length === 0 ? (
                <EmptyState icon={<Users size={36} />} title="No students enrolled" desc="Students will appear here after they enroll in this course." />
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-neutral-900/60 overflow-hidden">
                  {students.map((s, idx) => (
                    <div key={s.id} className={`flex items-center gap-4 px-4 py-3.5 ${idx < students.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
                      <div className="w-8 h-8 rounded-md bg-indigo-500/[0.1] border border-indigo-500/20 text-indigo-300 flex items-center justify-center text-[13px] font-semibold shrink-0">
                        {s.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-medium text-white truncate">{s.name}</p>
                        <p className="text-[11.5px] text-zinc-500 truncate">{s.email || 'No email'} · Enrolled {new Date(s.enrolledAt).toLocaleDateString()}</p>
                      </div>
                      <div className="w-40 shrink-0">
                        <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                          <span>Progress</span>
                          <span className="text-white tabular-nums">{s.progress || 0}%</span>
                        </div>
                        <div className="w-full h-[4px] bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${s.progress || 0}%` }} />
                        </div>
                      </div>
                      <span className={`text-[10.5px] px-2 py-0.5 rounded border font-medium shrink-0 ${
                        s.progress >= 100
                          ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300'
                          : s.progress < 25
                          ? 'bg-red-500/[0.08] border-red-500/20 text-red-300'
                          : 'bg-amber-500/[0.08] border-amber-500/20 text-amber-300'
                      }`}>
                        {s.progress >= 100 ? 'Completed' : s.progress < 25 ? 'At risk' : 'Learning'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discussions' && (
            <DiscussionsSection user={user} selectedCourseId={course.id} />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsSection user={user} role="instructor" selectedCourseId={course.id} embedded />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function normalizeEditModules(raw: any[] | undefined): any[] {
  if (!raw?.length) return [];
  return raw.map((m) => ({
    ...m,
    title: m.title ?? '',
    description: m.description ?? '',
    lessons: Array.isArray(m.lessons)
      ? m.lessons.map((l: any) => ({
          ...l,
          title: l.title ?? '',
          type: l.type === 'file' ? 'file' : 'video',
          content: l.content ?? '',
          videoUrl: l.videoUrl ?? '',
        }))
      : [],
  }));
}

function EditCourseModal({ course, onClose, onSaved }: { course: Course; onClose: () => void; onSaved: () => void }) {
  const { confirm } = useConfirm();
  const cats = ['Web Development', 'Data Science', 'Machine Learning', 'Mobile Development', 'Cloud Computing', 'Cybersecurity', 'UI/UX Design', 'Business', 'Mathematics', 'Science', 'Other'];
  const [tab, setTab] = useState<'overview' | 'curriculum'>('overview');
  const [form, setForm] = useState({
    title: course.title,
    description: course.description,
    category: course.category || 'Other',
    difficulty: course.difficulty || 'beginner',
    isFree: course.isFree,
    price: String(course.price ?? ''),
    status: course.status || 'published',
  });
  const [modules, setModules] = useState(() => normalizeEditModules(course.modules));
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(() =>
    course.thumbnail ? `${API_BASE}${course.thumbnail}` : null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (thumbPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbPreview);
    };
  }, [thumbPreview]);

  const handleThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');
    if (thumbPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbPreview);
    setNewThumbnail(f);
    setThumbPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const clearNewThumbnail = () => {
    setError('');
    setNewThumbnail(null);
    if (thumbPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbPreview);
    setThumbPreview(course.thumbnail ? `${API_BASE}${course.thumbnail}` : null);
  };

  const defaultLesson = () => ({ title: '', type: 'video', content: '', videoUrl: '' });
  const defaultModule = () => ({ title: '', description: '', lessons: [defaultLesson()] });

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.category.trim()) {
      setError('Title, description and category are required');
      setTab('overview');
      return;
    }
    if (!form.isFree) {
      const p = Number(form.price);
      if (!form.price.trim() || Number.isNaN(p) || p < 0) {
        setError('Enter a valid price for paid courses, or switch to Free');
        setTab('overview');
        return;
      }
    }
    setSaving(true);
    setError('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'thumbnail') return;
      fd.append(k, String(v));
    });
    if (newThumbnail) fd.append('thumbnail', newThumbnail);
    fd.append('modules', JSON.stringify(modules));
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const r = await fetch(`${API_BASE}/api/courses/${course.id}`, { method: 'PUT', headers, body: fd });
      const d = await r.json();
      if (d.success) onSaved();
      else setError(d.message || 'Failed to save course');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-5xl max-h-[min(92vh,900px)] flex flex-col shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-white/10">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">Edit course</h2>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{course.title}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {([
                ['overview', 'Overview & pricing', LayoutList],
                ['curriculum', 'Curriculum', BookMarked],
              ] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setError(''); setTab(id); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${tab === id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white flex-shrink-0" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Title">
                  <input className={inputCls} value={form.title} placeholder="Course title" onChange={e => { setError(''); setForm(f => ({ ...f, title: e.target.value })); }} />
                </Field>
                <Field label="Category">
                  <select className={selectCls} value={form.category} onChange={e => { setError(''); setForm(f => ({ ...f, category: e.target.value })); }}>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Difficulty">
                  <select className={selectCls} value={form.difficulty} onChange={e => { setError(''); setForm(f => ({ ...f, difficulty: e.target.value })); }}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </Field>
                <Field label="Visibility">
                  <select className={selectCls} value={form.status} onChange={e => { setError(''); setForm(f => ({ ...f, status: e.target.value })); }}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea className={`${inputCls} resize-none`} rows={4} value={form.description} placeholder="What students learn, prerequisites, outcomes…" onChange={e => { setError(''); setForm(f => ({ ...f, description: e.target.value })); }} />
                  </Field>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 space-y-4">
                <p className="text-sm font-bold text-zinc-200">Pricing</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Access">
                    <div className="flex gap-2 mt-1">
                      {[{ val: true, label: 'Free', color: 'border-green-500 bg-green-500/10 text-green-400' }, { val: false, label: 'Paid', color: 'border-amber-500 bg-amber-500/10 text-amber-400' }].map(p => (
                        <button
                          key={String(p.val)}
                          type="button"
                          onClick={() => { setError(''); setForm(f => ({ ...f, isFree: p.val })); }}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.isFree === p.val ? p.color : 'border-white/10 bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  {!form.isFree && (
                    <Field label="Price (USD)">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                        <input type="number" min={0} step="0.01" className={`${inputCls} pl-7`} value={form.price} placeholder="29.99" onChange={e => { setError(''); setForm(f => ({ ...f, price: e.target.value })); }} />
                      </div>
                    </Field>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold text-zinc-200">Course thumbnail</p>
                <div className="flex flex-wrap gap-4 items-start">
                  <label className="cursor-pointer border-2 border-dashed border-white/20 hover:border-indigo-500/50 rounded-xl px-5 py-4 flex flex-col items-center gap-1 text-sm text-zinc-400 hover:text-white transition-all hover:bg-indigo-500/5">
                    <Upload size={20} className="text-indigo-400" />
                    <span>Replace image</span>
                    <span className="text-xs text-zinc-600">PNG, JPG, WEBP — max 5MB</span>
                    <input type="file" accept="image/*" onChange={handleThumb} className="hidden" />
                  </label>
                  {thumbPreview && (
                    <div className="relative">
                      <img src={thumbPreview} alt="" className="w-36 h-24 rounded-xl object-cover border border-white/10" />
                      {newThumbnail && (
                        <button type="button" onClick={clearNewThumbnail} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg" title="Use previous thumbnail">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'curriculum' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">Add or reorder modules and lessons. IDs are kept so existing enrollments and uploaded files stay linked.</p>
              {modules.length === 0 ? (
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center space-y-3">
                  <p className="text-zinc-400 text-sm">This course has no modules yet.</p>
                  <button type="button" onClick={() => setModules([defaultModule()])} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2">
                    <Plus size={16} /> Add first module
                  </button>
                </div>
              ) : (
                modules.map((mod: any, mi: number) => (
                  <div key={mod.id ?? `mod-${mi}`} className="bg-zinc-900 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{mi + 1}</span>
                        <span className="text-sm font-bold text-indigo-400 truncate">Module {mi + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Remove module',
                            message: `Remove module ${mi + 1} and all its lessons? This only affects the draft you are editing until you publish.`,
                            variant: 'danger',
                            confirmLabel: 'Remove module',
                            cancelLabel: 'Cancel',
                          });
                          if (!ok) return;
                          setModules((ms) => ms.filter((_, i) => i !== mi));
                        }}
                        className="text-red-400/70 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                        title="Remove module"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Module title">
                        <input className={inputCls} value={mod.title} placeholder="e.g. Introduction" onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, title: e.target.value } : m))} />
                      </Field>
                      <Field label="Module summary">
                        <input className={inputCls} value={mod.description || ''} placeholder="Short overview" onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, description: e.target.value } : m))} />
                      </Field>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lessons</p>
                      {(mod.lessons || []).map((les: any, li: number) => (
                        <div key={les.id ?? `les-${mi}-${li}`} className="bg-zinc-800/60 border border-white/5 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                              <span className="w-5 h-5 bg-white/10 rounded-md flex items-center justify-center text-[10px] font-bold">{li + 1}</span>
                              Lesson {li + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: (m.lessons || []).filter((_: any, j: number) => j !== li) } : m))}
                              disabled={(mod.lessons || []).length <= 1}
                              className="text-red-400/60 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                              title="Remove lesson"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <Field label="Lesson title">
                              <input className={inputCls} value={les.title} placeholder="Lesson name" onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: (m.lessons || []).map((l: any, j: number) => j === li ? { ...l, title: e.target.value } : l) } : m))} />
                            </Field>
                            <Field label="Type">
                              <select
                                className={selectCls}
                                value={les.type || 'video'}
                                onChange={e => setModules(ms => ms.map((m, i) => i === mi ? {
                                  ...m,
                                  lessons: (m.lessons || []).map((l: any, j: number) => j === li ? { ...l, type: e.target.value, videoUrl: e.target.value === 'file' ? '' : l.videoUrl } : l),
                                } : m))}
                              >
                                <option value="video">Video</option>
                                <option value="file">File / PDF</option>
                              </select>
                            </Field>
                            <Field label={les.type === 'file' ? 'Video URL (N/A for file lessons)' : 'Video URL'}>
                              <input
                                className={inputCls}
                                value={les.videoUrl || ''}
                                disabled={les.type === 'file'}
                                placeholder="https://…"
                                onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: (m.lessons || []).map((l: any, j: number) => j === li ? { ...l, videoUrl: e.target.value } : l) } : m))}
                              />
                            </Field>
                          </div>
                          <Field label="Lesson notes / content">
                            <textarea
                              className={`${inputCls} resize-none`}
                              rows={3}
                              value={les.content || ''}
                              placeholder="Notes, instructions, or embedded content for students…"
                              onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: (m.lessons || []).map((l: any, j: number) => j === li ? { ...l, content: e.target.value } : l) } : m))}
                            />
                          </Field>
                          <p className="text-[11px] text-zinc-600">Attach PDFs and materials from My Courses → Files after saving.</p>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: [...(m.lessons || []), defaultLesson()] } : m))}
                        className="w-full py-2 rounded-xl border border-dashed border-white/15 text-zinc-400 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Plus size={14} /> Add lesson
                      </button>
                    </div>
                  </div>
                ))
              )}
              {modules.length > 0 && (
                <button type="button" onClick={() => setModules(ms => [...ms, defaultModule()])} className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold text-zinc-300 flex items-center justify-center gap-2 transition-all">
                  <Plus size={16} /> Add module
                </button>
              )}
            </div>
          )}

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">{error}</div>}
        </div>

        <div className="flex-shrink-0 flex flex-wrap justify-end gap-3 p-5 sm:p-6 border-t border-white/10 bg-zinc-950/95">
          <button type="button" onClick={onClose} className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Save changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Create Course Section ────────────────────────────────────────────────────
function CreateCourseSection({ onSuccess }: { onSuccess: () => void }) {
  const { confirm } = useConfirm();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', difficulty: 'beginner', isFree: true, price: '', thumbnail: null as File | null });
  const [modules, setModules] = useState([{ title: '', description: '', lessons: [{ title: '', type: 'video', content: '', videoUrl: '' }] }]);
  const [lessonFiles, setLessonFiles] = useState<Record<string, File[]>>({});
  const cats = ['Web Development','Data Science','Machine Learning','Mobile Development','Cloud Computing','Cybersecurity','UI/UX Design','Business','Mathematics','Science','Other'];

  const handleThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setError(''); setForm(ff => ({ ...ff, thumbnail: f })); setPreview(URL.createObjectURL(f)); }
  };

  const addLessonFiles = (modIdx: number, lesIdx: number, files: FileList) => {
    const key = `${modIdx}-${lesIdx}`;
    setLessonFiles(prev => ({ ...prev, [key]: [...(prev[key] || []), ...Array.from(files)] }));
  };

  const removeLessonFile = (modIdx: number, lesIdx: number, fileIdx: number) => {
    const key = `${modIdx}-${lesIdx}`;
    setLessonFiles(prev => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== fileIdx) }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Course title is required'); setStep(1); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries({ ...form, category: form.category || 'Other', description: form.description || 'Course description coming soon.' }).forEach(([k, v]) => { if (k !== 'thumbnail' && v !== null) fd.append(k, String(v)); });
      if (form.thumbnail) fd.append('thumbnail', form.thumbnail);
      const validModules = modules.filter(m => m.title.trim());
      fd.append('modules', JSON.stringify(validModules));
      const token = localStorage.getItem('token');
      const r = await fetch(`${API_BASE}/api/courses`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const d = await r.json();
      if (!d.success) { setError(d.message || 'Failed'); return; }

      // Upload lesson files if any
      const hasFiles = Object.values(lessonFiles).some(f => f.length > 0);
      if (hasFiles && d.course) {
        setUploadingFiles(true);
        const createdCourse = d.course;
        for (let mi = 0; mi < (createdCourse.modules || []).length; mi++) {
          const mod = createdCourse.modules[mi];
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const key = `${mi}-${li}`;
            const files = lessonFiles[key];
            if (files && files.length > 0) {
              const lessonId = mod.lessons[li].id || key;
              const filesFd = new FormData();
              files.forEach(f => filesFd.append('files', f));
              await fetch(`${API_BASE}/api/lesson-files/${createdCourse.id}/lessons/${lessonId}/files`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: filesFd,
              }).catch(() => {});
            }
          }
        }
        setUploadingFiles(false);
      }
      onSuccess();
    } catch { setError('Network error'); }
    finally { setLoading(false); setUploadingFiles(false); }
  };

  const stepLabels = ['Basic Info', 'Modules & Lessons', 'Review & Publish'];

  return (
    <div className="w-full space-y-5">
      {sectionHeading('Create course', 'Share your knowledge with learners worldwide.')}

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1,2,3].map(s => (
          <React.Fragment key={s}>
            <button onClick={() => step > s && setStep(s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors border ${
                step === s
                  ? 'bg-indigo-600/80 border-indigo-500/40 text-white'
                  : step > s
                  ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300 cursor-pointer hover:bg-emerald-500/[0.14]'
                  : 'bg-white/[0.025] border-white/[0.06] text-zinc-500 cursor-default'
              }`}
            >
              <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step === s ? 'bg-white/20' : step > s ? '' : 'bg-white/[0.06]'}`}>
                {step > s ? <CheckCircle size={10} strokeWidth={2.5} /> : s}
              </span>
              <span className="hidden sm:inline">{stepLabels[s-1]}</span>
            </button>
            {s < 3 && <div className={`flex-1 h-px rounded-full ${step > s ? 'bg-emerald-500/50' : 'bg-white/[0.06]'}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/[0.07] border border-red-500/20 text-red-300 text-[13px]">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className={`${panelCls} p-5 space-y-4`}>
            <Field label="Course Title *"><input value={form.title} onChange={e => { setError(''); setForm(f => ({ ...f, title: e.target.value })); }} placeholder="e.g. Complete Python Bootcamp" className={inputCls} /></Field>
            <Field label="Description"><textarea value={form.description} onChange={e => { setError(''); setForm(f => ({ ...f, description: e.target.value })); }} rows={4} className={`${inputCls} resize-none`} placeholder="What will students learn? What are the prerequisites?" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select value={form.category} onChange={e => { setError(''); setForm(f => ({ ...f, category: e.target.value })); }} className={selectCls}>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Difficulty Level">
                <select value={form.difficulty} onChange={e => { setError(''); setForm(f => ({ ...f, difficulty: e.target.value })); }} className={selectCls}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pricing">
                <div className="flex gap-3 mt-1">
                  {[{ val: true, label: 'Free', color: 'border-green-500 bg-green-500/10 text-green-400' }, { val: false, label: 'Paid', color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400' }].map(p => (
                    <button key={String(p.val)} type="button"
                      onClick={() => { setError(''); setForm(f => ({ ...f, isFree: p.val })); }}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.isFree === p.val ? p.color : 'border-white/10 bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                    >{p.label}</button>
                  ))}
                </div>
              </Field>
              {!form.isFree && (
                <Field label="Price (USD)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                    <input type="number" value={form.price} onChange={e => { setError(''); setForm(f => ({ ...f, price: e.target.value })); }} placeholder="29.99" className={`${inputCls} pl-7`} />
                  </div>
                </Field>
              )}
            </div>
            <Field label="Course Thumbnail">
              <div className="flex gap-4 items-center">
                <label className="cursor-pointer border-2 border-dashed border-white/20 hover:border-indigo-500/50 rounded-xl px-6 py-4 flex flex-col items-center gap-2 text-sm text-zinc-400 hover:text-white transition-all hover:bg-indigo-500/5">
                  <Upload size={20} className="text-indigo-400" />
                  <span>Upload thumbnail</span>
                  <span className="text-xs text-zinc-600">PNG, JPG, WEBP — max 5MB</span>
                  <input type="file" accept="image/*" onChange={handleThumb} className="hidden" />
                </label>
                {preview && (
                  <div className="relative">
                    <img src={preview} alt="" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
                    <button onClick={() => { setError(''); setPreview(null); setForm(f => ({ ...f, thumbnail: null })); }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    ><X size={10} /></button>
                  </div>
                )}
              </div>
            </Field>
          </div>
          <div className="flex justify-end">
            <button onClick={() => { if (!form.title.trim()) { setError('Course title is required'); return; } setError(''); setStep(2); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
            >Next <ChevronRight size={14} strokeWidth={2} /></button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Modules & Lessons */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
          {modules.map((mod, mi) => (
            <div key={mi} className={`${panelCls} p-4 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-600/70 border border-indigo-500/30 rounded-md flex items-center justify-center text-[10.5px] font-bold">{mi + 1}</span>
                  <span className="text-[13px] font-semibold text-white">Module {mi + 1}</span>
                </div>
                {modules.length > 1 && (
                  <button onClick={() => setModules(m => m.filter((_, i) => i !== mi))} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} strokeWidth={1.75} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Module Title *"><input value={mod.title} onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, title: e.target.value } : m))} placeholder="e.g. Introduction to Python" className={inputCls} /></Field>
                <Field label="Short Description"><input value={mod.description} onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, description: e.target.value } : m))} placeholder="Brief module overview" className={inputCls} /></Field>
              </div>

              {/* Lessons */}
              <div className="space-y-2.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Lessons</p>
                {mod.lessons.map((les, li) => {
                  const fileKey = `${mi}-${li}`;
                  const pendingFiles = lessonFiles[fileKey] || [];
                  return (
                    <div key={li} className="bg-white/[0.025] border border-white/[0.06] rounded-lg p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-zinc-400 flex items-center gap-1.5">
                          <span className="w-4 h-4 bg-white/[0.06] rounded flex items-center justify-center text-[10px] font-bold text-zinc-400">{li + 1}</span>
                          Lesson {li + 1}
                        </span>
                        {mod.lessons.length > 1 && (
                          <button onClick={() => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m))}
                            className="text-red-400/60 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-all"
                          ><X size={11} /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Field label="Lesson Title *">
                          <input value={les.title} onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, title: e.target.value } : l) } : m))} placeholder="e.g. Variables and Types" className={inputCls} />
                        </Field>
                        <Field label="Lesson Type">
                          <select value={(les as any).type || 'video'} onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, type: e.target.value, videoUrl: e.target.value === 'file' ? '' : l.videoUrl } : l) } : m))} className={selectCls}>
                            <option value="video">Video Lesson</option>
                            <option value="file">File / PDF Lesson</option>
                          </select>
                        </Field>
                        <Field label={(les as any).type === 'file' ? 'Required File' : 'Video URL'}>
                          {(les as any).type === 'file' ? (
                            <label className="cursor-pointer flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 hover:border-indigo-500/40 rounded-xl px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition-all">
                              <Upload size={13} className="text-indigo-400" /> Upload PDF/File
                              <input type="file" multiple className="hidden"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                                onChange={e => e.target.files && addLessonFiles(mi, li, e.target.files)}
                              />
                            </label>
                          ) : (
                            <input value={les.videoUrl} onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, videoUrl: e.target.value } : l) } : m))} placeholder="https://youtube.com/..." className={inputCls} />
                          )}
                        </Field>
                      </div>
                      <Field label="Lesson Content / Notes">
                        <textarea value={les.content} onChange={e => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, content: e.target.value } : l) } : m))} rows={3} className={`${inputCls} resize-none`} placeholder="Write lesson notes, explanations, code snippets..." />
                      </Field>
                      {/* File Attachments */}
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5"><FileText size={11} /> Attach Materials (PDF, Word, Excel, PPT, Images, ZIP)</p>
                        <label className={`cursor-pointer flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 hover:border-indigo-500/40 rounded-xl px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition-all w-fit ${(les as any).type === 'file' ? 'hidden' : ''}`}>
                          <Upload size={13} className="text-indigo-400" /> Add files
                          <input type="file" multiple className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.zip"
                            onChange={e => e.target.files && addLessonFiles(mi, li, e.target.files)}
                          />
                        </label>
                        {pendingFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {pendingFiles.map((f, fi) => (
                              <div key={fi} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 text-xs">
                                <FileText size={11} className="text-indigo-400 flex-shrink-0" />
                                <span className="flex-1 truncate text-zinc-300">{f.name}</span>
                                <span className="text-zinc-600">{(f.size / 1024).toFixed(0)}KB</span>
                                <button onClick={() => removeLessonFile(mi, li, fi)} className="text-red-400/60 hover:text-red-400 p-0.5 rounded transition-all"><X size={10} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: [...m.lessons, { title: '', type: 'video', content: '', videoUrl: '' }] } : m))}
                  className="text-[12px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 hover:bg-indigo-500/[0.08] rounded-md transition-colors border border-transparent hover:border-indigo-500/20"
                ><Plus size={11} strokeWidth={2} /> Add lesson</button>
              </div>
            </div>
          ))}

          <button onClick={() => setModules(m => [...m, { title: '', description: '', lessons: [{ title: '', type: 'video', content: '', videoUrl: '' }] }])}
            className="w-full border border-dashed border-white/[0.08] hover:border-white/[0.14] rounded-lg py-4 text-[13px] text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={14} strokeWidth={2} /> Add module
          </button>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-md text-[13px] font-medium border border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors">← Back</button>
            <button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors">
              Review <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className={`${panelCls} p-5 space-y-5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 flex items-center gap-1.5">
              <CheckCircle size={11} strokeWidth={2} className="text-emerald-400" /> Course summary
            </p>

            {/* Thumbnail + basic info */}
            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#141415] border border-white/[0.06] flex items-center justify-center shrink-0">
                {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <BookOpen size={24} className="text-zinc-600" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-semibold tracking-tight text-white">{form.title || 'Untitled Course'}</h4>
                <p className="text-[12.5px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{form.description}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10.5px] bg-indigo-500/[0.12] text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/[0.15]">{form.category}</span>
                  <span className="text-[10.5px] bg-white/[0.04] text-zinc-400 px-2 py-0.5 rounded border border-white/[0.06] capitalize">{form.difficulty}</span>
                  <span className={`text-[10.5px] px-2 py-0.5 rounded border font-medium ${form.isFree ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300' : 'bg-amber-500/[0.08] border-amber-500/20 text-amber-300'}`}>
                    {form.isFree ? 'Free' : `$${form.price}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Modules', value: modules.filter(m => m.title).length },
                { label: 'Lessons', value: modules.reduce((s, m) => s + m.lessons.filter(l => l.title).length, 0) },
                { label: 'Files', value: Object.values(lessonFiles).reduce((s, f) => s + f.length, 0) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.025] border border-white/[0.05] rounded-lg p-3 text-center">
                  <p className="text-[22px] font-semibold tabular-nums text-white leading-none">{value}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Module list */}
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Content overview</p>
              {modules.filter(m => m.title).map((mod, mi) => (
                <div key={mi} className="flex items-center gap-2.5 bg-white/[0.025] border border-white/[0.05] rounded-lg px-3.5 py-2">
                  <span className="w-4.5 h-4.5 bg-indigo-600/70 border border-indigo-500/30 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{mi + 1}</span>
                  <span className="text-[13px] font-medium flex-1 truncate text-zinc-200">{mod.title}</span>
                  <span className="text-[11px] text-zinc-500 shrink-0">{mod.lessons.filter(l => l.title).length} lessons</span>
                  {Object.entries(lessonFiles).filter(([k]) => k.startsWith(`${mi}-`) && lessonFiles[k]?.length > 0).length > 0 && (
                    <span className="text-[10.5px] bg-indigo-500/[0.1] text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <FileText size={9} /> files
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-md text-[13px] font-medium border border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors">← Back</button>
            <button onClick={handleSubmit} disabled={loading || uploadingFiles}
              className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 px-6 py-2 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-colors"
            >
              {loading ? <><Loader2 size={13} className="animate-spin" />Creating…</>
                : uploadingFiles ? <><Loader2 size={13} className="animate-spin" />Uploading…</>
                : <>Publish course</>}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── AI Assistant Section ─────────────────────────────────────────────────────
function AIAssistantSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your EDU-REV AI Learning Assistant powered by Groq. I can explain concepts, answer questions, help with assignments, and guide your learning. What would you like to learn today?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim(); setInput('');
    const newMsgs: ChatMessage[] = [...messages, { role: 'user', content: msg, timestamp: new Date() }];
    setMessages(newMsgs); setLoading(true);
    try {
      const history = newMsgs.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const r = await fetch(`${API_BASE}/api/ai/chat`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ message: msg, history: history.slice(0, -1), context }) });
      const d = await r.json();
      setMessages(prev => [...prev, { role: 'assistant', content: d.success ? d.reply : `Error: ${d.message}`, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Check if backend is running.', timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const suggestions = ['Explain neural networks simply', 'What is recursion with an example?', 'How does gradient descent work?', 'Difference between SQL and NoSQL'];

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] w-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-white">AI Assistant</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Powered by Groq · Llama 3.3 70B</p>
        </div>
      </div>

      {/* Context field */}
      <input
        value={context}
        onChange={e => setContext(e.target.value)}
        placeholder="Optional context — e.g. 'Python programming', 'Organic chemistry'"
        className={`${inputCls} shrink-0 text-[12.5px]`}
      />

      {/* Chat thread */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 px-1 py-3 bg-[#0d0d0f] border border-white/[0.06] rounded-xl">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}
            className={`flex gap-2.5 px-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === 'assistant'
                ? 'bg-indigo-600/80 border border-indigo-500/30'
                : 'bg-white/[0.06] border border-white/[0.08]'
            }`}>
              {msg.role === 'assistant' ? <Bot size={13} strokeWidth={1.75} /> : <span className="text-[11px] font-bold text-zinc-300">U</span>}
            </div>
            <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600/80 text-white rounded-tr-sm'
                  : 'bg-white/[0.035] border border-white/[0.07] text-zinc-200 rounded-tl-sm'
              }`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <span className="text-[10px] text-zinc-600 px-0.5">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex gap-2.5 px-3">
            <div className="w-7 h-7 rounded-md bg-indigo-600/80 border border-indigo-500/30 flex items-center justify-center mt-0.5 shrink-0">
              <Bot size={13} strokeWidth={1.75} />
            </div>
            <div className="bg-white/[0.035] border border-white/[0.07] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <span className="text-[12px] text-zinc-500">Generating</span>
              <span className="flex gap-1">
                {[0, 120, 240].map(d => (
                  <span key={d} className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestion chips — shown only before first user message */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 gap-1.5 shrink-0">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s)}
              className={`text-left text-[12px] ${panelCls} px-3.5 py-2.5 text-zinc-400 hover:text-white hover:border-white/[0.12] transition-colors leading-snug`}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask anything…"
          disabled={loading}
          className={`${inputCls} flex-1 py-3`}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 rounded-lg transition-colors"
          aria-label="Send"
        >
          <Send size={15} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────
function SettingsSection({
  user,
  lang,
  setLang,
  updateUser,
}: {
  user: any;
  lang: string;
  setLang: (l: any) => void;
  updateUser: (partial: Record<string, unknown>) => void;
}) {
  const [compactMode, setCompactMode] = useState(false);
  const [savingInsights, setSavingInsights] = useState(false);
  const [insightsMsg, setInsightsMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fullName, setFullName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [insights, setInsights] = useState({
    careerOrStudyGoal: '',
    weeklyStudyHours: '',
    subjectsOfInterest: '',
    learningChallenges: '',
    preferredFormats: '',
  });
  const profileHydrated = useRef(false);

  useEffect(() => {
    setFullName(user?.name || '');
  }, [user?.name, user?.id]);

  useEffect(() => {
    if (user?.role !== 'student' || profileHydrated.current) return;
    profileHydrated.current = true;
    fetch(`${API_BASE}/api/auth/profile`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user?.insightsProfile) {
          updateUser({ insightsProfile: d.user.insightsProfile });
        }
      })
      .catch(() => {});
  }, [user?.role, updateUser]);

  useEffect(() => {
    const ip = user?.insightsProfile;
    if (ip && typeof ip === 'object') {
      setInsights({
        careerOrStudyGoal: typeof ip.careerOrStudyGoal === 'string' ? ip.careerOrStudyGoal : '',
        weeklyStudyHours: typeof ip.weeklyStudyHours === 'string' ? ip.weeklyStudyHours : '',
        subjectsOfInterest: typeof ip.subjectsOfInterest === 'string' ? ip.subjectsOfInterest : '',
        learningChallenges: typeof ip.learningChallenges === 'string' ? ip.learningChallenges : '',
        preferredFormats: typeof ip.preferredFormats === 'string' ? ip.preferredFormats : '',
      });
    }
  }, [user?.id, user?.insightsProfile]);

  const saveDisplayName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameMsg({ ok: false, text: 'Please enter your full name.' });
      return;
    }
    setSavingName(true);
    setNameMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const d = await r.json();
      if (d.success && d.user) {
        updateUser(d.user);
        setNameMsg({ ok: true, text: 'Name updated.' });
      } else {
        setNameMsg({ ok: false, text: d.message || 'Could not save name.' });
      }
    } catch {
      setNameMsg({ ok: false, text: 'Network error. Try again.' });
    } finally {
      setSavingName(false);
    }
  };

  const saveInsightsProfile = async () => {
    setSavingInsights(true);
    setInsightsMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/auth/profile/insights`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ insightsProfile: insights }),
      });
      const d = await r.json();
      if (d.success && d.user) {
        updateUser(d.user);
        setInsightsMsg({ ok: true, text: 'Learning profile saved. Analytics and CAROA recommendations will use this context.' });
      } else {
        setInsightsMsg({ ok: false, text: d.message || 'Could not save profile.' });
      }
    } catch {
      setInsightsMsg({ ok: false, text: 'Network error. Try again.' });
    } finally {
      setSavingInsights(false);
    }
  };

  const fieldLabel = (text: string) => (
    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-1.5">{text}</p>
  );

  const readonlyField = (val: string) => (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-[13.5px] text-zinc-300">{val || '—'}</div>
  );

  const saveBtn = (label: string, loading: boolean, disabled?: boolean, onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-[12.5px] font-semibold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : null}
      {label}
    </button>
  );

  return (
    <div className="space-y-6 w-full">
      {sectionHeading('Settings', 'Manage your account, preferences, and analytics learning context.')}

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* ── Left column ── */}
        <div className="space-y-4">
          {/* Account panel */}
          <div className={`${panelCls} p-5 space-y-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Account</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                {fieldLabel('Email')}
                {readonlyField(user?.email)}
              </div>
              <div>
                {fieldLabel('Display name')}
                <input
                  id="settings-full-name"
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setNameMsg(null); }}
                  placeholder="Your full name"
                  maxLength={120}
                  autoComplete="name"
                />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {saveBtn('Save name', savingName, fullName.trim() === (user?.name || '').trim() || !fullName.trim(), () => void saveDisplayName())}
                  {nameMsg && <span className={`text-[12px] ${nameMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{nameMsg.text}</span>}
                </div>
              </div>
              <div>
                {fieldLabel('Role')}
                <div className="bg-white/[0.025] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-[13.5px] text-zinc-300 capitalize">{user?.role || '—'}</div>
              </div>
            </div>
          </div>

          {/* Learning profile (students) / placeholder (instructors) */}
          {user?.role === 'student' ? (
            <div className={`${panelCls} p-5 space-y-4`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.025] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 size={14} strokeWidth={1.75} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white tracking-tight">Learning profile</p>
                  <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">
                    Optional context used by CAROA and AI analytics. Especially useful when you're new or have sparse quiz data.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'careerOrStudyGoal', label: 'Career or study goal', placeholder: 'e.g. Pass the AWS SAA exam by December; improve calculus for second-year physics.', rows: 2 },
                  { key: 'subjectsOfInterest', label: 'Subjects / topics', placeholder: 'e.g. Machine learning fundamentals, organic chemistry, Spanish conversation.', rows: 2 },
                  { key: 'learningChallenges', label: 'Learning challenges', placeholder: 'e.g. Staying focused with long videos; exam anxiety; limited time on weekdays.', rows: 2 },
                  { key: 'preferredFormats', label: 'Preferred formats', placeholder: 'e.g. Short quizzes, video walkthroughs, written summaries, discussion with peers.', rows: 2 },
                ].map(({ key, label, placeholder, rows }) => (
                  <div key={key}>
                    {fieldLabel(label)}
                    <textarea
                      value={(insights as any)[key]}
                      onChange={(e) => setInsights((s) => ({ ...s, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={rows}
                      className={`${inputCls} resize-y min-h-[68px]`}
                    />
                  </div>
                ))}
                <div>
                  {fieldLabel('Typical weekly study time')}
                  <select
                    value={insights.weeklyStudyHours}
                    onChange={(e) => setInsights((s) => ({ ...s, weeklyStudyHours: e.target.value }))}
                    className={selectCls}
                  >
                    <option value="">Select…</option>
                    <option value="<5">&lt; 5 hours</option>
                    <option value="5-10">5–10 hours</option>
                    <option value="10-15">10–15 hours</option>
                    <option value="15+">15+ hours</option>
                  </select>
                </div>
              </div>

              {insightsMsg && (
                <p className={`text-[12.5px] ${insightsMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{insightsMsg.text}</p>
              )}

              {saveBtn('Save learning profile', savingInsights, false, saveInsightsProfile)}
            </div>
          ) : (
            <div className={`${panelCls} p-5`}>
              <p className="text-[14px] font-semibold text-white mb-1.5">Analytics context</p>
              <p className="text-[13px] text-zinc-500 leading-relaxed">
                The detailed learning-profile form is available for student accounts. As an instructor, your Analytics
                tab summarizes your courses — per-student analytics live under Student insights.
              </p>
            </div>
          )}

          {/* Language & display */}
          <div className={`${panelCls} p-5 space-y-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 flex items-center gap-1.5">
              <Globe size={11} strokeWidth={1.75} /> Language &amp; Display
            </p>
            <div className="flex gap-2">
              {[{ code: 'en', label: 'English' }, { code: 'hi', label: 'Hindi' }, { code: 'es', label: 'Español' }].map(l => (
                <button key={l.code} onClick={() => setLang(l.code as any)}
                  className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors border ${
                    lang === l.code
                      ? 'bg-white/[0.07] border-white/[0.12] text-white'
                      : 'bg-transparent border-white/[0.06] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.1]'
                  }`}
                >{l.label}</button>
              ))}
            </div>
            <SettingToggle label="Compact dashboard cards" desc="Reduce spacing in dashboard lists and course cards." checked={compactMode} onChange={setCompactMode} />
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          <div className={`${panelCls} p-5 space-y-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {user?.role === 'instructor' ? 'Instructor toolkit' : 'Student toolkit'}
            </p>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              {user?.role === 'instructor'
                ? 'Course authoring, assignments, student progress, discussions, analytics, and AI teaching support.'
                : 'Learning progress, AI quizzes, course discussions, certificates, analytics, and AI assistance.'}
            </p>
          </div>

          <div className={`${panelCls} p-5 space-y-2.5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Platform capabilities</p>
            {[
              'AI MCQ generation and attempt history',
              'AI learning assistant',
              'CAROA adaptive recommendations',
              'Subjective answer AI grading',
              'At-risk learner indicators',
              'Course insights and progress analytics',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-[12.5px] text-zinc-400">
                <CheckCircle size={12} strokeWidth={2} className="text-emerald-400 shrink-0" /> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white/[0.025] border border-white/[0.06] rounded-lg px-4 py-3">
      <div>
        <p className="text-[13px] font-medium text-white">{label}</p>
        <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-[22px] rounded-full p-[3px] transition-colors shrink-0 ${checked ? 'bg-indigo-500' : 'bg-white/[0.08]'}`}
        aria-checked={checked}
        role="switch"
      >
        <span className={`block w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${checked ? 'translate-x-[18px]' : ''}`} />
      </button>
    </div>
  );
}

// ─── Shared Utilities ─────────────────────────────────────────────────────────
function MetricCard({
  icon,
  label,
  value,
  sublabel,
  // accepted for backward-compat but no longer used
  color: _color,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="group relative bg-neutral-900/60 border border-white/[0.06] rounded-xl p-5 transition-colors hover:border-white/[0.12]">
      <div className="flex items-start justify-between mb-6">
        <div className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.025] flex items-center justify-center text-zinc-300">
          {icon}
        </div>
      </div>
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-[26px] leading-none font-semibold tracking-tight text-white tabular-nums">{value}</p>
        {sublabel ? <p className="text-[11.5px] text-zinc-500 tabular-nums">{sublabel}</p> : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-zinc-400 block mb-1.5">{label}</label>{children}</div>;
}

function EmptyState({ icon, title, desc, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/[0.07] rounded-2xl bg-white/[0.012]">
      <div className="text-zinc-600 mb-4">{icon}</div>
      <h3 className="text-[15px] font-semibold tracking-tight text-zinc-200 mb-1.5">{title}</h3>
      <p className="text-[13px] text-zinc-500 max-w-sm leading-relaxed mb-5">{desc}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-[12.5px] font-semibold hover:bg-zinc-200 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={26} className="animate-spin text-zinc-500" strokeWidth={1.75} />
    </div>
  );
}
