import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCheck, Loader2, BookOpen, Award, Video, FileText, CreditCard, MessageSquare } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: string;
}

const typeIcon: Record<string, React.ReactNode> = {
  assignment: <FileText size={14} className="text-blue-400" />,
  grade: <Award size={14} className="text-green-400" />,
  certificate: <Award size={14} className="text-amber-400" />,
  liveclass: <Video size={14} className="text-purple-400" />,
  enrollment: <BookOpen size={14} className="text-indigo-400" />,
  payment: <CreditCard size={14} className="text-emerald-400" />,
  reply: <MessageSquare size={14} className="text-cyan-400" />,
};

export function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`${API_BASE}/api/notifications?limit=20`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setNotifications(d.notifications);
          setUnreadCount(d.unreadCount);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [isOpen]);

  const markRead = async (id: string) => {
    await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'PUT', headers: getAuthHeaders() });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch(`${API_BASE}/api/notifications/read-all`, { method: 'PUT', headers: getAuthHeaders() });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id: string) => {
    await fetch(`${API_BASE}/api/notifications/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.read) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-96 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-indigo-400" />
                <span className="font-bold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <CheckCheck size={12} /> All read
                  </button>
                )}
                <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 hover:bg-white/10 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={32} className="text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => (
                    <div key={n.id}
                      className={`flex gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group ${!n.read ? 'bg-indigo-500/5' : ''}`}
                      onClick={() => !n.read && markRead(n.id)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                        {typeIcon[n.type] || <Bell size={14} className="text-zinc-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${!n.read ? 'text-white' : 'text-zinc-300'}`}>{n.title}</p>
                        <p className="text-xs text-zinc-500 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-zinc-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {!n.read && <div className="w-2 h-2 bg-indigo-400 rounded-full" />}
                        <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Badge component for the bell icon
export function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => {
      fetch(`${API_BASE}/api/notifications?limit=1`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(d => { if (d.success) setCount(d.unreadCount); })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return count > 0 ? (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  ) : null;
}
