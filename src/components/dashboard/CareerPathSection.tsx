import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Loader2, MapPin, Sparkles } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';

const inputCls =
  'w-full min-h-[140px] resize-y rounded-lg border border-white/[0.08] bg-[#111113] px-3.5 py-3 text-[13.5px] leading-relaxed text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/20';

interface RoadmapPhase {
  name?: string;
  durationHint?: string;
  focus?: string;
  skills?: string[];
  milestones?: string[];
  learningActions?: string[];
}

interface CareerRoadmap {
  title?: string;
  summary?: string;
  estimatedTimeline?: string;
  phases?: RoadmapPhase[];
  recommendedResources?: string[];
  nextStepsThisWeek?: string[];
  parseError?: boolean;
}

export function CareerPathSection() {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);

  const generate = async () => {
    setError('');
    setLoading(true);
    setRoadmap(null);
    try {
      const r = await fetch(`${API_BASE}/api/ai/career-roadmap`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim() }),
      });
      const d = await r.json();
      if (!d.success) {
        setError(d.message || 'Could not generate roadmap');
        return;
      }
      setRoadmap((d.roadmap as CareerRoadmap) || null);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = goal.trim().length >= 20 && !loading;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0">
            <MapPin size={18} strokeWidth={1.75} className="text-indigo-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-1.5">Career path</p>
            <h3 className="text-[18px] font-semibold tracking-tight text-white">Describe your career goal</h3>
            <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">
              Write the role, industry, or direction you want (for example: “Become a cloud engineer in 12 months” or “Switch from
              marketing to UX research”). We generate a phased roadmap with skills, milestones, and concrete next steps.
            </p>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3 text-[13px] text-red-200 mb-4">
            <AlertCircle size={17} strokeWidth={1.75} className="shrink-0 mt-0.5 text-red-300" />
            <span>{error}</span>
          </div>
        ) : null}

        <label htmlFor="career-goal-input" className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 block mb-1.5">
          Your goal
        </label>
        <textarea
          id="career-goal-input"
          className={inputCls}
          placeholder="Example: I want to become a full-stack developer focused on React and Node, and land a junior role within 9 months while working part-time..."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={5}
        />
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[12px] tabular-nums">
          <span className={goal.trim().length < 20 ? 'text-amber-400/95' : 'text-zinc-500'}>
            {goal.trim().length}/4000
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500">minimum 20 characters</span>
        </p>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void generate()}
          className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? <Loader2 size={17} strokeWidth={1.75} className="animate-spin" /> : <Sparkles size={17} strokeWidth={1.75} />}
          Generate career roadmap
        </button>
        <p className="mt-5 max-w-2xl border-t border-white/[0.06] pt-4 text-[12px] leading-relaxed text-zinc-500">
          This roadmap is AI-generated for planning and learning — not legal, financial, or licensed career advice. Adapt steps to your situation and verify requirements for your region and industry.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {roadmap ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {roadmap.parseError ? (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-200/90">
                The model returned text we could not fully parse as JSON. Here is the raw summary:
              </div>
            ) : null}

            <div className="rounded-3xl border border-indigo-500/25 bg-indigo-950/20 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">{roadmap.title || 'Your roadmap'}</h2>
              {roadmap.estimatedTimeline ? (
                <p className="text-sm text-indigo-300/90 font-semibold mb-3">{roadmap.estimatedTimeline}</p>
              ) : null}
              {roadmap.summary ? (
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{roadmap.summary}</p>
              ) : null}
            </div>

            {Array.isArray(roadmap.phases) && roadmap.phases.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Phases</h3>
                <ol className="space-y-4">
                  {roadmap.phases.map((phase, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-sm"
                    >
                      <div className="flex flex-wrap items-baseline gap-2 gap-y-1 mb-2">
                        <span className="text-xs font-mono text-indigo-400 tabular-nums">Phase {i + 1}</span>
                        {phase.durationHint ? (
                          <span className="text-xs text-zinc-500">· {phase.durationHint}</span>
                        ) : null}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{phase.name || `Phase ${i + 1}`}</h4>
                      {phase.focus ? <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{phase.focus}</p> : null}

                      {Array.isArray(phase.skills) && phase.skills.length > 0 ? (
                        <div className="mb-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Skills & topics</p>
                          <ul className="flex flex-wrap gap-2">
                            {phase.skills.map((s, j) => (
                              <li key={j} className="text-xs bg-white/5 border border-white/10 text-zinc-300 px-2.5 py-1 rounded-lg">
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {Array.isArray(phase.milestones) && phase.milestones.length > 0 ? (
                        <div className="mb-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Milestones</p>
                          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                            {phase.milestones.map((m, j) => (
                              <li key={j}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {Array.isArray(phase.learningActions) && phase.learningActions.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-bold text-emerald-500/90 uppercase tracking-wider mb-1.5">
                            Learning actions
                          </p>
                          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                            {phase.learningActions.map((a, j) => (
                              <li key={j}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {Array.isArray(roadmap.recommendedResources) && roadmap.recommendedResources.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3">Resources & ideas</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  {roadmap.recommendedResources.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-indigo-500 shrink-0">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Array.isArray(roadmap.nextStepsThisWeek) && roadmap.nextStepsThisWeek.length > 0 ? (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5 sm:p-6">
                <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-3">Start this week</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-200">
                  {roadmap.nextStepsThisWeek.map((s, i) => (
                    <li key={i} className="pl-1">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
