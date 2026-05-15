import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Loader2,
  RefreshCw,
  Maximize2,
  X,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';
import { useConfirm } from '../ConfirmProvider';

const inputCls =
  'w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-white placeholder-zinc-500';
const selectCls =
  'w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-white [color-scheme:dark]';

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

type PerQLog = { index: number; timeMs: number; timedOut?: boolean };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export function MCQGeneratorSection() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [num, setNum] = useState(5);
  const [diff, setDiff] = useState('medium');
  const [timePerQuestion, setTimePerQuestion] = useState(75);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const questionsRef = useRef<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answersRef = useRef<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const currentQRef = useRef(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fromTranscript, setFromTranscript] = useState(false);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [saveResultsError, setSaveResultsError] = useState<string | null>(null);

  const [focusSessionActive, setFocusSessionActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(75);
  const [blurCount, setBlurCount] = useState(0);
  const [tabWarning, setTabWarning] = useState(false);
  const [perQuestionLog, setPerQuestionLog] = useState<PerQLog[]>([]);
  const perQuestionLogRef = useRef<PerQLog[]>([]);
  const blurCountRef = useRef(0);
  const finalizingRef = useRef(false);
  const sessionShellRef = useRef<HTMLDivElement>(null);
  const questionStartRef = useRef(0);
  const sessionStartedAtRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    currentQRef.current = currentQuestion;
  }, [currentQuestion]);

  const loadAttempts = () => {
    fetch(`${API_BASE}/api/ai/mcq-attempts`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAttempts(d.attempts);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    timeoutRef.current = null;
    tickRef.current = null;
  };

  const exitFocusUi = useCallback(async () => {
    setFocusSessionActive(false);
    clearTimers();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const generate = async () => {
    if (!topic.trim() && !content.trim() && !videoUrl.trim()) {
      setError('Enter a topic, paste content or notes, or a YouTube lesson URL');
      return;
    }
    setLoading(true);
    setError('');
    setQuestions([]);
    setAnswers({});
    answersRef.current = {};
    setSubmitted(false);
    setCurrentQuestion(0);
    setFromTranscript(false);
    setFocusSessionActive(false);
    setPerQuestionLog([]);
    perQuestionLogRef.current = [];
    setBlurCount(0);
    blurCountRef.current = 0;
    setSaveResultsError(null);
    try {
      const r = await fetch(`${API_BASE}/api/ai/generate-mcq`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          topic,
          content,
          videoUrl: videoUrl.trim() || undefined,
          numQuestions: num,
          difficulty: diff,
        }),
      });
      const d = await r.json();
      if (d.success && d.questions?.length) {
        setFromTranscript(!!d.transcriptUsed);
        void startFocusSession(d.questions as MCQQuestion[]);
      } else setError(d.message || 'No questions generated. Check your GROQ_API_KEY.');
    } catch {
      setError('Network error. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const startFocusSession = async (questionSet?: MCQQuestion[]) => {
    const qs = questionSet ?? questions;
    if (!qs.length) return;
    setQuestions(qs);
    questionsRef.current = qs;
    setAnswers({});
    answersRef.current = {};
    setCurrentQuestion(0);
    currentQRef.current = 0;
    setSubmitted(false);
    setPerQuestionLog([]);
    perQuestionLogRef.current = [];
    setBlurCount(0);
    blurCountRef.current = 0;
    setTabWarning(false);
    sessionStartedAtRef.current = Date.now();
    questionStartRef.current = Date.now();
    setSaveResultsError(null);
    setFocusSessionActive(true);
    setSecondsLeft(timePerQuestion);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    try {
      await sessionShellRef.current?.requestFullscreen();
    } catch {
      /* fullscreen optional */
    }
  };

  const recordQuestionEnd = useCallback((timedOut: boolean) => {
    const idx = currentQRef.current;
    const ms = Date.now() - questionStartRef.current;
    const entry: PerQLog = { index: idx, timeMs: ms, timedOut };
    const next = [...perQuestionLogRef.current.filter((p) => p.index !== idx), entry];
    perQuestionLogRef.current = next;
    setPerQuestionLog(next);
  }, []);

  const finalizeSession = useCallback(async () => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    try {
    clearTimers();
    setSubmitted(true);
    await exitFocusUi();

    const qs = questionsRef.current;
    const ans = answersRef.current;
    const logs = perQuestionLogRef.current;
    const blur = blurCountRef.current;

    const finalScore = qs.reduce((s, q, i) => s + (ans[i] === q.correctAnswer ? 1 : 0), 0);
    const finalPercentage = qs.length ? Math.round((finalScore / qs.length) * 100) : 0;
    const totalMs = Date.now() - sessionStartedAtRef.current;
    const avgMs = qs.length ? Math.round(logs.reduce((a, p) => a + p.timeMs, 0) / qs.length) : 0;

    const summary =
      finalPercentage >= 80
        ? 'Strong performance on this AI-generated set.'
        : finalPercentage >= 60
          ? 'Solid attempt. Review explanations for missed items.'
          : 'Keep practicing this topic with notes or another run.';

    const detailedLines = [
      '=== Session summary ===',
      `Score: ${finalScore}/${qs.length} (${finalPercentage}%). Difficulty: ${diff}.`,
      `Total session time: ${(totalMs / 1000).toFixed(0)}s. Avg time per question (logged): ${avgMs ? (avgMs / 1000).toFixed(1) : '—'}s.`,
      `Tab / focus changes recorded: ${blur} (used with course quiz data in Analytics for engagement context).`,
      '',
      '=== Per question ===',
    ];
    qs.forEach((q, i) => {
      const ua = ans[i];
      const ok = ua === q.correctAnswer;
      const log = logs.find((p) => p.index === i);
      const tnote = log ? `${(log.timeMs / 1000).toFixed(1)}s${log.timedOut ? ' (timer)' : ''}` : '—';
      detailedLines.push(
        `Q${i + 1}: ${ok ? 'Correct' : ua === undefined || ua === -1 ? 'Skipped / timeout' : 'Incorrect'} | Time ${tnote}`
      );
      if (!ok && q.explanation) detailedLines.push(`  → ${q.explanation}`);
    });
    const analysisDetailed = detailedLines.join('\n');
    const analysis = [summary, `Correct: ${finalScore}/${qs.length}.`, `Difficulty: ${diff}.`].join(' ');

    const session = {
      mode: 'focused_timed_fullscreen',
      timePerQuestionSec: timePerQuestion,
      blurCount: blur,
      totalMs,
      startedAt: new Date(sessionStartedAtRef.current).toISOString(),
      endedAt: new Date().toISOString(),
    };

    const perQuestion = qs.map((q, i) => {
      const ua = ans[i];
      const log = logs.find((p) => p.index === i);
      return {
        index: i,
        timeMs: log?.timeMs ?? null,
        timedOut: !!log?.timedOut,
        selected: ua,
        correct: ua === q.correctAnswer,
      };
    });

    setPerQuestionLog([...logs]);
    setSavingAttempt(true);
    let data: { success?: boolean; attemptId?: string; message?: string } = {};
    try {
      const res = await fetch(`${API_BASE}/api/ai/mcq-attempts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          topic: topic || 'AI Generated Quiz',
          difficulty: diff,
          questions: qs,
          answers: ans,
          score: finalScore,
          percentage: finalPercentage,
          analysis,
          analysisDetailed,
          session,
          perQuestion,
        }),
      });
      data = await res.json().catch(() => ({}));
    } catch {
      data = { success: false, message: 'Network error while saving' };
    }
    loadAttempts();
    if (data.success && data.attemptId) {
      setSaveResultsError(null);
      navigate(`/dashboard/ai-mcq-result/${data.attemptId}`);
    } else {
      setSaveResultsError(data.message || 'Could not save your attempt. Showing results here.');
      setSavingAttempt(false);
    }
    } finally {
      finalizingRef.current = false;
    }
  }, [diff, exitFocusUi, navigate, topic, timePerQuestion]);

  const advanceAfterAnswer = useCallback(() => {
    const idx = currentQRef.current;
    const qs = questionsRef.current;
    recordQuestionEnd(false);
    if (idx >= qs.length - 1) {
      void finalizeSession();
    } else {
      questionStartRef.current = Date.now();
      setCurrentQuestion(idx + 1);
    }
  }, [finalizeSession, recordQuestionEnd]);

  const onQuestionTimeout = useCallback(() => {
    const idx = currentQRef.current;
    const qs = questionsRef.current;
    const had = answersRef.current[idx];
    recordQuestionEnd(true);
    if (had === undefined) {
      setAnswers((a) => {
        const next = { ...a, [idx]: -1 };
        answersRef.current = next;
        return next;
      });
    }
    if (idx >= qs.length - 1) {
      void finalizeSession();
    } else {
      questionStartRef.current = Date.now();
      setCurrentQuestion(idx + 1);
    }
  }, [finalizeSession, recordQuestionEnd]);

  useEffect(() => {
    if (!focusSessionActive || submitted) return;
    questionStartRef.current = Date.now();
    setSecondsLeft(timePerQuestion);
    clearTimers();
    timeoutRef.current = setTimeout(() => {
      onQuestionTimeout();
    }, timePerQuestion * 1000);
    tickRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((questionStartRef.current + timePerQuestion * 1000 - Date.now()) / 1000));
      setSecondsLeft(left);
    }, 300);
    return () => clearTimers();
  }, [focusSessionActive, currentQuestion, timePerQuestion, submitted, onQuestionTimeout]);

  useEffect(() => {
    if (!focusSessionActive) return;
    const onVis = () => {
      if (document.hidden) {
        blurCountRef.current += 1;
        setBlurCount(blurCountRef.current);
        setTabWarning(true);
        window.setTimeout(() => setTabWarning(false), 4500);
      }
    };
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', onBefore);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', onBefore);
    };
  }, [focusSessionActive]);

  const active = questions[currentQuestion];
  const score = submitted
    ? questions.reduce((s, q, i) => s + (answers[i] === q.correctAnswer ? 1 : 0), 0)
    : 0;
  const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const analysis = submitted
    ? [
        percentage >= 80
          ? 'Excellent performance. You have strong command of this topic.'
          : percentage >= 60
            ? 'Good progress. Review the missed explanations to strengthen weak spots.'
            : 'Needs more practice. Revisit the learning material and try another generated quiz.',
        `Correct answers: ${score}/${questions.length}.`,
        `Difficulty attempted: ${diff}.`,
      ].join(' ')
    : '';

  const cancelSession = async () => {
    const ok = await confirm({
      title: 'Leave session?',
      message: 'Leave the session? Progress on this run will be lost.',
      variant: 'danger',
      confirmLabel: 'Leave',
      cancelLabel: 'Stay',
    });
    if (!ok) return;
    finalizingRef.current = false;
    clearTimers();
    await exitFocusUi();
    setQuestions([]);
    setAnswers({});
    answersRef.current = {};
    setCurrentQuestion(0);
    setSubmitted(false);
    perQuestionLogRef.current = [];
    setPerQuestionLog([]);
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl font-bold">AI MCQ Generator</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Generate quizzes from a topic, notes, or YouTube transcript. After generation, the timed full-screen session
          opens automatically (one question at a time; tab switches are logged). Results feed into{' '}
          <span className="text-zinc-300 font-medium">Analytics &amp; Insights</span> together with course quizzes.
        </p>
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Topic">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Python OOP, Machine Learning..."
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Questions">
                  <select value={num} onChange={(e) => setNum(Number(e.target.value))} className={selectCls}>
                    {[3, 5, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} Questions
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Difficulty">
                  <select value={diff} onChange={(e) => setDiff(e.target.value)} className={selectCls}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </Field>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Seconds per question (focus mode)">
                <select
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className={selectCls}
                >
                  {[45, 60, 75, 90, 120].map((s) => (
                    <option key={s} value={s}>
                      {s}s
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="YouTube lesson URL (optional)">
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className={inputCls}
              />
            </Field>
            <Field label="Course Content (optional)">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className={`${inputCls} resize-none`}
                placeholder="Paste lesson notes; combined with transcript when a YouTube URL is set..."
              />
            </Field>
            {error && <div className="bg-red-500/10 text-red-400 rounded-xl p-3 text-sm">{error}</div>}
            <button
              onClick={generate}
              disabled={loading || focusSessionActive}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  Generate MCQs
                </>
              )}
            </button>
          </div>

          {questions.length > 0 && !submitted && !focusSessionActive && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-indigo-500/30 rounded-2xl p-6 space-y-4"
            >
              {fromTranscript && (
                <p className="text-xs text-emerald-400/90">Questions built from the YouTube transcript.</p>
              )}
              <p className="text-sm text-zinc-300 leading-relaxed">
                You have <span className="font-bold text-white">{questions.length}</span> questions ready ·{' '}
                <span className="font-bold text-white">{timePerQuestion}s</span> per question. Start the timed full-screen
                run again, or generate a new set above.
              </p>
              <button
                type="button"
                onClick={() => void startFocusSession()}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-950/40"
              >
                <Maximize2 size={18} /> Start timed focus session
              </button>
            </motion.div>
          )}

          {submitted && savingAttempt && (
            <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-6">
              <Loader2 className="animate-spin text-indigo-400 mb-4" size={40} />
              <p className="text-sm font-semibold text-white">Saving your results…</p>
              <p className="text-xs text-zinc-500 mt-2 text-center max-w-sm">Opening your detailed analysis page.</p>
            </div>
          )}

          {submitted && saveResultsError && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/25 text-amber-200 rounded-xl p-4 text-sm">{saveResultsError}</div>
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold text-xl">Detailed analysis</h3>
                    <p className="text-sm text-zinc-500 mt-0.5 max-w-xl">{analysis}</p>
                  </div>
                  <span
                    className={`text-lg font-black px-4 py-2 rounded-xl ${
                      percentage >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-4">
                  Results could not be saved to the server. Retry from a stable connection, or use Generate New Quiz below.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {questions.map((q, qi) => {
                    const ua = answers[qi];
                    const correct = ua === q.correctAnswer;
                    const log = perQuestionLog.find((p) => p.index === qi);
                    return (
                      <div
                        key={qi}
                        className={`border rounded-xl p-4 ${
                          correct ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                        }`}
                      >
                        <p className="text-sm font-medium mb-2">
                          Q{qi + 1}. {q.question}
                        </p>
                        <p className="text-xs text-zinc-500 mb-1">
                          Time: {log ? `${(log.timeMs / 1000).toFixed(1)}s` : '—'}
                          {log?.timedOut ? ' · Timer' : ''}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Your answer:{' '}
                          {ua === undefined || ua === -1 ? '— (skipped / time up)' : q.options[ua]}
                        </p>
                        <p className="text-xs text-zinc-400">Correct: {q.options[q.correctAnswer]}</p>
                        {q.explanation && <p className="text-xs text-zinc-500 mt-2">{q.explanation}</p>}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSaveResultsError(null);
                    setSubmitted(false);
                  }}
                  className="mt-5 mr-3 bg-zinc-700 hover:bg-zinc-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold"
                >
                  Dismiss
                </button>
                <button
                  onClick={generate}
                  className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Generate New Quiz
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Attempt History</h3>
            <button type="button" onClick={loadAttempts} className="text-zinc-500 hover:text-white">
              <RefreshCw size={14} />
            </button>
          </div>
          {attempts.length === 0 ? (
            <p className="text-sm text-zinc-500">No attempts saved yet.</p>
          ) : (
            <div className="space-y-3">
              {attempts.slice(0, 8).map((a) => (
                <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{a.topic}</p>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        a.percentage >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {a.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {a.score}/{a.totalQuestions} correct • {new Date(a.createdAt).toLocaleDateString()}
                    {typeof a.session?.blurCount === 'number' && a.session.blurCount > 0
                      ? ` • ${a.session.blurCount} tab blur(s)`
                      : ''}
                  </p>
                  {a.analysis && <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{a.analysis}</p>}
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    onClick={() => navigate(`/dashboard/ai-mcq-result/${a.id}`)}
                  >
                    Open detailed analysis
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {focusSessionActive && !submitted && active && (
          <motion.div
            ref={sessionShellRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex flex-col bg-zinc-950 text-white"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-black/60">
              <div className="flex items-center gap-3 min-w-0">
                <Brain size={20} className="text-violet-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">AI MCQ · Focus mode</p>
                  <p className="text-sm font-semibold truncate">
                    Q {currentQuestion + 1} / {questions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold tabular-nums ${
                    secondsLeft <= 10 ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40' : 'bg-white/10 text-zinc-200'
                  }`}
                >
                  <Timer size={16} />
                  {secondsLeft}s
                </div>
                <button
                  type="button"
                  onClick={() => void cancelSession()}
                  className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-zinc-300 hover:text-red-300"
                  title="Exit session"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {tabWarning && (
              <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/25 text-amber-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={14} />
                Tab change recorded — stay on this screen during the assessment.
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-center leading-snug mb-8">{active.question}</h3>
              <div className="grid sm:grid-cols-2 gap-3 w-full">
                {active.options.map((opt, oi) => (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [currentQuestion]: oi }));
                    }}
                    className={`text-left px-4 py-4 rounded-2xl border text-sm transition-all ${
                      answers[currentQuestion] === oi
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={answers[currentQuestion] === undefined || answers[currentQuestion] === -1 || savingAttempt}
                onClick={() => advanceAfterAnswer()}
                className="mt-10 w-full max-w-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-bold"
              >
                {currentQuestion >= questions.length - 1 ? 'Finish & save results' : 'Lock answer & next'}
              </button>
              <p className="text-[11px] text-zinc-500 mt-4 text-center max-w-md">
                If time hits 0 before you lock an answer, this question is marked skipped and the session advances
                automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
