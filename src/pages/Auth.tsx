import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CredentialResponse } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
import { API_BASE } from '../lib/api';
import { useAuth } from '../components/AuthProvider';

const googleEnvClientId = String(
  import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || ''
).trim();
const hasGoogleClientId = Boolean(googleEnvClientId);

export function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student' as 'student' | 'instructor' | 'admin'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse?.credential) {
        setError('Could not complete Google sign-in.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const body: { credential: string; role?: string } = {
          credential: credentialResponse.credential
        };
        if (!isLogin) {
          body.role = formData.role;
        }

        const res = await fetch(`${API_BASE}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Google sign-in failed');
        }

        login(data.token, data.user);
        navigate('/dashboard');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    [navigate, login, isLogin, formData.role]
  );

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="bg-black text-white selection:bg-indigo-500 selection:text-white overflow-x-hidden min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold skew-x-[-10deg]">E</div>
          <span className="font-bold tracking-tighter uppercase text-lg">EDU-REV</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-zinc-400 hover:text-white transition-colors font-medium uppercase tracking-tight text-sm"
        >
          Back to Home
        </button>
      </nav>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 mx-auto w-fit"
            >
              <Sparkles size={14} />
              {isLogin ? 'Welcome Back' : 'Join the Revolution'}
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 italic">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {isLogin
                ? 'Enter your credentials to access your learning path'
                : 'Join EDU-REV and start your personalized learning journey'}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-6"
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-semibold text-white mb-2">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-3.5 text-zinc-500" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-black/70 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-3.5 text-zinc-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-black/70 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-3.5 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-black/70 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-semibold text-white mb-2">I'm a</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-black/70 transition-colors"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm group"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-zinc-500 uppercase font-bold">Or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="w-full flex flex-col items-center gap-3">
              {hasGoogleClientId ? (
                <div className={`w-full max-w-[400px] ${loading ? 'pointer-events-none opacity-50' : ''}`}>
                  <div className="google-login-wrapper flex justify-center [&>div]:w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="filled_black"
                      size="large"
                      text="continue_with"
                      shape="rectangular"
                      width="100%"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-500 text-center leading-relaxed">
                  Set <code className="text-zinc-400">VITE_GOOGLE_CLIENT_ID</code> (ServeNCare-style) or{' '}
                  <code className="text-zinc-400">VITE_GOOGLE_OAUTH_CLIENT_ID</code> in Frontend{' '}
                  <code className="text-zinc-400">.env</code> to match backend{' '}
                  <code className="text-zinc-400">GOOGLE_CLIENT_ID</code> /{' '}
                  <code className="text-zinc-400">GOOGLE_OAUTH_CLIENT_ID</code>, then restart Vite.
                </p>
              )}
              {import.meta.env.DEV && hasGoogleClientId ? (
                // <p className="text-[10px] text-zinc-500 text-center max-w-sm leading-snug">
                //   API calls use same-origin <code className="text-zinc-400">/api</code> (Vite proxy). Add this origin in
                //   Google Cloud → Authorized JavaScript origins:
                //   <span className="text-zinc-300 font-mono block mt-1 break-all select-all">
                //     {typeof window !== 'undefined' ? window.location.origin : ''}
                //   </span>
                //   <span className="block mt-1 text-zinc-600">
                //     Only the Web client ID is required—do not put the OAuth client secret in .env or the browser.
                //   </span>
                // </p>
                <p></p>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-zinc-400 text-sm"
          >
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-zinc-600 mt-8"
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
