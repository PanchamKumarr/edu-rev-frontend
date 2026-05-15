import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2, School, Sparkles, BookOpen, Brain, ClipboardList, CheckCircle, XCircle, Mic2, Users, Search,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { API_BASE, getAuthHeaders } from '../../lib/api';

const card = 'bg-zinc-900 border border-white/10 rounded-2xl p-4 sm:p-5';
const selectCls =
  'w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-white [color-scheme:dark]';

interface CourseMeta {
  id: string;
  title: string;
  enrollmentCount: number;
}

interface RosterStudent {
  studentId: string;
  name: string;
  email: string;
  enrollments: Array<{ courseId: string; courseTitle: string; progress: number; enrolledAt?: string }>;
  stats: {
    courseCount: number;
    avgProgress: number;
    lessonQuizAttempts: number;
    lessonQuizAvgPercent: number | null;
    aiPracticeAttempts: number;
    aiPracticeAvgPercent: number | null;
    assignmentSubmissions: number;
    assignmentPassed: number;
    interviewsCompleted: number;
  };
}

interface InsightPayload {
  course: { id: string; title: string };
  student: { id: string; name: string; email: string };
  enrollment: {
    progress: number;
    completedModules: string[];
    enrolledAt?: string;
    lastAccessed?: string;
    status: string;
  };
  courseQuizAttempts: Array<{
    id: string;
    lessonId: string;
    lessonTitle: string;
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    createdAt: string;
  }>;
  aiMcqAttemptsOutsideCourse: Array<{
    id: string;
    topic: string;
    difficulty: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    analysis: string;
    createdAt: string;
  }>;
  assignmentSubmissions: Array<{
    id: string;
    assignmentTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    status: string;
    submittedAt?: string;
    feedback: string;
  }>;
  interviewSessions: Array<{
    id: string;
    topic: string;
    status: string;
    userTurnCount: number;
    overallScore: number | null;
    communicationScore: number | null;
    technicalScore: number | null;
    summary: string;
    strengths: string[];
    improvements: string[];
    completedAt?: string | null;
    createdAt?: string;
  }>;
}

export function InstructorStudentInsightsSection() {
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [filterCourseId, setFilterCourseId] = useState('');
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [detailCourseId, setDetailCourseId] = useState('');
  const [insight, setInsight] = useState<InsightPayload | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [aiMd, setAiMd] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    setLoadingRoster(true);
    fetch(`${API_BASE}/api/instructor/insights/students`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setRoster(d.students || []);
          setCourses(d.courses || []);
        } else {
          setRoster([]);
          setCourses([]);
        }
      })
      .catch(() => {
        setRoster([]);
        setCourses([]);
      })
      .finally(() => setLoadingRoster(false));
  }, []);

  const filteredRoster = useMemo(() => {
    let rows = roster;
    if (filterCourseId) {
      rows = rows.filter((r) => r.enrollments.some((e) => e.courseId === filterCourseId));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.email || '').toLowerCase().includes(q) ||
          r.enrollments.some((e) => e.courseTitle.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [roster, filterCourseId, search]);

  useEffect(() => {
    if (!studentId || !detailCourseId) {
      setInsight(null);
      setLoadingInsight(false);
      return;
    }
    let cancelled = false;
    setLoadingInsight(true);
    setAiMd(null);
    setAiError('');
    fetch(`${API_BASE}/api/instructor/insights/courses/${detailCourseId}/students/${studentId}`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.success) setInsight(d);
        else setInsight(null);
      })
      .catch(() => {
        if (!cancelled) setInsight(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingInsight(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, detailCourseId]);

  const openStudent = (row: RosterStudent) => {
    setStudentId(row.studentId);
    const first = row.enrollments[0];
    setDetailCourseId(first?.courseId || '');
    setAiMd(null);
    setAiError('');
  };

  const clearSelection = () => {
    setStudentId('');
    setDetailCourseId('');
    setInsight(null);
    setAiMd(null);
    setAiError('');
  };

  const runAiSummary = async () => {
    if (!detailCourseId || !studentId) return;
    setAiLoading(true);
    setAiError('');
    setAiMd(null);
    try {
      const r = await fetch(
        `${API_BASE}/api/instructor/insights/courses/${detailCourseId}/students/${studentId}/ai-summary`,
        { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({}) }
      );
      const d = await r.json();
      if (d.success && d.markdown) setAiMd(d.markdown);
      else setAiError(d.message || 'Could not generate summary');
    } catch {
      setAiError('Network error');
    } finally {
      setAiLoading(false);
    }
  };

  const selectedRow = roster.find(r => r.studentId === studentId);

  if (loadingRoster) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <School className="text-indigo-400" size={26} />
          Student insights
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Everyone enrolled in your courses appears below with overall activity: average lesson progress, lesson MCQs, AI practice
          quizzes, assignment submissions, and completed mock interviews. Filter by course or search, then open a learner for
          per-course detail and an AI coaching brief.
        </p>
      </div>

      <div className={`${card} flex flex-col lg:flex-row gap-4 lg:items-end`}>
        <div className="flex-1 min-w-0">
          <label className="text-xs text-zinc-400 block mb-1.5">Filter by course</label>
          <select className={selectCls} value={filterCourseId} onChange={e => setFilterCourseId(e.target.value)}>
            <option value="">All courses ({courses.length})</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.enrollmentCount} enrolled)
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-xs text-zinc-400 block mb-1.5">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name, email, or course title…"
              className={`${selectCls} pl-9`}
            />
          </div>
        </div>
      </div>

      <div className={`${card} overflow-hidden p-0`}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 bg-black/30">
          <h3 className="font-bold flex items-center gap-2 text-sm sm:text-base">
            <Users size={18} className="text-indigo-400 shrink-0" />
            All students
            <span className="text-zinc-500 font-normal text-xs sm:text-sm">({filteredRoster.length})</span>
          </h3>
        </div>
        {filteredRoster.length === 0 ? (
          <p className="text-sm text-zinc-500 p-6 text-center">
            {roster.length === 0 ? 'No enrollments yet across your courses.' : 'No students match this filter.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-white/10 bg-white/[0.03]">
                  <th className="py-3 pl-4 pr-2 font-semibold">Student</th>
                  <th className="py-3 px-2 font-semibold">Courses</th>
                  <th className="py-3 px-2 font-semibold">Avg progress</th>
                  <th className="py-3 px-2 font-semibold">Lesson MCQ</th>
                  <th className="py-3 px-2 font-semibold">AI practice</th>
                  <th className="py-3 px-2 font-semibold">Assignments</th>
                  <th className="py-3 px-2 font-semibold">Interviews</th>
                  <th className="py-3 pr-4 pl-2 font-semibold w-[100px]">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map(row => (
                  <tr
                    key={row.studentId}
                    className={`border-b border-white/5 hover:bg-white/[0.04] ${
                      studentId === row.studentId ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-4 pr-2">
                      <p className="font-medium text-zinc-100">{row.name}</p>
                      <p className="text-xs text-zinc-500 truncate max-w-[200px]" title={row.email}>
                        {row.email || '—'}
                      </p>
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400">{row.stats.courseCount}</td>
                    <td className="py-2.5 px-2">
                      <span className="font-mono text-zinc-200">{row.stats.avgProgress}%</span>
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400">
                      {row.stats.lessonQuizAttempts}
                      {row.stats.lessonQuizAvgPercent != null ? (
                        <span className="text-zinc-600"> · avg {row.stats.lessonQuizAvgPercent}%</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400">
                      {row.stats.aiPracticeAttempts}
                      {row.stats.aiPracticeAvgPercent != null ? (
                        <span className="text-zinc-600"> · avg {row.stats.aiPracticeAvgPercent}%</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400">
                      {row.stats.assignmentSubmissions
                        ? `${row.stats.assignmentPassed}/${row.stats.assignmentSubmissions} passed`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400">{row.stats.interviewsCompleted}</td>
                    <td className="py-2.5 pr-4 pl-2">
                      <button
                        type="button"
                        onClick={() => openStudent(row)}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {studentId && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className={`${card} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Learner detail</p>
              <p className="text-lg font-bold truncate">{selectedRow?.name || 'Student'}</p>
              <p className="text-sm text-zinc-400 truncate">{selectedRow?.email || '—'}</p>
              <div className="mt-3 max-w-md">
                <label className="text-xs text-zinc-500 block mb-1">Course for detailed metrics</label>
                <select
                  className={selectCls}
                  value={detailCourseId}
                  onChange={e => setDetailCourseId(e.target.value)}
                  disabled={!selectedRow?.enrollments.length}
                >
                  {selectedRow?.enrollments.map(e => (
                    <option key={e.courseId} value={e.courseId}>
                      {e.courseTitle} · {e.progress}%
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={runAiSummary}
                disabled={aiLoading || !detailCourseId}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold"
              >
                {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                AI coaching summary
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-zinc-200"
              >
                Close
              </button>
            </div>
          </div>

          {aiError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">{aiError}</div>}

          <AnimatePresence>
            {aiMd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                className={`${card} text-sm max-w-none text-zinc-300 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-zinc-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_strong]:text-white`}
              >
                <h3 className="mt-0 text-base font-bold text-white flex items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-violet-400" /> AI summary & suggestions
                  <span className="text-xs font-normal text-zinc-500">({insight?.course.title})</span>
                </h3>
                <ReactMarkdown>{aiMd}</ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingInsight && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          )}

          {!loadingInsight && insight && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className={`${card}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-cyan-400" />
                  Progress in {insight.course.title}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, insight.enrollment.progress)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{insight.enrollment.progress}%</span>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {insight.enrollment.completedModules?.length ?? 0} completion markers · Status: {insight.enrollment.status}
                </p>
              </div>

              <div className={`${card}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <ClipboardList size={18} className="text-emerald-400" />
                  Lesson MCQs (this course)
                </h3>
                {insight.courseQuizAttempts.length === 0 ? (
                  <p className="text-sm text-zinc-500">No lesson quiz attempts recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-zinc-500 border-b border-white/10">
                          <th className="pb-2 pr-3">Lesson</th>
                          <th className="pb-2 pr-3">Score</th>
                          <th className="pb-2 pr-3">%</th>
                          <th className="pb-2 pr-3">Pass</th>
                          <th className="pb-2">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insight.courseQuizAttempts.map(a => (
                          <tr key={a.id} className="border-b border-white/5">
                            <td className="py-2 pr-3 text-zinc-300">{a.lessonTitle || a.lessonId}</td>
                            <td className="py-2 pr-3">
                              {a.score}/{a.total}
                            </td>
                            <td className="py-2 pr-3">{a.percentage}%</td>
                            <td className="py-2 pr-3">
                              {a.passed ? (
                                <CheckCircle size={14} className="text-green-400 inline" />
                              ) : (
                                <XCircle size={14} className="text-red-400/80 inline" />
                              )}
                            </td>
                            <td className="py-2 text-zinc-500 text-xs whitespace-nowrap">
                              {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className={`${card}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Brain size={18} className="text-purple-400" />
                  AI MCQ practice (dashboard)
                </h3>
                <p className="text-xs text-zinc-500 mb-3">
                  Practice quizzes from the MCQ generator — same for all courses view; listed here for this coaching context.
                </p>
                {insight.aiMcqAttemptsOutsideCourse.length === 0 ? (
                  <p className="text-sm text-zinc-500">No AI practice attempts yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-zinc-500 border-b border-white/10">
                          <th className="pb-2 pr-3">Topic</th>
                          <th className="pb-2 pr-3">Score</th>
                          <th className="pb-2 pr-3">%</th>
                          <th className="pb-2">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insight.aiMcqAttemptsOutsideCourse.map(a => (
                          <tr key={a.id} className="border-b border-white/5">
                            <td className="py-2 pr-3 text-zinc-300 max-w-[200px] truncate" title={a.topic}>
                              {a.topic}
                            </td>
                            <td className="py-2 pr-3">
                              {a.score}/{a.totalQuestions}
                            </td>
                            <td className="py-2 pr-3">{a.percentage}%</td>
                            <td className="py-2 text-zinc-500 text-xs whitespace-nowrap">
                              {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className={`${card}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Mic2 size={18} className="text-rose-400" />
                  AI interview practice
                </h3>
                {!insight.interviewSessions?.length ? (
                  <p className="text-sm text-zinc-500">No interview sessions recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(insight.interviewSessions ?? []).map(iv => (
                      <div key={iv.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="font-medium text-zinc-200">{iv.topic}</p>
                          <span className="text-xs text-zinc-500 capitalize">{iv.status}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          Student replies: {iv.userTurnCount}
                          {iv.status === 'completed' && (
                            <span className="ml-2">
                              · Scores: overall {iv.overallScore ?? '—'}/10 · comm {iv.communicationScore ?? '—'}/10 · tech{' '}
                              {iv.technicalScore ?? '—'}/10
                            </span>
                          )}
                        </p>
                        {iv.summary ? <p className="text-sm text-zinc-400 mt-2 line-clamp-4">{iv.summary}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`${card}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <ClipboardList size={18} className="text-amber-400" />
                  Assignments ({insight.course.title})
                </h3>
                {insight.assignmentSubmissions.length === 0 ? (
                  <p className="text-sm text-zinc-500">No assignment submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {insight.assignmentSubmissions.map(s => (
                      <div key={s.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="font-medium text-zinc-200">{s.assignmentTitle}</p>
                          <span className="text-xs text-zinc-400 capitalize">{s.status}</span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">
                          Score {s.score}/{s.maxScore} ({s.percentage}%) {s.passed ? '· Passed' : ''}
                        </p>
                        {s.feedback ? <p className="text-xs text-zinc-500 mt-2 line-clamp-3">{s.feedback}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {!loadingInsight && studentId && detailCourseId && !insight && (
            <p className="text-sm text-zinc-500 text-center py-8">Could not load this student for the selected course.</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
