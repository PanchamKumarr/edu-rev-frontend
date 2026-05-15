import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, Users, BookOpen, Award, Brain, AlertTriangle,
  Target, Zap, Loader2, RefreshCw, CheckCircle, Star, Sparkles,
  MessageSquare, Mic2, ClipboardList,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { API_BASE, getAuthHeaders } from '../../lib/api';

interface InsightsProfile {
  careerOrStudyGoal?: string;
  weeklyStudyHours?: string;
  subjectsOfInterest?: string;
  learningChallenges?: string;
  preferredFormats?: string;
}

interface StudentAnalytics {
  totalEnrollments: number;
  avgProgress: number;
  avgScore: number;
  passRate: number;
  submissionsCount: number;
  certificatesEarned: number;
  scoreTrend: Array<{ score: number; date: string }>;
  activityCounts: Record<string, number>;
  masteryLevels: Array<{ topicId: string; topicLabel?: string; level: number }>;
  weakAreas: Array<{ topicId: string; topicLabel?: string; level: number }>;
  isAtRisk: boolean;
  aiQuizAttempts?: Array<{
    id: string;
    topic: string;
    score: number;
    percentage: number;
    totalQuestions: number;
    createdAt: string;
    blurCount?: number;
    mode?: string;
  }>;
  aiPracticeAvg?: number | null;
  blendedMcqScore?: number | null;
  insightsProfile?: InsightsProfile | null;
  courseProgress?: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    status: string;
  }>;
  courseQuizAttemptsCount?: number;
  courseQuizAvg?: number | null;
  recentCourseQuizAttempts?: Array<{
    courseId: string;
    lessonTitle: string;
    percentage: number;
    passed: boolean;
    createdAt: string;
  }>;
  discussionThreads?: number;
  interviewsCompleted?: number;
  recentSubmissions?: Array<{
    percentage: number;
    passed: boolean;
    submittedAt: string;
  }>;
}

interface Recommendation {
  courseId: string;
  title: string;
  category: string;
  difficulty: string;
  reason: string;
  priority: number;
  matchScore: number;
}

interface AiLearningSummary {
  headline: string;
  summary: string;
  strengths: string[];
  focusAreas: string[];
  thisWeek: string[];
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltipStyle = {
  backgroundColor: '#18181b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: 12,
  padding: '8px 12px',
};

export function AnalyticsEnhanced({ role }: { role: string }) {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiLearningSummary | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryErr, setAiSummaryErr] = useState<string | null>(null);

  const loadAnalytics = () => {
    setLoading(true);
    if (role === 'instructor') {
      fetch(`${API_BASE}/api/courses/my`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(async d => {
          if (!d.success) return;
          const courses = d.courses || [];
          const courseAnalytics = await Promise.all(
            courses.map((c: any) =>
              fetch(`${API_BASE}/api/analytics/course/${c.id}`, { headers: getAuthHeaders() })
                .then(r => r.json())
                .then(a => a.success ? { course: c, analytics: a.analytics } : null)
                .catch(() => null)
            )
          );
          const valid = courseAnalytics.filter(Boolean) as any[];
          const totalEnrollments = valid.reduce((s, item) => s + (item.analytics.totalEnrollments || 0), 0);
          const totalSubmissions = valid.reduce((s, item) => s + (item.analytics.totalSubmissions || 0), 0);
          const totalDiscussions = valid.reduce((s, item) => s + (item.analytics.totalDiscussions || 0), 0);
          const atRiskStudents = valid.reduce((s, item) => s + (item.analytics.atRiskStudents || 0), 0);
          const avgProgress = valid.length ? Math.round(valid.reduce((s, item) => s + (item.analytics.avgProgress || 0), 0) / valid.length) : 0;
          const avgScore = valid.length ? Math.round(valid.reduce((s, item) => s + (item.analytics.avgScore || 0), 0) / valid.length) : 0;
          const passRate = totalEnrollments ? Math.round(((totalEnrollments - atRiskStudents) / totalEnrollments) * 100) : 0;

          setAnalytics({
            totalEnrollments,
            avgProgress,
            avgScore,
            passRate,
            submissionsCount: totalSubmissions,
            certificatesEarned: totalDiscussions,
            scoreTrend: valid.map((item, i) => ({ score: item.analytics.avgScore || 0, date: item.course.title || `Course ${i + 1}` })),
            activityCounts: {
              Courses: courses.length,
              Enrollments: totalEnrollments,
              Submissions: totalSubmissions,
              Discussions: totalDiscussions,
              'At Risk': atRiskStudents,
            },
            masteryLevels: valid.map(item => ({ topicId: item.course.title, level: (item.analytics.avgProgress || 0) / 100 })),
            weakAreas: valid.filter(item => (item.analytics.avgProgress || 0) < 40).map(item => ({ topicId: item.course.title, level: (item.analytics.avgProgress || 0) / 100 })),
            isAtRisk: atRiskStudents > 0,
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    fetch(`${API_BASE}/api/analytics/me`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAnalytics(d.analytics);
          setAiSummary(null);
          setAiSummaryErr(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadRecommendations = () => {
    setLoadingRecs(true);
    fetch(`${API_BASE}/api/analytics/recommendations`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setRecommendations(d.recommendations); })
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  };

  const loadAiSummary = () => {
    if (role !== 'student') return;
    setAiSummaryLoading(true);
    setAiSummaryErr(null);
    fetch(`${API_BASE}/api/analytics/me/summary`, { method: 'POST', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.summary) setAiSummary(d.summary);
        else setAiSummaryErr(d.message || 'Could not generate summary.');
      })
      .catch(() => setAiSummaryErr('Network error.'))
      .finally(() => setAiSummaryLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
    if (role === 'student') loadRecommendations();
  }, [role]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={40} className="animate-spin text-indigo-500" />
    </div>
  );

  const scoreTrendData = (analytics?.scoreTrend || []).map((s, i) => ({
    name: `#${i + 1}`,
    score: s.score,
    date: s.date,
  }));

  const masteryData = (analytics?.masteryLevels || []).slice(0, 6).map(m => {
    const label = (m.topicLabel || m.topicId || 'Topic').trim();
    return {
      subject: label.length > 18 ? `${label.slice(0, 18)}…` : label,
      mastery: Math.round(m.level * 100),
      fullMark: 100,
    };
  });

  const activityData = Object.entries(analytics?.activityCounts || {}).map(([key, val]) => ({
    name: key,
    count: val,
  }));

  const aiMcqTrendData =
    role === 'student' && analytics?.aiQuizAttempts?.length
      ? [...analytics.aiQuizAttempts]
          .reverse()
          .slice(-10)
          .map((a, i) => ({
            name: `#${i + 1}`,
            score: typeof a.percentage === 'number' ? a.percentage : 0,
          }))
      : [];

  const progressDonutData = analytics
    ? [
        { name: 'Completed', value: analytics.certificatesEarned },
        { name: 'In Progress', value: Math.max(0, analytics.totalEnrollments - analytics.certificatesEarned) },
      ]
    : [];

  const metricsRow = analytics
    ? role === 'instructor' ? [
        { icon: BookOpen, label: 'Students Enrolled', value: analytics.totalEnrollments, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { icon: TrendingUp, label: 'Avg Progress', value: `${analytics.avgProgress}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
        { icon: Target, label: 'Avg Score', value: `${analytics.avgScore}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { icon: CheckCircle, label: 'Engagement', value: `${analytics.passRate}%`, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { icon: Zap, label: 'Submissions', value: analytics.submissionsCount, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { icon: Users, label: 'Discussions', value: analytics.certificatesEarned, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      ] : [
        { icon: BookOpen, label: 'Courses', value: analytics.totalEnrollments, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { icon: TrendingUp, label: 'Avg Progress', value: `${analytics.avgProgress}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
        { icon: Target, label: 'Avg Score', value: `${analytics.avgScore}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { icon: CheckCircle, label: 'Pass Rate', value: `${analytics.passRate}%`, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { icon: Zap, label: 'Submissions', value: analytics.submissionsCount, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { icon: Award, label: 'Certificates', value: analytics.certificatesEarned, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { icon: MessageSquare, label: 'Discussions', value: analytics.discussionThreads ?? 0, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { icon: Mic2, label: 'Interviews', value: analytics.interviewsCompleted ?? 0, color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { icon: ClipboardList, label: 'Lesson MCQs', value: analytics.courseQuizAttemptsCount ?? 0, color: 'text-orange-400', bg: 'bg-orange-500/10' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {role === 'instructor' ? 'Track course enrollments, progress, submissions, discussions, and at-risk learners.' : 'Track your learning performance and growth.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role === 'student' && (
            <button
              type="button"
              onClick={loadAiSummary}
              disabled={aiSummaryLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              {aiSummaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              AI learning summary
            </button>
          )}
          <button type="button" onClick={loadAnalytics} className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-2 hover:bg-white/10 rounded-xl transition-all text-sm border border-white/10">
            <RefreshCw size={14} /> Refresh data
          </button>
        </div>
      </div>

      {analytics && (
        <>
          {/* At-Risk Warning */}
          {analytics.isAtRisk && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center gap-4"
            >
              <AlertTriangle size={24} className="text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-400">Learning Alert</h3>
                <p className="text-sm text-red-300/70">Your progress seems slow. Try to engage with course content regularly to improve performance.</p>
              </div>
            </motion.div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
            {metricsRow.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`${m.bg} border border-white/10 rounded-2xl p-4 text-center hover:border-white/20 transition-all`}
              >
                <m.icon size={20} className={`${m.color} mx-auto mb-2`} />
                <p className="text-xl font-bold">{m.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{m.label}</p>
              </motion.div>
            ))}
          </div>

          {role === 'student' && aiSummaryErr && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{aiSummaryErr}</div>
          )}

          {role === 'student' && aiSummary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-zinc-900 p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="text-indigo-400 flex-shrink-0 mt-0.5" size={22} />
                <div>
                  <h3 className="font-bold text-lg text-white">{aiSummary.headline}</h3>
                  <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{aiSummary.summary}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 pt-2 border-t border-white/10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mb-2">Strengths</p>
                  <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4">
                    {(aiSummary.strengths || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                    {(!aiSummary.strengths || aiSummary.strengths.length === 0) && (
                      <li className="text-zinc-500 list-none pl-0">—</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-2">Focus areas</p>
                  <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4">
                    {(aiSummary.focusAreas || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                    {(!aiSummary.focusAreas || aiSummary.focusAreas.length === 0) && (
                      <li className="text-zinc-500 list-none pl-0">—</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/90 mb-2">This week</p>
                  <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4">
                    {(aiSummary.thisWeek || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {role === 'student' && (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold mb-1">Learning profile context</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  Saved from Settings. Used for CAROA recommendations and your AI learning summary.
                </p>
                {analytics.insightsProfile &&
                Object.values(analytics.insightsProfile).some((v) => typeof v === 'string' && v.trim()) ? (
                  <dl className="space-y-2 text-sm">
                    {analytics.insightsProfile.careerOrStudyGoal ? (
                      <div>
                        <dt className="text-[10px] uppercase text-zinc-500 font-bold">Goal</dt>
                        <dd className="text-zinc-200">{analytics.insightsProfile.careerOrStudyGoal}</dd>
                      </div>
                    ) : null}
                    {analytics.insightsProfile.weeklyStudyHours ? (
                      <div>
                        <dt className="text-[10px] uppercase text-zinc-500 font-bold">Weekly time</dt>
                        <dd className="text-zinc-200">{analytics.insightsProfile.weeklyStudyHours}</dd>
                      </div>
                    ) : null}
                    {analytics.insightsProfile.subjectsOfInterest ? (
                      <div>
                        <dt className="text-[10px] uppercase text-zinc-500 font-bold">Interests</dt>
                        <dd className="text-zinc-200">{analytics.insightsProfile.subjectsOfInterest}</dd>
                      </div>
                    ) : null}
                    {analytics.insightsProfile.learningChallenges ? (
                      <div>
                        <dt className="text-[10px] uppercase text-zinc-500 font-bold">Challenges</dt>
                        <dd className="text-zinc-200">{analytics.insightsProfile.learningChallenges}</dd>
                      </div>
                    ) : null}
                    {analytics.insightsProfile.preferredFormats ? (
                      <div>
                        <dt className="text-[10px] uppercase text-zinc-500 font-bold">Preferred formats</dt>
                        <dd className="text-zinc-200">{analytics.insightsProfile.preferredFormats}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : (
                  <p className="text-sm text-zinc-500">
                    You have not added a learning profile yet. Open <span className="text-zinc-300 font-medium">Settings</span>{' '}
                    and complete &quot;Learning profile for Analytics &amp; Insights&quot; for richer coaching.
                  </p>
                )}
              </div>

              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 overflow-x-auto">
                <h3 className="font-bold mb-1">Course progress</h3>
                <p className="text-xs text-zinc-500 mb-3">Enrollment status across your courses.</p>
                {(analytics.courseProgress || []).length === 0 ? (
                  <p className="text-sm text-zinc-500">No enrollments yet. Browse courses to get started.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500 border-b border-white/10">
                        <th className="pb-2 pr-2 font-medium">Course</th>
                        <th className="pb-2 pr-2 font-medium">Progress</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics.courseProgress || []).map((row) => (
                        <tr key={row.courseId} className="border-b border-white/5">
                          <td className="py-2 pr-2 text-zinc-200 max-w-[200px] truncate" title={row.courseTitle}>
                            {row.courseTitle}
                          </td>
                          <td className="py-2 pr-2 text-indigo-300 font-semibold">{row.progress}%</td>
                          <td className="py-2 capitalize text-zinc-400">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {role === 'student' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold mb-1">Recent lesson MCQs</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  In-lesson quizzes (avg {analytics.courseQuizAvg != null ? `${analytics.courseQuizAvg}%` : '—'} across{' '}
                  {analytics.courseQuizAttemptsCount ?? 0} attempts).
                </p>
                {(analytics.recentCourseQuizAttempts || []).length === 0 ? (
                  <p className="text-sm text-zinc-500">No lesson quiz attempts recorded yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {(analytics.recentCourseQuizAttempts || []).map((a, i) => (
                      <li key={i} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                        <span className="text-zinc-300 truncate">{a.lessonTitle}</span>
                        <span className={a.passed ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                          {a.percentage}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold mb-1">Recent assignment submissions</h3>
                <p className="text-xs text-zinc-500 mb-3">Latest graded attempts (newest first in data).</p>
                {(analytics.recentSubmissions || []).length === 0 ? (
                  <p className="text-sm text-zinc-500">No submissions yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {[...(analytics.recentSubmissions || [])].reverse().map((s, i) => (
                      <li key={i} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                        <span className="text-zinc-400">
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </span>
                        <span className={s.passed ? 'text-emerald-400 font-semibold' : 'text-zinc-200 font-semibold'}>
                          {s.percentage}%{s.passed ? ' · passed' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Course MCQ vs AI practice (students) */}
          {role === 'student' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-violet-500/25 rounded-2xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Brain size={20} className="text-violet-400" />
                    Course quizzes &amp; AI practice
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
                    Assignment scores reflect your course MCQs. Timed AI MCQ sessions (single question, fullscreen) are
                    stored separately. <span className="text-zinc-400">Blended MCQ score</span> combines both when you
                    have data from each (55% course / 45% AI in this dashboard).
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Course assignments</p>
                  <p className="text-2xl font-black mt-1 text-indigo-300">{analytics.submissionsCount > 0 ? `${analytics.avgScore}%` : '—'}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Avg % across submissions</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">AI MCQ practice</p>
                  <p className="text-2xl font-black mt-1 text-violet-300">
                    {analytics.aiPracticeAvg != null ? `${analytics.aiPracticeAvg}%` : '—'}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">Avg % last saved AI runs</p>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300/80">Blended MCQ</p>
                  <p className="text-2xl font-black mt-1 text-white">
                    {analytics.blendedMcqScore != null ? `${analytics.blendedMcqScore}%` : '—'}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">Used for overall performance signal</p>
                </div>
              </div>
              {aiMcqTrendData.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-zinc-400 mb-2">Recent AI practice scores (oldest → newest in chart)</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={aiMcqTrendData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={CustomTooltipStyle}
                        formatter={(v: number) => [`${v}%`, 'AI run score']}
                      />
                      <Bar dataKey="score" name="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}

          {/* Charts Row 1 */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Score Trend — Area Chart */}
            {scoreTrendData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="md:col-span-2 bg-zinc-900 border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold">Score Trend</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Performance across submissions</p>
                  </div>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-lg">Last {scoreTrendData.length}</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={scoreTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CustomTooltipStyle} formatter={(v: any) => [`${v}%`, 'Score']} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Progress Donut */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex flex-col"
            >
              <div className="mb-3">
                <h3 className="font-bold">Completion Rate</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Course progress overview</p>
              </div>
              {progressDonutData[0]?.value > 0 || progressDonutData[1]?.value > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={progressDonutData} cx="50%" cy="50%" innerRadius={42} outerRadius={58} dataKey="value" strokeWidth={0}>
                        {progressDonutData.map((_, index) => (
                          <Cell key={index} fill={index === 0 ? '#6366f1' : '#3f3f46'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CustomTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" />Certified</span>
                      <span className="font-medium">{analytics.certificatesEarned}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-600" />In Progress</span>
                      <span className="font-medium">{Math.max(0, analytics.totalEnrollments - analytics.certificatesEarned)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-zinc-600 text-center">Enroll in courses to see data</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Mastery Radar */}
            {masteryData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-5"
              >
                <div className="mb-3">
                  <h3 className="font-bold">Knowledge Mastery</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">CAROA topic mastery levels</p>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={masteryData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip contentStyle={CustomTooltipStyle} formatter={(v: any) => [`${v}%`, 'Mastery']} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Activity Bar Chart */}
            {activityData.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-5"
              >
                <div className="mb-3">
                  <h3 className="font-bold">Activity Breakdown</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Actions performed on platform</p>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CustomTooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {activityData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              /* Mastery Progress Bars fallback */
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-5"
              >
                <div className="mb-4">
                  <h3 className="font-bold">Topic Mastery Detail</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Per-topic progress breakdown</p>
                </div>
                <div className="space-y-3">
                  {(analytics.masteryLevels || []).slice(0, 6).map((m, i) => {
                    const label = (m.topicLabel || m.topicId || 'Topic').trim();
                    return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400 truncate max-w-[70%]" title={label}>{label}</span>
                        <span className={`font-medium ${m.level >= 0.7 ? 'text-green-400' : m.level >= 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {Math.round(m.level * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.level * 100}%` }}
                          transition={{ delay: i * 0.05, duration: 0.6 }}
                          className={`h-full rounded-full ${m.level >= 0.7 ? 'bg-green-500' : m.level >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        />
                      </div>
                    </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Weak Areas */}
          {analytics.weakAreas.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5"
            >
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" /> Areas Needing Improvement
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {analytics.weakAreas.map((w, i) => {
                  const label = (w.topicLabel || w.topicId || 'Topic').trim();
                  return (
                  <div key={i} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                    <p className="text-xs text-yellow-300 font-medium line-clamp-2" title={label}>{label}</p>
                    <div className="w-full h-1.5 bg-yellow-900/40 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.round(w.level * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-yellow-500/70 mt-1">{Math.round(w.level * 100)}% mastery</p>
                  </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* CAROA Recommendations */}
      {role === 'student' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Brain size={20} className="text-indigo-400" /> CAROA Personalized Recommendations
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">AI-powered course suggestions based on your learning profile</p>
            </div>
            <button onClick={loadRecommendations} disabled={loadingRecs}
              className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-2 hover:bg-white/10 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              {loadingRecs ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>

          {loadingRecs ? (
            <div className="flex items-center gap-3 text-zinc-400 py-6 bg-zinc-900 border border-white/10 rounded-2xl px-6">
              <Loader2 size={18} className="animate-spin text-indigo-400" />
              <span className="text-sm">CAROA is analyzing your learning profile...</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center">
              <Brain size={32} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">No new recommendations at this time. Keep learning!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <motion.div key={rec.courseId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-zinc-900 border border-indigo-500/20 rounded-2xl p-5 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rec.priority <= 2 ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {rec.priority <= 2 ? '⭐ Top Pick' : '💡 Recommended'}
                    </span>
                    <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">{Math.round((rec.matchScore || 0.7) * 100)}% match</span>
                  </div>
                  <h4 className="font-bold mb-1 line-clamp-2">{rec.title}</h4>
                  <p className="text-xs text-zinc-500 mb-2">{rec.category} • <span className="capitalize">{rec.difficulty}</span></p>
                  <p className="text-xs text-indigo-300/70 italic leading-relaxed">{rec.reason}</p>
                  {/* Mini match score bar */}
                  <div className="mt-3">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.round((rec.matchScore || 0.7) * 100)}%` }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructor-specific note */}
      {role === 'instructor' && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
          <p className="text-sm text-indigo-300 flex items-center gap-2">
            <Star size={16} className="text-indigo-400 flex-shrink-0" />
            Analytics showing your personal learning profile. Course-level analytics for your students are available in My Courses → View Analytics.
          </p>
        </div>
      )}
    </div>
  );
}
