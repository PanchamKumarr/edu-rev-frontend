import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, X, FileText } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';

const textareaCls =
  'w-full min-h-[130px] resize-y rounded-lg border border-white/[0.08] bg-[#111113] px-3.5 py-3 text-[13.5px] leading-relaxed text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/20';

interface Analysis {
  overallMatchPercent?: number | null;
  summary?: string;
  stronglyAligned?: Array<{ syllabusTopic?: string; courseLocation?: string; confidence?: string }>;
  inSyllabusNotInCourse?: string[];
  inCourseNotInSyllabus?: string[];
  suggestionsForStudent?: string[];
  parseError?: boolean;
}

export function SyllabusMatchPanel({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [syllabusText, setSyllabusText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runMatch = async () => {
    setError('');
    setLoading(true);
    setAnalysis(null);
    try {
      let r: Response;
      if (file) {
        const fd = new FormData();
        fd.append('syllabusText', syllabusText.trim());
        fd.append('syllabus', file);
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        r = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(courseId)}/syllabus-match`, {
          method: 'POST',
          headers,
          body: fd,
        });
      } else {
        r = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(courseId)}/syllabus-match`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabusText: syllabusText.trim() }),
        });
      }
      const d = await r.json();
      if (!d.success) {
        setError(d.message || 'Could not analyze syllabus');
        return;
      }
      setAnalysis((d.analysis as Analysis) || null);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const pct = analysis?.overallMatchPercent;
  // Enabled when: a file is selected OR text is at least 50 chars
  const canRun = !loading && (file !== null || syllabusText.trim().length >= 50);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-zinc-400 leading-relaxed">
        Upload or paste your class syllabus for <span className="text-white font-medium">{courseTitle}</span>. We compare it to
        this course&apos;s modules and lessons (via AI) and estimate how well the content aligns, what might be missing on either side,
        and practical tips.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3 text-[13px] text-red-200">
          <AlertCircle size={16} strokeWidth={1.75} className="shrink-0 mt-0.5 text-red-300" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Textarea */}
        <div>
          <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 block mb-1.5">
            Paste syllabus text
          </label>
          <textarea
            className={textareaCls}
            placeholder="Paste the full syllabus, learning outcomes, weekly topics, etc. (at least 50 characters if not uploading a file)"
            value={syllabusText}
            onChange={e => setSyllabusText(e.target.value)}
          />
          {syllabusText.trim().length > 0 && syllabusText.trim().length < 50 && !file && (
            <p className="mt-1.5 text-[12px] text-amber-400/80 tabular-nums">
              {syllabusText.trim().length}/50 chars — need {50 - syllabusText.trim().length} more (or upload a file)
            </p>
          )}
        </div>

        {/* File upload */}
        <div>
          <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 block mb-1.5">
            Or upload .txt / .md
          </label>
          {file ? (
            /* Selected file pill */
            <div className="flex items-center gap-2 bg-indigo-500/[0.08] border border-indigo-500/20 rounded-lg px-3 py-2.5">
              <FileText size={14} strokeWidth={1.75} className="text-indigo-300 shrink-0" />
              <span className="text-[13px] text-indigo-100 flex-1 truncate">{file.name}</span>
              <span className="text-[11px] text-zinc-500 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={clearFile}
                className="p-0.5 rounded text-zinc-500 hover:text-red-400 transition-colors"
                aria-label="Remove file"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 w-fit cursor-pointer border border-dashed border-white/[0.1] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.04] rounded-lg px-4 py-2.5 text-[12.5px] text-zinc-400 hover:text-zinc-200 transition-colors">
              <FileText size={14} strokeWidth={1.75} className="text-indigo-300" />
              Choose .txt or .md file
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,text/plain"
                className="hidden"
                onChange={e => {
                  const picked = e.target.files?.[0] ?? null;
                  setFile(picked);
                }}
              />
            </label>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            disabled={!canRun}
            onClick={() => void runMatch()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40"
          >
            {loading ? <Loader2 size={15} strokeWidth={2} className="animate-spin" /> : <Sparkles size={15} strokeWidth={1.75} />}
            Compare with course
          </button>
          {!canRun && !loading && (
            <p className="text-[12px] text-zinc-500">
              {file ? '' : 'Paste at least 50 chars or upload a file to continue'}
            </p>
          )}
        </div>

        <p className="text-[11.5px] text-zinc-600 leading-relaxed">
          Estimates are AI-generated and not a grade guarantee. PDF syllabi: copy text into the box until we add PDF support.
        </p>
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/[0.07] bg-neutral-900/70 p-5 space-y-5"
          >
            {/* Match % */}
            {typeof pct === 'number' && (
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-1">Estimated match</p>
                  <p className="text-[36px] leading-none font-semibold text-white tabular-nums">
                    {Math.min(100, Math.max(0, Math.round(pct)))}
                    <span className="text-[20px] text-violet-400 ml-0.5">%</span>
                  </p>
                </div>
                <div className="flex-1 min-w-[120px] h-[5px] bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            {analysis.summary && (
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={11} strokeWidth={2.5} className="text-emerald-400" /> Summary
                </p>
                <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{analysis.summary}</p>
              </div>
            )}

            {/* Aligned */}
            {Array.isArray(analysis.stronglyAligned) && analysis.stronglyAligned.length > 0 && (
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-2">Aligned topics</p>
                <ul className="space-y-1.5">
                  {analysis.stronglyAligned.map((row, i) => (
                    <li key={i} className="text-[13px] bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                      <span className="text-violet-300 font-medium">{row.syllabusTopic || 'Topic'}</span>
                      <span className="text-zinc-600 mx-1.5">→</span>
                      <span className="text-zinc-300">{row.courseLocation || 'Course'}</span>
                      {row.confidence && (
                        <span className="ml-2 text-[10px] uppercase text-zinc-500">({row.confidence})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Syllabus-only gaps */}
            {Array.isArray(analysis.inSyllabusNotInCourse) && analysis.inSyllabusNotInCourse.length > 0 && (
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-400/80 mb-2">In syllabus, weak or missing in course</p>
                <ul className="space-y-1 pl-4 list-disc text-[13px] text-zinc-400">
                  {analysis.inSyllabusNotInCourse.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {/* Course-only extras */}
            {Array.isArray(analysis.inCourseNotInSyllabus) && analysis.inCourseNotInSyllabus.length > 0 && (
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cyan-400/80 mb-2">Extra in this course vs syllabus</p>
                <ul className="space-y-1 pl-4 list-disc text-[13px] text-zinc-400">
                  {analysis.inCourseNotInSyllabus.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {Array.isArray(analysis.suggestionsForStudent) && analysis.suggestionsForStudent.length > 0 && (
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-2">Suggestions</p>
                <ul className="space-y-1 pl-4 list-disc text-[13px] text-zinc-300">
                  {analysis.suggestionsForStudent.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {analysis.parseError && (
              <p className="text-[12px] text-amber-400/80">Response was partially parsed; you may still see useful text above.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
