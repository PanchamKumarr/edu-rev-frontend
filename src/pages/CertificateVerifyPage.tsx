import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Award, ArrowLeft, Download, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { API_BASE } from '../lib/api';

type VerifyResult = {
  valid: boolean;
  certificateFound?: boolean;
  nameMatch?: boolean;
  certificate?: {
    certId: string;
    userName: string;
    courseTitle: string;
    issuedAt: string;
    qrData?: string;
  };
  message?: string;
};

function normalizeCertInput(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function CertificateVerifyPage() {
  const { certId: certIdParam } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialId = useMemo(() => decodeURIComponent(certIdParam || ''), [certIdParam]);
  const presetName = (location.state as { recipientName?: string } | null)?.recipientName;

  const [certId, setCertId] = useState(initialId);
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setCertId(decodeURIComponent(certIdParam || ''));
  }, [certIdParam]);

  useEffect(() => {
    if (presetName) setRecipientName(presetName);
  }, [presetName]);

  const verify = async () => {
    const id = normalizeCertInput(certId);
    if (!id) {
      setError('Enter a certificate ID (for example EDU-5E0FD1722A04).');
      return;
    }
    if (!recipientName.trim()) {
      setError('Enter the recipient name exactly as it appears on the certificate.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch(`${API_BASE}/api/certificates/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId: id, recipientName: recipientName.trim() }),
      });
      const d = await r.json();
      if (r.status === 404) {
        setResult({
          valid: false,
          certificateFound: false,
          nameMatch: false,
          message: d.message || 'No certificate found with this ID.',
        });
        return;
      }
      if (!d.success) {
        setError(d.message || 'Verification failed');
        return;
      }
      setResult({
        valid: Boolean(d.valid && d.nameMatch),
        certificateFound: d.certificateFound,
        nameMatch: d.nameMatch,
        certificate: d.certificate,
        message: d.message,
      });
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const pdfHref =
    result?.valid && result.certificate
      ? `${API_BASE}/api/certificates/pdf/${encodeURIComponent(result.certificate.certId)}?recipientName=${encodeURIComponent(recipientName.trim())}`
      : '';

  return (
    <div className="min-h-[calc(100vh-8rem)] px-6 pb-20 pt-28 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to home
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-10 backdrop-blur-xl"
      >
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-300">
            <Award size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">EDU-REV</p>
            <h1 className="text-2xl font-black tracking-tight text-white">Verify certificate</h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Enter the certificate ID and the recipient&apos;s full name as printed on the credential. We confirm both
              match our issuance records.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Certificate ID
            </label>
            <input
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="EDU-5E0FD1722A04"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Recipient name
            </label>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Full name as shown on certificate"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <button
          type="button"
          onClick={verify}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Checking…
            </span>
          ) : (
            'Verify authenticity'
          )}
        </button>

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 rounded-2xl border p-5 sm:p-6 ${
              result.valid
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : result.certificateFound && result.nameMatch === false
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : 'border-red-500/25 bg-red-500/10'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.valid ? (
                <ShieldCheck className="shrink-0 text-emerald-400" size={28} />
              ) : (
                <ShieldAlert className="shrink-0 text-amber-400" size={28} />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white">
                  {result.valid ? 'Genuine certificate' : 'Could not verify'}
                </h2>
                <p className="mt-1 text-sm text-zinc-300">{result.message}</p>

                {result.valid && result.certificate ? (
                  <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                    <li>
                      <span className="text-zinc-500">Recipient: </span>
                      <span className="font-semibold text-white">{result.certificate.userName}</span>
                    </li>
                    <li>
                      <span className="text-zinc-500">Course: </span>
                      <span className="text-white">{result.certificate.courseTitle}</span>
                    </li>
                    <li>
                      <span className="text-zinc-500">Certificate ID: </span>
                      <span className="font-mono text-amber-200/90">{result.certificate.certId}</span>
                    </li>
                    <li>
                      <span className="text-zinc-500">Issued: </span>
                      {new Date(result.certificate.issuedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </li>
                  </ul>
                ) : null}

                {result.valid && pdfHref ? (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={pdfHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-zinc-200"
                    >
                      <Download size={18} /> Download PDF
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </motion.div>

      <p className="mx-auto mt-8 max-w-lg text-center text-xs text-zinc-600">
        Official verification is performed by EDU-REV only through this site. If someone shares a PDF, compare the ID
        and name here before trusting it.
      </p>
    </div>
  );
}
