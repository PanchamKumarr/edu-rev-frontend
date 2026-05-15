import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Plus,
  Heart,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
  Send,
  Trash2,
  BookOpen,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';
import { useConfirm } from '../ConfirmProvider';

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-white placeholder-zinc-500';

interface Discussion {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userRole: string;
  title: string;
  content: string;
  replies: Reply[];
  likes: number;
  likedBy: string[];
  createdAt: string;
}

interface Reply {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

function uidEq(a: unknown, b: unknown) {
  return String(a ?? '') === String(b ?? '');
}

export function DiscussionsSection({ user, selectedCourseId }: { user: any; selectedCourseId?: string }) {
  const { confirm } = useConfirm();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [fallbackTitle, setFallbackTitle] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<Record<string, unknown> | null>(null);
  const [summaryErr, setSummaryErr] = useState('');

  const loadCourseDiscussionSummary = async () => {
    if (!selectedCourse) return;
    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryErr('');
    setSummaryData(null);
    try {
      const r = await fetch(`${API_BASE}/api/discussions/${selectedCourse}/summary`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (d.success && d.summary) setSummaryData(d.summary);
      else setSummaryErr(d.message || 'Could not generate summary.');
    } catch {
      setSummaryErr('Network error.');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    setCoursesLoading(true);
    const url =
      user?.role === 'instructor' ? `${API_BASE}/api/courses/my` : `${API_BASE}/api/enrollments`;
    fetch(url, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const courses =
          user?.role === 'instructor'
            ? d.courses.map((c: any) => ({ courseId: c.id, course: c }))
            : d.enrollments;
        setEnrollments(courses);
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, [user?.role]);

  useEffect(() => {
    if (enrollments.length === 0) {
      if (selectedCourseId) setSelectedCourse(selectedCourseId);
      return;
    }
    if (selectedCourseId && enrollments.some((e: any) => e.courseId === selectedCourseId)) {
      setSelectedCourse(selectedCourseId);
      return;
    }
    setSelectedCourse((prev) => {
      if (prev && enrollments.some((e: any) => e.courseId === prev)) return prev;
      return enrollments[0].courseId;
    });
  }, [enrollments, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourse) {
      setFallbackTitle('');
      return;
    }
    if (enrollments.some((e: any) => e.courseId === selectedCourse)) {
      setFallbackTitle('');
      return;
    }
    fetch(`${API_BASE}/api/courses/${selectedCourse}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.course?.title) setFallbackTitle(d.course.title);
        else setFallbackTitle('Course');
      })
      .catch(() => setFallbackTitle('Course'));
  }, [selectedCourse, enrollments]);

  const activeCourseTitle = useMemo(() => {
    const row = enrollments.find((e: any) => e.courseId === selectedCourse);
    if (row?.course?.title) return row.course.title as string;
    if (fallbackTitle) return fallbackTitle;
    return selectedCourse ? 'Course' : '';
  }, [enrollments, selectedCourse, fallbackTitle]);

  const refreshDiscussions = React.useCallback(() => {
    if (!selectedCourse) return;
    fetch(`${API_BASE}/api/discussions/${selectedCourse}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDiscussions(d.discussions);
      })
      .catch(() => {});
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedCourse) return;
    setLoadingThreads(true);
    fetch(`${API_BASE}/api/discussions/${selectedCourse}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDiscussions(d.discussions);
      })
      .catch(() => {})
      .finally(() => setLoadingThreads(false));
  }, [selectedCourse]);

  const isStudent = user?.role !== 'instructor';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-indigo-950/40 px-5 py-6 sm:px-8 sm:py-8 shadow-xl shadow-black/20">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/90 mb-1.5">
              Course discussions
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Discussions</h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-xl leading-relaxed">
              Threads are <span className="text-zinc-200 font-semibold">scoped to one course</span>. Pick a course
              below, then read or start a topic. Only people connected to that course see these posts.
            </p>
          </div>
          {selectedCourse && (
            <div className="flex flex-wrap shrink-0 gap-2">
              <button
                type="button"
                onClick={loadCourseDiscussionSummary}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-sm font-bold text-indigo-200 transition-colors hover:bg-indigo-500/20"
              >
                <Sparkles size={17} /> AI summary
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition-colors hover:bg-indigo-500"
              >
                <Plus size={17} /> New topic
              </button>
            </div>
          )}
        </div>

        {selectedCourse ? (
          <div className="relative mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 sm:px-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Showing threads for</p>
              <p className="truncate text-base font-bold text-white">{activeCourseTitle}</p>
            </div>
            {!loadingThreads && (
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-400 ring-1 ring-white/10">
                {discussions.length} topic{discussions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : null}
      </header>

      {coursesLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/40 py-24">
          <Loader2 size={36} className="animate-spin text-indigo-400" />
        </div>
      ) : enrollments.length === 0 && !selectedCourseId ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-900/30 px-6 py-16 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="text-lg font-bold text-zinc-300">
            {isStudent ? 'No courses yet' : 'No courses to moderate'}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            {isStudent
              ? 'Enroll in a course from Browse to unlock its discussion board here.'
              : 'Create a course first; each course has its own discussion space for you and enrolled learners.'}
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Choose course</p>
              {enrollments.length > 1 ? (
                <span className="text-[10px] text-zinc-600">{enrollments.length} available</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {enrollments.length === 0 && selectedCourseId ? (
                <span className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200">
                  {activeCourseTitle || 'Loading course…'}
                </span>
              ) : (
                enrollments.map((e: any) => (
                  <button
                    key={e.courseId}
                    type="button"
                    onClick={() => setSelectedCourse(e.courseId)}
                    className={`max-w-full rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-all ${
                      selectedCourse === e.courseId
                        ? 'border-indigo-500/50 bg-indigo-600 text-white shadow-md shadow-indigo-950/30'
                        : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="line-clamp-2">{e.course?.title || 'Course'}</span>
                  </button>
                ))
              )}
            </div>
          </section>

          {!selectedCourse ? (
            <p className="text-center text-sm text-zinc-500">Select a course to load discussions.</p>
          ) : loadingThreads ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/40 py-20">
              <Loader2 size={36} className="animate-spin text-indigo-400" />
            </div>
          ) : discussions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-16 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <h3 className="text-lg font-bold text-zinc-300">No topics in this course yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                Be the first to ask a question or share a note for <span className="text-zinc-300">{activeCourseTitle}</span>.
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
              >
                <Plus size={16} /> Start a topic
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {discussions.map((d, i) => (
                <DiscussionCard
                  key={d.id}
                  discussion={d}
                  user={user}
                  index={i}
                  onUpdate={refreshDiscussions}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showCreate && selectedCourse && (
          <CreateDiscussionModal
            courseId={selectedCourse}
            courseTitle={activeCourseTitle}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              refreshDiscussions();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {summaryOpen && (
          <DiscussionSummaryModal
            scopeTitle={activeCourseTitle || 'Course'}
            subtitle="All topics in this course"
            loading={summaryLoading}
            err={summaryErr}
            data={summaryData}
            onClose={() => setSummaryOpen(false)}
            onRetry={loadCourseDiscussionSummary}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DiscussionCard({ discussion, user, index, onUpdate }: any) {
  const { confirm } = useConfirm();
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [threadSummary, setThreadSummary] = useState<Record<string, unknown> | null>(null);
  const [threadSummaryLoading, setThreadSummaryLoading] = useState(false);
  const [threadSummaryErr, setThreadSummaryErr] = useState('');
  const liked = (discussion.likedBy || []).some((id: string) => uidEq(id, user?.id));

  const loadThreadSummary = async () => {
    setThreadSummaryErr('');
    setThreadSummaryLoading(true);
    setThreadSummary(null);
    try {
      const r = await fetch(`${API_BASE}/api/discussions/${discussion.courseId}/summary`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ discussionId: discussion.id }),
      });
      const d = await r.json();
      if (d.success && d.summary) setThreadSummary(d.summary);
      else setThreadSummaryErr(d.message || 'Could not summarize this thread.');
    } catch {
      setThreadSummaryErr('Network error.');
    } finally {
      setThreadSummaryLoading(false);
    }
  };

  const handleLike = async () => {
    await fetch(`${API_BASE}/api/discussions/like/${discussion.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    onUpdate();
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await fetch(`${API_BASE}/api/discussions/reply/${discussion.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: replyText }),
      });
      setReplyText('');
      onUpdate();
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete discussion',
      message: 'Delete this discussion? Replies will be removed as well.',
      variant: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    await fetch(`${API_BASE}/api/discussions/${discussion.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    onUpdate();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-sm transition-colors hover:border-indigo-500/25"
    >
      <div className="border-b border-white/5 bg-black/20 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                discussion.userRole === 'instructor'
                  ? 'bg-purple-500/25 text-purple-200'
                  : 'bg-indigo-500/25 text-indigo-200'
              }`}
            >
              {(discussion.userName || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-zinc-100">{discussion.userName}</span>
                {discussion.userRole === 'instructor' ? (
                  <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-300">
                    Instructor
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {new Date(discussion.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
          {uidEq(discussion.userId, user?.id) && (
            <button
              type="button"
              onClick={handleDelete}
              className="shrink-0 rounded-lg p-2 text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Delete topic"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <h3 className="text-lg font-bold leading-snug text-white">{discussion.title}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{discussion.content}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleLike}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
              liked ? 'text-rose-400' : 'text-zinc-500 hover:text-rose-300'
            }`}
          >
            <Heart size={15} className={liked ? 'fill-current' : ''} />
            {discussion.likes || 0}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-white"
          >
            <MessageSquare size={15} />
            {discussion.replies?.length || 0}{' '}
            {discussion.replies?.length === 1 ? 'reply' : 'replies'}
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-black/25"
          >
            <div className="space-y-4 px-5 py-4 sm:px-6">
              {(discussion.replies || []).length === 0 ? (
                <p className="text-center text-xs text-zinc-500">No replies yet — add one below.</p>
              ) : (
                <ul className="space-y-4">
                  {(discussion.replies || []).map((reply: Reply) => (
                    <li key={reply.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 ring-1 ring-white/10">
                        {(reply.userName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-200">{reply.userName}</span>
                          {reply.userRole === 'instructor' ? (
                            <span className="text-[10px] font-bold uppercase text-purple-300">Instructor</span>
                          ) : null}
                          <span className="text-[10px] text-zinc-600">
                            {new Date(reply.createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                          {reply.content}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Thread tools</p>
                <button
                  type="button"
                  onClick={loadThreadSummary}
                  disabled={threadSummaryLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/35 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-50"
                >
                  {threadSummaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  AI thread summary
                </button>
              </div>
              {threadSummaryErr ? <p className="text-xs text-red-400">{threadSummaryErr}</p> : null}
              {threadSummary ? (
                <div className="rounded-xl border border-indigo-500/25 bg-indigo-950/20 p-4 text-sm">
                  <p className="font-bold text-white">{String(threadSummary.headline || '')}</p>
                  <p className="mt-2 text-zinc-300 leading-relaxed">{String(threadSummary.summary || '')}</p>
                  {Array.isArray(threadSummary.decisionsOrAnswers) && threadSummary.decisionsOrAnswers.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase text-emerald-400/90">Answers / decisions</p>
                      <ul className="mt-1 list-disc pl-4 text-zinc-400 space-y-0.5">
                        {(threadSummary.decisionsOrAnswers as string[]).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {Array.isArray(threadSummary.openQuestions) && threadSummary.openQuestions.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase text-amber-400/90">Open questions</p>
                      <ul className="mt-1 list-disc pl-4 text-zinc-400 space-y-0.5">
                        {(threadSummary.openQuestions as string[]).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {threadSummary.tone ? (
                    <p className="mt-2 text-[10px] uppercase text-zinc-500">Tone: {String(threadSummary.tone)}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex gap-2 pt-1">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                  placeholder="Write a reply…"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  className="shrink-0 rounded-xl bg-indigo-600 px-4 text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
                >
                  {replying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function DiscussionSummaryModal({
  scopeTitle,
  subtitle,
  loading,
  err,
  data,
  onClose,
  onRetry,
}: {
  scopeTitle: string;
  subtitle: string;
  loading: boolean;
  err: string;
  data: Record<string, unknown> | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  const themes = Array.isArray(data?.themes) ? (data!.themes as string[]) : [];
  const highlights = Array.isArray(data?.highlights) ? (data!.highlights as string[]) : [];
  const openQuestions = Array.isArray(data?.openQuestions) ? (data!.openQuestions as string[]) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={22} className="text-indigo-400 shrink-0" /> Discussion summary
            </h2>
            <p className="mt-1 text-xs text-zinc-500 truncate">
              {scopeTitle} · <span className="text-zinc-400">{subtitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white shrink-0"
          >
            <XCircle size={22} />
          </button>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-zinc-400 text-sm">
              <Loader2 size={22} className="animate-spin text-indigo-400" /> Generating summary…
            </div>
          ) : err ? (
            <p className="text-sm text-red-400">{err}</p>
          ) : data ? (
            <>
              <div>
                <p className="font-bold text-lg text-white">{String(data.headline || '')}</p>
                <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{String(data.summary || '')}</p>
                {data.tone ? (
                  <p className="mt-2 text-[10px] uppercase text-zinc-500">Tone: {String(data.tone)}</p>
                ) : null}
              </div>
              {themes.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold uppercase text-indigo-300/90 mb-1.5">Themes</p>
                  <ul className="list-disc pl-4 text-sm text-zinc-400 space-y-0.5">
                    {themes.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {highlights.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-400/90 mb-1.5">Highlights</p>
                  <ul className="list-disc pl-4 text-sm text-zinc-400 space-y-0.5">
                    {highlights.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {openQuestions.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-400/90 mb-1.5">Open questions</p>
                  <ul className="list-disc pl-4 text-sm text-zinc-400 space-y-0.5">
                    {openQuestions.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onRetry}
              disabled={loading}
              className="flex-1 rounded-xl border border-indigo-500/40 bg-indigo-500/15 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-500/25 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateDiscussionModal({
  courseId,
  courseTitle,
  onClose,
  onCreated,
}: {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/discussions/${courseId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-white">New topic</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Posting in <span className="font-semibold text-zinc-300">{courseTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <XCircle size={22} />
          </button>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputCls}
              placeholder="Short headline for your topic"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Details *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={5}
              className={`${inputCls} resize-none`}
              placeholder="Question, idea, or note for classmates and the instructor…"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || !form.title.trim() || !form.content.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? 'Posting…' : 'Post topic'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
