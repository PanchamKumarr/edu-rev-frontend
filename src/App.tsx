import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
import { CertificateVerifyPage } from './pages/CertificateVerifyPage';
import { LandingPage } from './pages/LandingPage';
import { Auth } from './pages/Auth';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { Contact } from './pages/Contact';
import { DashboardLayout } from './pages/DashboardPage';
import { AIMCQAttemptDetailPage } from './pages/AIMCQAttemptDetailPage';
import { AssignmentResultPage } from './pages/AssignmentResultPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

const navMuted =
  'text-sm font-medium text-zinc-400 hover:text-white transition-colors';

// Public Layout Component with Navigation
function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="bg-black text-white selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold skew-x-[-10deg]">E</div>
          <span className="font-bold tracking-tighter uppercase text-lg">EDU-REV</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm font-medium text-zinc-400">
          <Link to="/" className={navMuted}>
            Home
          </Link>
          <Link to={{ pathname: '/', hash: 'certificate-verify' }} className={navMuted}>
            Verify cert
          </Link>
          <Link to="/about" className={navMuted}>
            About
          </Link>
          <Link to="/services" className={navMuted}>
            Services
          </Link>
          <Link to="/contact" className={navMuted}>
            Contact
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="bg-white text-black px-6 py-2 rounded-full hover:bg-zinc-200 transition-colors font-bold uppercase tracking-tight text-xs"
              >
                Dashboard
              </Link>
              {user.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-tight text-white hover:bg-white/10 transition-colors"
                >
                  Admin
                </Link>
              ) : null}
            </div>
          ) : (
            <Link
              to="/auth"
              className="bg-white text-black px-6 py-2 rounded-full hover:bg-zinc-200 transition-colors font-bold uppercase tracking-tight text-xs"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </nav>
      
      {/* Content */}
      <div className="relative z-10 pt-0">
        {children}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-12 px-6 text-center text-zinc-500 text-sm">
        <p>&copy; 2026 EDU-REV. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="text-indigo-600 animate-spin" size={48} />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

// Main App Component with Routing
export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="text-indigo-600 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/home" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/verify/:certId" element={<PublicLayout><CertificateVerifyPage /></PublicLayout>} />
        <Route path="/auth" element={<Auth />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard/assignments/result/:submissionId"
          element={
            <ProtectedRoute>
              <AssignmentResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/ai-mcq-result/:attemptId"
          element={
            <ProtectedRoute>
              <AIMCQAttemptDetailPage />
            </ProtectedRoute>
          }
        />
        {/* Dashboard with optional section segment */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/:section"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
