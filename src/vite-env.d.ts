/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** ServeNCare-style Web client ID (preferred). */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Legacy alias — same value as VITE_GOOGLE_CLIENT_ID. */
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID?: string;
  readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
