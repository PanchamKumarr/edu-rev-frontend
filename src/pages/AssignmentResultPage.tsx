import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Award,
  Brain,
  ClipboardList,
  Loader2,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../lib/api';
import { useAuth } from '../components/AuthProvider';

interface Question {
  question: string;
  type?: string;
  options?: string[];
  correctAnswer?: number;
  modelAnswer?: string;
  explanation?: string;
}

interface GradedRow {
  questionIndex: number;
  answer: unknown;
  isCorrect?: boolean;
  correctAnswer?: number;
  explanation?: string;
  type?: string;
  aiScore?: number;
  aiFeedback?: string;
  pointsAwarded?: number;
}

interface AiReview {
  overallSummary: string;
  strengths: string[];
  improvements: string[];
  focusAreas: string[];
}

interface AssignmentPayload {
  id: string;
  title: string;
  description: string;
  type: string;
  questions: Question[];
  maxScore: number;
  passingScore: number;
  dueDate?: string | null;
}

interface SubmissionPayload {
  id: string;
  studentId?: string;
  answers: { questionIndex: number; answer: unknown }[];
  gradedAnswers: GradedRow[];
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  feedback: string;
  status: string;
  submittedAt: string;
  gradedAt?: string | null;
  aiReview: AiReview | null;
}

function answerByIndex(answers: SubmissionPayload['answers'], idx: number): unknown {
  const row = answers.find((a) => a.questionIndex === idx);
  return row?.answer;
}

export function AssignmentResultPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState<AssignmentPayload | null>(null);
  const [submission, setSubmission] = useState<SubmissionPayload | null>(null);

  useEffect(() => {
    if (!submissionId) {
      setError('Missing submission id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const r = await fetch(
          `${API_BASE}/api/assignments/submissions/${encodeURIComponent(submissionId)}`,
          { headers: getAuthHeaders() }
        );
        const d = await r.json();
        if (cancelled) return;
        if (d.success && d.assignment && d.submission) {
          setAssignment(d.assignment);
          setSubmission(d.submission);
        } else {
          setError(d.message || 'Could not load this submission');
        }
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const gradedByIndex = useMemo(() => {
    const m = new Map<number, GradedRow>();
    (submission?.gradedAnswers || []).forEach((g) => {
      m.set(Number(g.questionIndex), g);
    });
    return m;
  }, [submission]);

  const passThreshold = assignment?.passingScore ?? 50;
  const displayPassed =
    submission &&
    (submission.passed === true ||
      (typeof submission.score === 'number' && submission.score >= passThreshold));

  const isOverdue = assignment?.dueDate && new Date(assignment.dueDate) < new Date();
  const isOwnSubmission =
    !!user?.id && !!submission?.studentId && submission.studentId === user.id;
  const canRetake =
    user?.role === 'student' &&
    isOwnSubmission &&
    !!submission &&
    !displayPassed &&
    !isOverdue;

  const back = () => {
    navigate('/dashboard/assignments');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft size={18} />
          Assignments
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardList size={20} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-300 truncate hidden sm:inline">
            Assignment results
          </span>
        </div>
        <button
          type="button"
          onClick={() => void navigate('/dashboard/analytics')}
          className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
        >
          Analytics
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-20">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
            <p className="text-sm">Loading your detailed results…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-6 text-center text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && assignment && submission && (
          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div
                  className={`mx-auto sm:mx-0 w-28 h-28 rounded-full flex flex-col items-center justify-center shrink-0 ${
                    displayPassed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  <span className="text-3xl font-black tabular-nums">{submission.percentage}%</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold mt-0.5 opacity-80">
                    {displayPassed ? 'Passed' : 'Below pass'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${
                      assignment.type === 'mcq'
                        ? 'bg-blue-500/20 text-blue-300'
                        : assignment.type === 'subjective'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {assignment.type.toUpperCase()}
                  </span>
                  <h1 className="text-2xl font-bold text-white leading-tight">{assignment.title}</h1>
                  {assignment.description ? (
                    <p className="text-sm text-zinc-500 mt-2 whitespace-pre-wrap">{assignment.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-zinc-500 justify-center sm:justify-start">
                    <span className="flex items-center gap-1">
                      <Award size={12} />
                      {submission.score} / {submission.maxScore} pts · pass {passThreshold}
                    </span>
                    <span>Status: {submission.status}</span>
                    {submission.submittedAt && (
                      <span>Submitted {new Date(submission.submittedAt).toLocaleString()}</span>
                    )}
                  </div>
                  {canRetake ? (
                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => void navigate('/dashboard/assignments')}
                        className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold"
                      >
                        <RotateCcw size={18} />
                        Re-attempt assignment
                      </button>
                      <p className="text-xs text-zinc-500 max-w-md">
                        You can submit again while the due date has not passed. On Assignments, use <span className="text-zinc-300 font-semibold">Re-attempt</span> on this quiz.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {submission.feedback ? (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Combined feedback
                  </h2>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{submission.feedback}</p>
                </div>
              ) : null}
            </motion.section>

            {submission.aiReview &&
            (submission.aiReview.overallSummary ||
              submission.aiReview.strengths.length ||
              submission.aiReview.improvements.length ||
              submission.aiReview.focusAreas.length) ? (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-3xl border border-violet-500/20 bg-violet-950/20 p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center gap-2 text-violet-300">
                  <Brain size={20} />
                  <h2 className="text-lg font-bold">AI evaluation (Groq)</h2>
                </div>
                {submission.aiReview.overallSummary ? (
                  <p className="text-sm text-zinc-200 leading-relaxed">{submission.aiReview.overallSummary}</p>
                ) : null}

                <div className="grid sm:grid-cols-2 gap-4">
                  {submission.aiReview.strengths.length > 0 && (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <TrendingUp size={14} />
                        What you did well
                      </div>
                      <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-4">
                        {submission.aiReview.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {submission.aiReview.improvements.length > 0 && (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <Target size={14} />
                        What to improve
                      </div>
                      <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-4">
                        {submission.aiReview.improvements.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {submission.aiReview.focusAreas.length > 0 && (
                  <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4">
                    <div className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                      Where to focus next
                    </div>
                    <ul className="text-sm text-zinc-200 space-y-2">
                      {submission.aiReview.focusAreas.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-indigo-400 font-mono text-xs shrink-0">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.section>
            ) : null}

            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ClipboardList size={20} className="text-zinc-500" />
                Question-by-question
              </h2>
              <div className="space-y-4">
                {assignment.questions.map((q, qIdx) => {
                  const graded = gradedByIndex.get(qIdx);
                  const raw = answerByIndex(submission.answers, qIdx);
                  const isMcq = q.type === 'mcq' || !q.type;
                  const isSubjective = q.type === 'subjective';

                  return (
                    <motion.div
                      key={qIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.02 * qIdx }}
                      className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 space-y-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-bold text-zinc-300 shrink-0">
                          {qIdx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              {isMcq ? 'Multiple choice' : 'Written response'}
                            </span>
                            {isMcq && graded && typeof graded.isCorrect === 'boolean' && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  graded.isCorrect
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {graded.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            )}
                            {isSubjective && typeof graded?.aiScore === 'number' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                                AI score {graded.aiScore}/10
                                {typeof graded.pointsAwarded === 'number'
                                  ? ` · ~${graded.pointsAwarded} pts`
                                  : ''}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-white leading-snug">{q.question}</p>
                        </div>
                      </div>

                      {isMcq && q.options && (
                        <div className="pl-11 space-y-2 text-sm">
                          <div>
                            <span className="text-zinc-500 text-xs font-semibold uppercase">Your answer</span>
                            <p className="text-zinc-200 mt-0.5">
                              {typeof raw === 'number' && q.options[raw] !== undefined
                                ? `${String.fromCharCode(65 + raw)}. ${q.options[raw]}`
                                : String(raw ?? '—')}
                            </p>
                          </div>
                          {graded && typeof graded.correctAnswer === 'number' && q.options[graded.correctAnswer] && (
                            <div>
                              <span className="text-zinc-500 text-xs font-semibold uppercase">Correct answer</span>
                              <p className="text-emerald-300/90 mt-0.5">
                                {String.fromCharCode(65 + graded.correctAnswer)}. {q.options[graded.correctAnswer]}
                              </p>
                            </div>
                          )}
                          {graded?.explanation ? (
                            <div className="text-xs text-zinc-500 bg-white/5 rounded-xl p-3 border border-white/5">
                              <span className="text-zinc-400 font-semibold">Explanation: </span>
                              {graded.explanation}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {isSubjective && (
                        <div className="pl-11 space-y-3 text-sm">
                          <div>
                            <span className="text-zinc-500 text-xs font-semibold uppercase">Your response</span>
                            <p className="text-zinc-200 mt-0.5 whitespace-pre-wrap rounded-xl bg-black/30 border border-white/5 p-3">
                              {String(raw ?? '—')}
                            </p>
                          </div>
                          {q.modelAnswer ? (
                            <div>
                              <span className="text-zinc-500 text-xs font-semibold uppercase">Model / expected answer</span>
                              <p className="text-zinc-400 mt-0.5 whitespace-pre-wrap text-xs leading-relaxed">
                                {q.modelAnswer}
                              </p>
                            </div>
                          ) : null}
                          {graded?.aiFeedback ? (
                            <div className="rounded-xl border border-violet-500/25 bg-violet-950/30 p-3">
                              <span className="text-violet-300 text-xs font-bold uppercase tracking-wider">
                                Groq feedback
                              </span>
                              <p className="text-zinc-200 mt-1.5 leading-relaxed">{graded.aiFeedback}</p>
                            </div>
                          ) : submission.status !== 'graded' ? (
                            <p className="text-xs text-amber-400/90">
                              This written response was not auto-graded yet, or grading did not complete.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
