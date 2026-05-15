import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './components/AuthProvider';
import { ConfirmProvider } from './components/ConfirmProvider';
import { I18nProvider } from './lib/i18n';

const googleClientIdRaw =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || '';
const googleClientId = typeof googleClientIdRaw === 'string' ? googleClientIdRaw.trim() : '';

const tree = (
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(
  googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider> : tree
);
