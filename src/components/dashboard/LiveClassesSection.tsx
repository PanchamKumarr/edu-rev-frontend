import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video, Plus, Calendar, Clock, Users, ExternalLink, CheckCircle, Loader2, XCircle,
  Pencil, Trash2, Link2, Copy, UserCheck,
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';
import { useConfirm } from '../ConfirmProvider';

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-white placeholder-zinc-500';

interface LiveClass {
  id: string;
  courseId: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  platform: string;
  meetingLink: string;
  status: string;
  attendeeCount: number;
  rsvpCount?: number;
  hasRsvped?: boolean;
}

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LiveClassesSection({ role }: { role: string }) {
  const { confirm, showAlert } = useConfirm();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<LiveClass | null>(null);
  const [attending, setAttending] = useState<string | null>(null);
  const [rsvping, setRsvping] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/liveclasses/my`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setClasses(d.liveClasses); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAttend = async (classId: string, link: string) => {
    if (!link?.trim()) return;
    setAttending(classId);
    try {
      await fetch(`${API_BASE}/api/liveclasses/${classId}/attend`, { method: 'POST', headers: getAuthHeaders() });
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(link, '_blank', 'noopener,noreferrer');
    } finally {
      setAttending(null);
    }
  };

  const handleRsvp = async (classId: string, going: boolean) => {
    setRsvping(classId);
    try {
      const r = await fetch(`${API_BASE}/api/liveclasses/${classId}/rsvp`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ going }),
      });
      const d = await r.json();
      if (d.success) load();
    } catch { /* ignore */ }
    finally { setRsvping(null); }
  };

  const handleDelete = async (cls: LiveClass) => {
    const ok = await confirm({
      title: 'Delete live session',
      message: `Delete live session "${cls.title}"? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      const r = await fetch(`${API_BASE}/api/liveclasses/${cls.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success) load();
      else void showAlert(d.message || 'Could not delete', 'Could not delete');
    } catch {
      void showAlert('Network error. Try again.', 'Error');
    }
  };

  const upcoming = classes.filter(c => new Date(c.scheduledAt) >= new Date());
  const past = classes.filter(c => new Date(c.scheduledAt) < new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={40} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Live Classes</h2>
        {role === 'instructor' && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} /> Schedule class
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Video size={48} className="text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-2">No live classes yet</h3>
          <p className="text-sm text-zinc-600">
            {role === 'instructor' ? 'Schedule your first live class' : "Your instructors haven't scheduled any classes yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 text-zinc-300">Upcoming sessions ({upcoming.length})</h3>
              <div className="space-y-3">
                {upcoming.map((cls, i) => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    index={i}
                    role={role}
                    onAttend={handleAttend}
                    attending={attending}
                    onRsvp={handleRsvp}
                    rsvping={rsvping}
                    onEdit={() => setEditing(cls)}
                    onDelete={() => handleDelete(cls)}
                  />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 text-zinc-400">Past sessions</h3>
              <div className="space-y-3 opacity-70">
                {past.slice(0, 8).map((cls, i) => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    index={i}
                    role={role}
                    onAttend={handleAttend}
                    attending={attending}
                    onRsvp={handleRsvp}
                    rsvping={rsvping}
                    onEdit={() => setEditing(cls)}
                    onDelete={() => handleDelete(cls)}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <LiveClassFormModal
            mode="create"
            onClose={() => setShowCreate(false)}
            onSaved={() => { setShowCreate(false); load(); }}
          />
        )}
        {editing && (
          <LiveClassFormModal
            mode="edit"
            initialClass={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function platformBadge(cls: LiveClass) {
  if (cls.platform === 'zoom') return { label: 'Zoom', className: 'bg-blue-500/20 text-blue-400' };
  if (cls.platform === 'google-meet') return { label: 'Google Meet', className: 'bg-green-500/20 text-green-400' };
  return { label: 'Custom link', className: 'bg-zinc-500/20 text-zinc-300' };
}

function ClassCard({
  cls,
  index,
  role,
  onAttend,
  attending,
  onRsvp,
  rsvping,
  onEdit,
  onDelete,
  isPast,
}: {
  cls: LiveClass;
  index: number;
  role: string;
  onAttend: (id: string, link: string) => void;
  attending: string | null;
  onRsvp: (id: string, going: boolean) => void;
  rsvping: string | null;
  onEdit: () => void;
  onDelete: () => void;
  isPast?: boolean;
}) {
  const isLive = Math.abs(new Date(cls.scheduledAt).getTime() - Date.now()) < 30 * 60 * 1000;
  const scheduled = new Date(cls.scheduledAt);
  const badge = platformBadge(cls);
  const hasLink = Boolean(cls.meetingLink?.trim());
  const isInstructor = role === 'instructor';
  const isStudent = role === 'student';
  const rsvpCount = cls.rsvpCount ?? 0;

  const copyLink = async () => {
    if (!hasLink) return;
    try {
      await navigator.clipboard.writeText(cls.meetingLink);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-zinc-900 border rounded-2xl p-5 transition-all ${
        isLive ? 'border-red-500/40 shadow-lg shadow-red-500/10' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isLive && !isPast && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                LIVE NOW
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
          </div>
          <h3 className="font-bold">{cls.title}</h3>
          {cls.description && <p className="text-sm text-zinc-500 mt-1">{cls.description}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Calendar size={12} /> {scheduled.toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {cls.duration} min</span>
            <span className="flex items-center gap-1"><Users size={12} /> {cls.attendeeCount} joined</span>
            {!isPast && (
              <span className="flex items-center gap-1 text-indigo-300/90">
                <UserCheck size={12} /> {rsvpCount} RSVP{rsvpCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {hasLink && isInstructor && (
            <div className="mt-2 flex items-center gap-2 min-w-0">
              <Link2 size={12} className="text-zinc-600 shrink-0" />
              <span className="text-xs text-zinc-500 truncate">{cls.meetingLink}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:items-end shrink-0">
          {isInstructor && !isPast && (
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={copyLink}
                disabled={!hasLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-40"
              >
                <Copy size={13} /> Copy link
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}

          {!isPast && isStudent && (
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                disabled={rsvping === cls.id}
                onClick={() => onRsvp(cls.id, true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  cls.hasRsvped
                    ? 'bg-green-600/25 text-green-400 ring-1 ring-green-500/30'
                    : 'bg-white/5 hover:bg-green-500/15 text-zinc-300 hover:text-green-300'
                }`}
              >
                {rsvping === cls.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                {cls.hasRsvped ? "You're going" : "RSVP: I'm going"}
              </button>
              {cls.hasRsvped && (
                <button
                  type="button"
                  disabled={rsvping === cls.id}
                  onClick={() => onRsvp(cls.id, false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-400"
                >
                  Can't go
                </button>
              )}
            </div>
          )}

          {!isPast && (
            <button
              type="button"
              onClick={() => onAttend(cls.id, cls.meetingLink)}
              disabled={attending === cls.id || !hasLink}
              title={!hasLink ? 'Add a meeting link (instructor) to enable join' : undefined}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isLive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {attending === cls.id ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              {isLive ? 'Join now' : 'Join meeting'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LiveClassFormModal({
  mode,
  initialClass,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initialClass?: LiveClass;
  onClose: () => void;
  onSaved: () => void;
}) {
  const edit = mode === 'edit' && initialClass;
  const [form, setForm] = useState({
    courseId: edit ? initialClass!.courseId : '',
    title: edit ? initialClass!.title : '',
    description: edit ? initialClass!.description || '' : '',
    scheduledAt: edit ? toDatetimeLocalValue(initialClass!.scheduledAt) : '',
    duration: edit ? initialClass!.duration : 60,
    platform: edit ? (['google-meet', 'zoom', 'custom'].includes(initialClass!.platform) ? initialClass!.platform : 'custom') : 'google-meet',
    meetingLink: edit ? (initialClass!.meetingLink || '') : '',
  });
  const [useCustomLink, setUseCustomLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/courses/my`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setCourses(d.courses); })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.scheduledAt) {
      setError('Title and date/time are required');
      return;
    }
    if (mode === 'create' && !form.courseId) {
      setError('Select a course');
      return;
    }
    if (mode === 'create' && useCustomLink && !form.meetingLink.trim()) {
      setError('Paste a meeting link, or turn off custom link to auto-generate');
      return;
    }
    if (mode === 'edit' && !form.meetingLink.trim()) {
      setError('Meeting link is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (mode === 'create') {
        const body: Record<string, unknown> = {
          courseId: form.courseId,
          title: form.title.trim(),
          description: form.description.trim(),
          scheduledAt: form.scheduledAt,
          duration: form.duration,
          platform: useCustomLink ? 'custom' : form.platform,
        };
        if (useCustomLink && form.meetingLink.trim()) body.meetingLink = form.meetingLink.trim();

        const r = await fetch(`${API_BASE}/api/liveclasses`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (d.success) onSaved();
        else setError(d.message || 'Could not schedule');
      } else if (initialClass) {
        const body: Record<string, unknown> = {
          title: form.title.trim(),
          description: form.description.trim(),
          scheduledAt: form.scheduledAt,
          duration: form.duration,
          platform: form.platform,
          meetingLink: form.meetingLink.trim(),
        };
        const r = await fetch(`${API_BASE}/api/liveclasses/${initialClass.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (d.success) onSaved();
        else setError(d.message || 'Could not update');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">{mode === 'create' ? 'Schedule live class' : 'Edit live class'}</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {mode === 'create' && (
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Course *</label>
              <select
                value={form.courseId}
                onChange={e => { setError(''); setForm(f => ({ ...f, courseId: e.target.value })); }}
                className={inputCls}
              >
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Session title *</label>
            <input
              value={form.title}
              onChange={e => { setError(''); setForm(f => ({ ...f, title: e.target.value })); }}
              className={inputCls}
              placeholder="e.g. Week 3 lecture"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => { setError(''); setForm(f => ({ ...f, description: e.target.value })); }}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 block mb-1.5">Date & time *</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => { setError(''); setForm(f => ({ ...f, scheduledAt: e.target.value })); }}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Duration (min)</label>
              <input
                type="number"
                min={15}
                step={5}
                value={form.duration}
                onChange={e => { setError(''); setForm(f => ({ ...f, duration: Number(e.target.value) })); }}
                className={inputCls}
              />
            </div>
          </div>

          {mode === 'create' ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={useCustomLink}
                  onChange={e => {
                    setError('');
                    setUseCustomLink(e.target.checked);
                    if (!e.target.checked) setForm(f => ({ ...f, meetingLink: '' }));
                  }}
                  className="rounded border-white/20 bg-zinc-900 text-indigo-600"
                />
                Use my own meeting link (Zoom, Meet, Teams, etc.)
              </label>
              {!useCustomLink && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Auto-generated platform</label>
                  <select
                    value={form.platform}
                    onChange={e => { setError(''); setForm(f => ({ ...f, platform: e.target.value })); }}
                    className={inputCls}
                  >
                    <option value="google-meet">Google Meet style</option>
                    <option value="zoom">Zoom style</option>
                  </select>
                  <p className="text-[11px] text-zinc-600 mt-1.5">A placeholder link is created. Replace with a real link anytime using Edit.</p>
                </div>
              )}
              {useCustomLink && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Meeting link *</label>
                  <input
                    value={form.meetingLink}
                    onChange={e => { setError(''); setForm(f => ({ ...f, meetingLink: e.target.value })); }}
                    className={inputCls}
                    placeholder="https://zoom.us/j/… or https://meet.google.com/…"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Platform label</label>
                <select
                  value={form.platform}
                  onChange={e => { setError(''); setForm(f => ({ ...f, platform: e.target.value })); }}
                  className={inputCls}
                >
                  <option value="google-meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="custom">Custom / other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Meeting link *</label>
                <input
                  value={form.meetingLink}
                  onChange={e => { setError(''); setForm(f => ({ ...f, meetingLink: e.target.value })); }}
                  className={inputCls}
                  placeholder="https://…"
                />
              </div>
            </div>
          )}

          {error && <div className="bg-red-500/10 text-red-400 rounded-xl p-3 text-sm">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
              {loading ? 'Saving…' : mode === 'create' ? 'Schedule' : 'Save changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
