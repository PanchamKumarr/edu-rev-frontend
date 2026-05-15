import React, { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  /** Single OK button (replaces browser `alert` for notices). */
  alert?: boolean;
};

type Pending = (ConfirmOptions & { resolve: (confirmed: boolean) => void }) | null;

const ConfirmContext = createContext<{
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  showAlert: (message: string, title?: string) => Promise<void>;
} | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, alert: false, resolve });
    });
  }, []);

  const showAlert = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setPending({
        title: title || 'Notice',
        message,
        alert: true,
        variant: 'default',
        resolve: () => {
          resolve();
        },
      });
    });
  }, []);

  const finish = (value: boolean) => {
    if (pending) {
      pending.resolve(value);
      setPending(null);
    }
  };

  const isAlert = !!pending?.alert;
  const variant = pending?.variant === 'danger' ? 'danger' : 'default';
  const title = pending?.title || (isAlert ? 'Notice' : 'Please confirm');

  return (
    <ConfirmContext.Provider value={{ confirm, showAlert }}>
      {children}
      <AnimatePresence>
        {pending ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isAlert) finish(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`px-5 pt-5 pb-3 ${variant === 'danger' ? 'border-b border-red-500/20 bg-red-500/5' : 'border-b border-white/10 bg-white/[0.03]'}`}
              >
                <div className="flex items-start gap-3">
                  {variant === 'danger' && !isAlert ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                      <AlertTriangle size={20} />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h2 id="confirm-dialog-title" className="text-lg font-bold text-white leading-tight">
                      {title}
                    </h2>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p id="confirm-dialog-desc" className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {pending.message}
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-white/10 bg-black/30 px-5 py-4 sm:flex-row sm:justify-end">
                {isAlert ? (
                  <button
                    type="button"
                    onClick={() => finish(true)}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-500 sm:w-auto"
                  >
                    OK
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => finish(false)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 sm:w-auto"
                    >
                      {pending.cancelLabel || 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => finish(true)}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors sm:w-auto ${
                        variant === 'danger'
                          ? 'bg-red-600 hover:bg-red-500'
                          : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      {pending.confirmLabel || 'Confirm'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
