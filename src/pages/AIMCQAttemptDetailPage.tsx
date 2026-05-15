import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Brain, Loader2, RefreshCw } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../lib/api';

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface PerQuestionRow {
  index: number;
  timeMs: number | null;
  timedOut?: boolean;
  selected?: number;
  correct?: boolean;
}

interface AttemptPayload {
  id: string;
  topic: string;
  difficulty: string;
  score: number;
  percentage: number;
  analysis?: string;
  analysisDetailed?: string;
  session?: { blurCount?: number; mode?: string; timePerQuestionSec?: number };
  perQuestion?: PerQuestionRow[];
  questions: MCQQuestion[];
  answers: Record<string, number>;
  totalQuestions: number;
  createdAt: string;
}

function getUserAnswer(answers: Record<string, number> | undefined, i: number): number | undefined {
  if (!answers || typeof answers !== 'object') return undefined;
  const v = (answers as Record<string, unknown>)[i] ?? (answers as Record<string, unknown>)[String(i)];
  return typeof v === 'number' ? v : undefined;
}

export function AIMCQAttemptDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState<AttemptPayload | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setError('Missing attempt id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const r = await fetch(`${API_BASE}/api/ai/mcq-attempts/${encodeURIComponent(attemptId)}`, {
          headers: getAuthHeaders(),
        });
        const d = await r.json();
        if (cancelled) return;
        if (d.success && d.attempt) setAttempt(d.attempt);
        else setError(d.message || 'Could not load this attempt');
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const backToGenerator = () => {
    navigate('/dashboard/mcq-generator');
  };

  const percentage = attempt?.percentage ?? 0;
  const questions = attempt?.questions ?? [];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={backToGenerator}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft size={18} />
          AI MCQ Generator
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Brain size={20} className="text-violet-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-300 truncate hidden sm:inline">Attempt details</span>
        </div>
        <button
          type="button"
          onClick={() => void navigate('/dashboard/analytics')}
          className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
        >
          Analytics
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-16">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
            <p className="text-sm">Loading your analysis…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-6 text-center">
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={backToGenerator}
              className="bg-white/10 hover:bg-white/15 px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              Back to generator
            </button>
          </div>
        )}

        {!loading && attempt && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Saved attempt</p>
              <h1 className="text-2xl font-bold mt-1 truncate">{attempt.topic}</h1>
              <p className="text-sm text-zinc-500 mt-1">
                {new Date(attempt.createdAt).toLocaleString()} · Difficulty: {attempt.difficulty} ·{' '}
                {attempt.score}/{attempt.totalQuestions} correct
                {typeof attempt.session?.blurCount === 'number' && attempt.session.blurCount > 0
                  ? ` · ${attempt.session.blurCount} tab blur(s)`
                  : ''}
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-xl">Detailed analysis</h2>
                  {attempt.analysis && <p className="text-sm text-zinc-500 mt-0.5 max-w-2xl leading-relaxed">{attempt.analysis}</p>}
                </div>
                <span
                  className={`text-lg font-black px-4 py-2 rounded-xl ${
                    percentage >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {percentage}%
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 mb-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">History &amp; insights</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  This run is stored in your history. Open <span className="text-indigo-300 font-semibold">Analytics &amp; Insights</span> on the
                  dashboard to see AI practice blended with course assignment scores.
                </p>
              </div>

              {attempt.analysisDetailed && (
                <details className="mb-6 rounded-xl border border-white/10 bg-white/5">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-300 hover:text-white">
                    Full session log (text)
                  </summary>
                  <pre className="px-4 pb-4 text-[11px] text-zinc-500 whitespace-pre-wrap font-mono leading-relaxed border-t border-white/5 pt-3 max-h-64 overflow-y-auto custom-scrollbar">
                    {attempt.analysisDetailed}
                  </pre>
                </details>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                {questions.map((q, qi) => {
                  const ua = getUserAnswer(attempt.answers, qi);
                  const correct = ua === q.correctAnswer;
                  const pq = attempt.perQuestion?.find((p) => p.index === qi);
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
                        Time: {pq?.timeMs != null ? `${(pq.timeMs / 1000).toFixed(1)}s` : '—'}
                        {pq?.timedOut ? ' · Timer' : ''}
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
                onClick={backToGenerator}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
              >
                <RefreshCw size={16} /> New quiz
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
