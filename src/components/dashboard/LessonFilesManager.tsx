import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, FileText, Image, File, Trash2, Loader2,
  Download, ExternalLink, X, CheckCircle
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';
import { useConfirm } from '../ConfirmProvider';

interface LessonFile {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

interface Props {
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
  canUpload?: boolean; // instructor/admin only
}

function getFileIcon(mimetype: string) {
  if (mimetype.startsWith('image/')) return <Image size={16} className="text-blue-400" />;
  if (mimetype === 'application/pdf') return <FileText size={16} className="text-red-400" />;
  if (mimetype.includes('word')) return <FileText size={16} className="text-blue-500" />;
  if (mimetype.includes('sheet') || mimetype.includes('excel')) return <FileText size={16} className="text-green-400" />;
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return <FileText size={16} className="text-orange-400" />;
  return <File size={16} className="text-zinc-400" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LessonFilesManager({ courseId, lessonId, lessonTitle, canUpload = false }: Props) {
  const { confirm } = useConfirm();
  const [files, setFiles] = useState<LessonFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/lesson-files/${courseId}/lessons/${lessonId}/files`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(d => { if (d.success) setFiles(d.files); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [courseId, lessonId]);

  const uploadFiles = async (fileList: FileList) => {
    if (!fileList.length) return;
    setUploading(true);
    setMsg(null);

    const fd = new FormData();
    Array.from(fileList).forEach(f => fd.append('files', f));

    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${API_BASE}/api/lesson-files/${courseId}/lessons/${lessonId}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (d.success) {
        setMsg({ type: 'success', text: `${d.files.length} file(s) uploaded` });
        load();
      } else {
        setMsg({ type: 'error', text: d.message || 'Upload failed' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    const ok = await confirm({
      title: 'Delete file',
      message: 'Delete this file from the lesson? Learners will no longer be able to download it.',
      variant: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    setDeleting(filename);
    try {
      const r = await fetch(`${API_BASE}/api/lesson-files/${courseId}/lessons/${lessonId}/files/${filename}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const d = await r.json();
      if (d.success) setFiles(prev => prev.filter(f => f.filename !== filename));
    } finally { setDeleting(null); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  if (loading) return <div className="flex items-center gap-2 py-3 text-zinc-500 text-sm"><Loader2 size={14} className="animate-spin" /> Loading files...</div>;

  return (
    <div className="space-y-3">
      {lessonTitle && <h4 className="text-sm font-bold text-zinc-300">📎 Files — {lessonTitle}</h4>}

      {/* Upload Zone (instructor only) */}
      {canUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <Loader2 size={18} className="animate-spin text-indigo-400" /> Uploading...
            </div>
          ) : (
            <>
              <Upload size={24} className="text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Drop files here or <span className="text-indigo-400 font-medium">click to browse</span></p>
              <p className="text-xs text-zinc-600 mt-1">PDF, Word, Excel, PowerPoint, Images, ZIP — max 20 MB each</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.txt,.csv,.zip"
            className="hidden"
            onChange={e => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      )}

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {msg.type === 'success' ? <CheckCircle size={14} /> : <X size={14} />}
          {msg.text}
        </div>
      )}

      {/* Files List */}
      {files.length === 0 ? (
        <p className="text-xs text-zinc-600 italic">{canUpload ? 'No files uploaded yet' : 'No files available for this lesson'}</p>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {files.map((file, i) => (
              <motion.div key={file.filename} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 group transition-all"
              >
                <div className="flex-shrink-0">{getFileIcon(file.mimetype)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.originalName}</p>
                  <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {file.mimetype.startsWith('image/') ? (
                    <a href={`${API_BASE}${file.url}`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      title="View"
                    >
                      <ExternalLink size={14} />
                    </a>
                  ) : null}
                  <a href={`${API_BASE}${file.url}`} download={file.originalName}
                    className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-all"
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                  {canUpload && (
                    <button onClick={() => handleDelete(file.filename)} disabled={deleting === file.filename}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      {deleting === file.filename ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
