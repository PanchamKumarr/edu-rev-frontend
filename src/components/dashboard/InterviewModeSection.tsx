import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic2, Send, Loader2, Sparkles, History, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';

const inputCls =
  'w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-white placeholder-zinc-500';

interface ChatMsg {
  role: 'assistant' | 'user';
  content: string;
}

interface SessionListItem {
  id: string;
  topic: string;
  status: string;
  userTurnCount: number;
  createdAt: string;
  completedAt?: string | null;
  rubric?: {
    overallScore: number | null;
    communicationScore: number | null;
    technicalScore: number | null;
    summary: string;
  } | null;
}

export function InterviewModeSection() {
  const [topic, setTopic] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [starting, setStarting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [userTurns, setUserTurns] = useState(0);
  const [maxTurns, setMaxTurns] = useState(22);
  const [rubric, setRubric] = useState<Record<string, unknown> | null>(null);
  const [evalSummary, setEvalSummary] = useState('');
  const [history, setHistory] = useState<SessionListItem[]>([]);
  /** No further candidate messages (AI ended, max turns, or session completed). */
  const [chatLocked, setChatLocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = () => {
    fetch(`${API_BASE}/api/interviews/my`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) setHistory(d.sessions || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, rubric]);

  const resetSession = () => {
    setSessionId(null);
    setMessages([]);
    setInput('');
    setRubric(null);
    setEvalSummary('');
    setUserTurns(0);
    setError('');
    setChatLocked(false);
  };

  const startInterview = async () => {
    setError('');
    setStarting(true);
    try {
      let r: Response;
      if (resumeFile) {
        const fd = new FormData();
        fd.append('topic', topic.trim());
        fd.append('resumeText', resumeText.trim());
        fd.append('resume', resumeFile);
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        r = await fetch(`${API_BASE}/api/interviews/start`, { method: 'POST', headers, body: fd });
      } else {
        r = await fetch(`${API_BASE}/api/interviews/start`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic.trim(), resumeText: resumeText.trim() }),
        });
      }
      const d = await r.json();
      if (!d.success) {
        setError(d.message || 'Could not start');
        return;
      }
      setSessionId(d.sessionId);
      setMessages([{ role: 'assistant', content: d.message }]);
      setUserTurns(0);
      setRubric(null);
      setEvalSummary('');
      setChatLocked(false);
    } catch {
      setError('Network error');
    } finally {
      setStarting(false);
    }
  };

  const runCompleteEvaluation = async (): Promise<boolean> => {
    if (!sessionId) return false;
    setCompleting(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/interviews/${sessionId}/complete`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!d.success) {
        setError(d.message || 'Could not complete');
        return false;
      }
      setRubric((d.rubric as Record<string, unknown>) || null);
      setEvalSummary(d.evaluationSummary || '');
      setChatLocked(true);
      loadHistory();
      return true;
    } catch {
      setError('Network error');
      return false;
    } finally {
      setCompleting(false);
    }
  };

  const sendMessage = async () => {
    if (!sessionId || !input.trim() || sending || chatLocked) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    try {
      const r = await fetch(`${API_BASE}/api/interviews/${sessionId}/message`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) {
        if (d.interviewEnded || d.code === 'INTERVIEW_ENDED' || d.code === 'INTERVIEW_CLOSED') {
          setChatLocked(true);
          setMessages(prev => prev.slice(0, -1));
          setInput('');
          setError('');
        } else {
          setError(d.message || 'Send failed');
          setMessages(prev => prev.slice(0, -1));
          setInput(text);
        }
        return;
      }
      setUserTurns(d.userTurns ?? 0);
      if (typeof d.maxUserTurns === 'number') setMaxTurns(d.maxUserTurns);
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply }]);
      if (d.interviewEnded) {
        setChatLocked(true);
        await runCompleteEvaluation();
      }
    } catch {
      setError('Network error');
      setMessages(prev => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const finishInterview = async () => {
    if (!sessionId || completing) return;
    setChatLocked(true);
    await runCompleteEvaluation();
  };

  const openHistoryItem = async (id: string) => {
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/interviews/${id}`, { headers: getAuthHeaders() });
      const d = await r.json();
      if (!d.success || !d.session) return;
      const s = d.session;
      setSessionId(s.id);
      setMessages((s.messages || []).map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      setUserTurns(s.userTurnCount ?? 0);
      setMaxTurns(s.maxUserTurns ?? 22);
      setRubric(s.status === 'completed' ? s.rubric : null);
      setEvalSummary(s.status === 'completed' ? s.evaluationSummary : '');
      setChatLocked(s.status === 'completed' || Boolean(s.noMoreMessages));
    } catch {
      setError('Could not load session');
    }
  };

  const showComposer = sessionId && !rubric && !chatLocked;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mic2 className="text-indigo-400" size={28} />
          Interview mode
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Enter a role or topic and optionally paste or upload a plain-text résumé (.txt / .md). The AI interviewer asks one question at a time.
          When you are done, end the session to save scores and feedback. Instructors see completed sessions under Student insights.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!sessionId && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 border border-white/10 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Interview topic or role</label>
            <input
              className={inputCls}
              placeholder="e.g. Junior React developer internship"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Résumé (paste text)</label>
            <textarea
              className={`${inputCls} resize-none min-h-[120px]`}
              placeholder="Paste your résumé here, or upload a .txt file below…"
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Or upload résumé (.txt / .md)</label>
            <input
              type="file"
              accept=".txt,.md,text/plain"
              className="text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-bold"
              onChange={e => setResumeFile(e.target.files?.[0] || null)}
            />
          </div>
          <button
            type="button"
            disabled={starting || (!topic.trim() && !resumeText.trim() && !resumeFile)}
            onClick={startInterview}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {starting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Start interview
          </button>
        </motion.div>
      )}

      {sessionId && (
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-[420px] max-h-[70vh]">
          <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-black/40">
            <p className="text-xs text-zinc-500">
              Replies {userTurns}/{maxTurns}
              {showComposer ? <span className="text-zinc-600"> · answer each question, then tap Send</span> : null}
            </p>
            <div className="flex gap-2">
              {sessionId && !rubric && userTurns >= 1 && (
                <button
                  type="button"
                  onClick={() => void finishInterview()}
                  disabled={completing}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-40 text-white"
                >
                  {completing ? <Loader2 size={14} className="animate-spin inline" /> : null} End &amp; save evaluation
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  resetSession();
                  loadHistory();
                }}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200"
              >
                New session
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600/30 border border-indigo-500/25 text-indigo-50'
                      : 'bg-white/5 border border-white/10 text-zinc-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {showComposer && (
            <div className="p-3 border-t border-white/10 flex gap-2 bg-black/30">
              <input
                className={inputCls}
                placeholder="Type your answer…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void sendMessage())}
              />
              <button
                type="button"
                disabled={sending || !input.trim()}
                onClick={() => void sendMessage()}
                className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center gap-2 font-bold"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          )}

          {sessionId && chatLocked && !rubric && (
            <div className="p-4 border-t border-white/10 bg-zinc-950/90">
              {completing ? (
                <p className="text-sm text-zinc-400 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-400 shrink-0" />
                  Finishing interview and generating your evaluation…
                </p>
              ) : (
                <p className="text-sm text-zinc-500">
                  This interview is closed — you cannot send more messages. Start a{' '}
                  <button
                    type="button"
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline-offset-2 hover:underline"
                    onClick={() => {
                      resetSession();
                      loadHistory();
                    }}
                  >
                    new session
                  </button>{' '}
                  anytime to keep practicing.
                </p>
              )}
            </div>
          )}

          <AnimatePresence>
            {(rubric || evalSummary) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-white/10 p-4 bg-emerald-950/20 space-y-3"
              >
                <h3 className="font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle size={18} /> Saved evaluation
                </h3>
                {evalSummary && <p className="text-sm text-zinc-300">{evalSummary}</p>}
                {rubric && (
                  <div className="grid sm:grid-cols-3 gap-2 text-sm">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-xs text-zinc-500">Overall</p>
                      <p className="text-xl font-black text-white">{String(rubric.overallScore ?? '—')}/10</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-xs text-zinc-500">Communication</p>
                      <p className="text-xl font-black text-white">{String(rubric.communicationScore ?? '—')}/10</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-xs text-zinc-500">Technical</p>
                      <p className="text-xl font-black text-white">{String(rubric.technicalScore ?? '—')}/10</p>
                    </div>
                  </div>
                )}
                {Array.isArray(rubric?.strengths) && (rubric.strengths as string[]).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Strengths</p>
                    <ul className="list-disc pl-5 text-sm text-zinc-300 space-y-1">
                      {(rubric.strengths as string[]).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(rubric?.improvements) && (rubric.improvements as string[]).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Improvements</p>
                    <ul className="list-disc pl-5 text-sm text-zinc-300 space-y-1">
                      {(rubric.improvements as string[]).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2 text-zinc-200">
          <History size={18} className="text-zinc-400" />
          Recent sessions
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">No interviews yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map(h => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => void openHistoryItem(h.id)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm flex flex-wrap justify-between gap-2"
                >
                  <span className="text-zinc-200 font-medium truncate">{h.topic}</span>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {h.status === 'completed' ? 'Completed' : 'In progress'} · {h.userTurnCount} replies
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
