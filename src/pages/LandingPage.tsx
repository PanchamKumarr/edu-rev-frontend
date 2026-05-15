import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Play, Database, ShieldCheck, Globe, Star, Video, Download, Loader2 } from 'lucide-react';
import { API_BASE } from '../lib/api';
const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group"
  >
    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [vCertId, setVCertId] = useState('');
  const [vName, setVName] = useState('');
  const [vLoading, setVLoading] = useState(false);
  const [vResult, setVResult] = useState<{
    valid: boolean;
    message?: string;
    certificate?: { certId: string; userName: string; courseTitle: string; issuedAt: string };
    certificateFound?: boolean;
    nameMatch?: boolean;
  } | null>(null);
  const [vErr, setVErr] = useState('');

  const runVerify = async () => {
    const id = vCertId.trim().toUpperCase().replace(/\s+/g, '');
    if (!id) {
      setVErr('Enter the certificate ID.');
      return;
    }
    if (!vName.trim()) {
      setVErr('Enter the recipient name as it appears on the certificate.');
      return;
    }
    setVLoading(true);
    setVErr('');
    setVResult(null);
    try {
      const r = await fetch(`${API_BASE}/api/certificates/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId: id, recipientName: vName.trim() }),
      });
      const d = await r.json();
      if (r.status === 404) {
        setVResult({
          valid: false,
          certificateFound: false,
          nameMatch: false,
          message: d.message || 'No certificate found with this ID.',
        });
        return;
      }
      if (!d.success) {
        setVErr(d.message || 'Verification failed');
        return;
      }
      setVResult({
        valid: Boolean(d.valid && d.nameMatch),
        certificateFound: d.certificateFound,
        nameMatch: d.nameMatch,
        certificate: d.certificate,
        message: d.message,
      });
    } catch {
      setVErr('Network error. Try again later.');
    } finally {
      setVLoading(false);
    }
  };

  const vPdfHref =
    vResult?.valid && vResult.certificate
      ? `${API_BASE}/api/certificates/pdf/${encodeURIComponent(vResult.certificate.certId)}?recipientName=${encodeURIComponent(vName.trim())}`
      : '';

  useEffect(() => {
    if (location.hash === '#certificate-verify') {
      requestAnimationFrame(() => {
        document.getElementById('certificate-verify')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (location.hash === '#features') {
      requestAnimationFrame(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.hash]);

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto z-10 relative">
      {/* Hero Section */}
      <section className="relative pb-20 z-10 min-h-screen flex flex-col justify-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles size={14} />
            Revolutionizing Learning with AI
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-[0.85] mb-12 italic skew-x-[-2deg]">
            Personalized <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Education</span> <br />
             at Scale.
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-zinc-400 font-sans leading-relaxed mb-12">
            Powered by the <span className="text-white font-bold">CAROA Engine</span>. We don't just teach modules; we adapt knowledge paths to your cognitive DNA in real-time.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3"
              >
                Go to dashboard
                <ArrowRight size={20} />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3"
              >
                Start learning now
                <ArrowRight size={20} />
              </Link>
            )}
            <Link
              to={{ pathname: '/', hash: 'features' }}
              className="text-zinc-500 hover:text-white flex items-center gap-2 px-8 py-4 transition-colors font-bold uppercase text-xs"
            >
              <Play size={16} fill="currentColor" />
              See CAROA in action
            </Link>
          </div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-24 relative"
        >
            <div className="aspect-video w-full rounded-[40px] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 overflow-hidden shadow-2xl relative">
                <img 
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
                    className="w-full h-full object-cover opacity-50 grayscale"
                    alt="Cyberpunk workspace"
                />
                <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay" />
                <div className="absolute inset-x-0 bottom-0 p-12 flex justify-between items-end bg-gradient-to-t from-black via-black/50 to-transparent">
                    <div>
                        <h4 className="text-2xl font-bold mb-2">Next-Gen Interface</h4>
                        <p className="text-zinc-400 text-sm">Adaptive dashboards for focused progression.</p>
                    </div>
                </div>
            </div>
        </motion.div>
      </section>

      {/* Certificate verification */}
      <section id="certificate-verify" className="relative z-10 -mx-6 border-y border-white/10 bg-gradient-to-b from-indigo-950/30 to-black/40 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-300">
              <ShieldCheck size={30} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white md:text-4xl">Verify a certificate</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
              Employers and schools can confirm an EDU-REV credential is genuine using the certificate ID and the learner&apos;s name.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Certificate ID</label>
                <input
                  value={vCertId}
                  onChange={(e) => setVCertId(e.target.value)}
                  placeholder="EDU-5E0FD1722A04"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Recipient full name</label>
                <input
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="As printed on the certificate"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                />
              </div>
            </div>
            {vErr ? <p className="mt-3 text-sm text-red-400">{vErr}</p> : null}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={runVerify}
                disabled={vLoading}
                className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {vLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Verifying…
                  </span>
                ) : (
                  'Check authenticity'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = vCertId.trim().toUpperCase().replace(/\s+/g, '');
                  if (id) navigate(`/verify/${encodeURIComponent(id)}`);
                }}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-white/10"
              >
                Open verify page
              </button>
            </div>
            {vResult ? (
              <div
                className={`mt-6 rounded-2xl border p-5 text-left ${
                  vResult.valid ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/25 bg-amber-500/10'
                }`}
              >
                <p className="font-bold text-white">{vResult.valid ? 'Genuine' : 'Not verified'}</p>
                <p className="mt-1 text-sm text-zinc-300">{vResult.message}</p>
                {vResult.valid && vResult.certificate ? (
                  <div className="mt-4 space-y-1 text-sm text-zinc-300">
                    <p>
                      <span className="text-zinc-500">Course: </span>
                      {vResult.certificate.courseTitle}
                    </p>
                    <p>
                      <span className="text-zinc-500">Issued: </span>
                      {new Date(vResult.certificate.issuedAt).toLocaleDateString()}
                    </p>
                    {vPdfHref ? (
                      <a
                        href={vPdfHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-zinc-200"
                      >
                        <Download size={16} /> Download PDF
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* AI Statistics Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto z-10 border-t border-white/5 -mx-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-6">
          {[
            { label: "Active Learners", value: "50k+" },
            { label: "Learning Paths", value: "1.2M" },
            { label: "AI Adaptations", value: "5M+" },
            { label: "Avg Score Increase", value: "32%" }
          ].map((stat, idx) => (
            <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="text-4xl font-black italic text-indigo-400 mb-2">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto z-10">
        <div className="mb-20">
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 italic">Core System <br/>Capabilities</h2>
          <div className="w-20 h-2 bg-indigo-600" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Database} 
            title="CAROA AI Core" 
            desc="Cognitive Adaptive Reinforcement Optimization Algorithm. The brain behind your personalized learning path."
            delay={0.1}
          />
          <FeatureCard 
            icon={Video} 
            title="Live Adaptive Classes" 
            desc="Real-time interaction with instructors integrated with attendance and engagement AI analysis."
            delay={0.2}
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="Blockchain Certificates" 
            desc="Immutable, tamper-proof credentials generated with unique IDs and verifiable QR codes."
            delay={0.3}
          />
          <FeatureCard 
            icon={Globe} 
            title="Global Collaboration" 
            desc="Peer-to-peer messaging, discussion forums, and multi-language support for worldwide learning."
            delay={0.4}
          />
          <FeatureCard 
            icon={Star} 
            title="Smart Examination" 
            desc="AI-based grading for both MCQ and subjective answers using advanced similarity techniques."
            delay={0.5}
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="Monetization" 
            desc="Secure payment gateways for premium courses and subscription-based academic tracking."
            delay={0.6}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 max-w-7xl mx-auto z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 italic">What Our <br/>Users Say</h2>
          <div className="w-20 h-2 bg-indigo-600 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
            <p className="text-zinc-300 mb-6">"The adaptive learning paths have transformed my study habits. I'm finally grasping complex topics I struggled with for years."</p>
            <div className="flex items-center gap-4">
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-white">Jessica L.</h4>
                <p className="text-sm text-indigo-400">University Student</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
            <p className="text-zinc-300 mb-6">"As an instructor, the analytics dashboard is a game-changer. I can identify at-risk students and intervene before it's too late."</p>
            <div className="flex items-center gap-4">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-white">David R.</h4>
                <p className="text-sm text-indigo-400">Professor of Physics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 z-10 relative">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-indigo-600 to-purple-600 p-12 rounded-[40px]">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Ready to Revolutionize Your Learning?</h2>
          <p className="text-indigo-200 max-w-2xl mx-auto mb-8">Join thousands of learners and educators who are shaping the future of education. Get started with a personalized path today.</p>
          {user ? (
            <Link
              to="/dashboard"
              className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-zinc-200 hover:scale-105 transition-all flex items-center gap-3 mx-auto"
            >
              Open dashboard
              <ArrowRight size={20} />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-zinc-200 hover:scale-105 transition-all flex items-center gap-3 mx-auto"
            >
              Start your journey
              <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
