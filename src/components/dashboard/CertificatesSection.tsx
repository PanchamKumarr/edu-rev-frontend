import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Award, Download, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';

interface Certificate {
  id: string;
  certId: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  issuedAt: string;
  qrData: string;
}

export function CertificatesSection() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [eligibility, setEligibility] = useState<Record<string, {
    progress: number;
    progressOk: boolean;
    assignmentsOk: boolean;
    pendingAssignments: { title: string; assignmentId: string }[];
    canGenerate: boolean;
  }>>({});

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/certificates/my`, { headers: getAuthHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/api/enrollments`, { headers: getAuthHeaders() }).then(r => r.json()),
    ]).then(([c, e]) => {
      if (c.success) setCertificates(c.certificates);
      if (e.success) setEnrollments(e.enrollments);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ids = enrollments
      .filter((enr: any) => !certificates.some((cert) => cert.courseId === enr.courseId))
      .map((enr: any) => enr.courseId as string);
    if (!ids.length) {
      setEligibility({});
      return;
    }
    let cancelled = false;
    Promise.all(
      ids.map(async (courseId: string) => {
        try {
          const r = await fetch(`${API_BASE}/api/certificates/eligibility/${encodeURIComponent(courseId)}`, {
            headers: getAuthHeaders(),
          });
          const d = await r.json();
          if (!d.success) return { courseId, data: null };
          return {
            courseId,
            data: {
              progress: d.progress,
              progressOk: d.progressOk,
              assignmentsOk: d.assignmentsOk,
              pendingAssignments: d.pendingAssignments || [],
              canGenerate: d.canGenerate,
            },
          };
        } catch {
          return { courseId, data: null };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, {
        progress: number;
        progressOk: boolean;
        assignmentsOk: boolean;
        pendingAssignments: { title: string; assignmentId: string }[];
        canGenerate: boolean;
      }> = {};
      for (const { courseId, data } of results) {
        if (data) next[courseId] = data;
      }
      setEligibility(next);
    });
    return () => { cancelled = true; };
  }, [enrollments, certificates]);

  const generate = async (courseId: string) => {
    setGenerating(courseId);
    setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/certificates/generate/${courseId}`, {
        method: 'POST', headers: getAuthHeaders(),
      });
      const d = await r.json();
      if (d.success) {
        setMsg({ type: 'success', text: d.alreadyIssued ? 'Certificate already issued!' : '🎉 Certificate generated successfully!' });
        load();
      } else {
        setMsg({ type: 'error', text: d.message || 'Failed to generate certificate' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' });
    } finally {
      setGenerating(null);
    }
  };

  const certifiedIds = new Set(certificates.map(c => c.courseId));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={40} className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Certificates</h2>
        <p className="text-sm text-zinc-500 mt-1">Earn certificates by completing courses</p>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Earned Certificates */}
      {certificates.length > 0 && (
        <div>
          <h3 className="font-bold mb-3 text-zinc-300">Earned Certificates ({certificates.length})</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {certificates.map((cert, i) => (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-gradient-to-br from-amber-600/20 to-yellow-600/10 border border-amber-500/30 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Award size={24} className="text-amber-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-amber-400/70 bg-amber-500/10 px-2 py-1 rounded">{cert.certId}</div>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1">{cert.courseTitle}</h3>
                <p className="text-sm text-zinc-400 mb-1">Awarded to: <span className="text-white font-medium">{cert.userName}</span></p>
                <p className="text-xs text-zinc-500 mb-4">Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/verify/${encodeURIComponent(cert.certId)}`, {
                        state: { recipientName: cert.userName },
                      })
                    }
                    className="flex-1 min-w-[100px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <Shield size={12} /> View
                  </button>
                  <a
                    href={`${API_BASE}/api/certificates/pdf/${encodeURIComponent(cert.certId)}?recipientName=${encodeURIComponent(cert.userName)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-[100px] bg-white/10 hover:bg-white/15 text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download size={12} /> PDF
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available to Claim */}
      {enrollments.length > 0 && (
        <div>
          <h3 className="font-bold mb-3 text-zinc-300">Claim Certificates</h3>
          <div className="space-y-3">
            {enrollments.map((enr: any, i: number) => {
              const hasCert = certifiedIds.has(enr.courseId);
              const elig = eligibility[enr.courseId];
              const canClaim = hasCert || (elig?.canGenerate ?? false);
              const blockReason = !hasCert && elig && !elig.canGenerate
                ? [
                    !elig.progressOk ? `Finish lessons (${elig.progress ?? enr.progress ?? 0}% complete)` : null,
                    !elig.assignmentsOk && (elig.pendingAssignments?.length)
                      ? `Assignments: ${elig.pendingAssignments.map((p: { title: string }) => p.title).join(', ')}`
                      : !elig.assignmentsOk ? 'Pass all course assignments' : null,
                  ].filter(Boolean).join(' · ')
                : '';
              return (
                <motion.div key={enr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-zinc-900 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{enr.course?.title || 'Course'}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${enr.progress || 0}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{enr.progress || 0}%</span>
                    </div>
                    {!hasCert && blockReason && (
                      <p className="text-xs text-amber-400/90 mt-2 leading-snug">{blockReason}</p>
                    )}
                  </div>
                  {hasCert ? (
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-medium">
                      <CheckCircle size={16} /> Earned
                    </div>
                  ) : (
                    <button
                      onClick={() => generate(enr.courseId)}
                      disabled={generating === enr.courseId || !canClaim}
                      title={!canClaim ? (blockReason || 'Checking requirements…') : 'Generate certificate'}
                      className="bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      {generating === enr.courseId ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />}
                      {!elig && (enr.progress || 0) >= 100 ? 'Checking…' : (enr.progress || 0) < 100 ? `${enr.progress || 0}% done` : !canClaim ? 'Requirements' : 'Get Certificate'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {enrollments.length === 0 && certificates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Award size={48} className="text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-2">No certificates yet</h3>
          <p className="text-sm text-zinc-600">Enroll in courses and complete them to earn certificates</p>
        </div>
      )}
    </div>
  );
}
