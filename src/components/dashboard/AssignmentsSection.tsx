import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Loader2, Trash2, Users, Award, Pencil, BookOpen, RotateCcw
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

const inputCls = 'w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-white placeholder-zinc-500';
const selectCls = 'w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-white [color-scheme:dark]';

interface Question {
  question: string;
  type: 'mcq' | 'subjective';
  options?: string[];
  correctAnswer?: number;
  modelAnswer?: string;
  explanation?: string;
}

interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: string;
  questions: Question[];
  dueDate: string | null;
  maxScore: number;
  passingScore: number;
  submissionCount: number;
  courseTitle?: string;
  submission?: {
    id?: string;
    score?: number;
    status: string;
    percentage: number;
    feedback: string;
    submittedAt: string;
    passed?: boolean;
  } | null;
}

interface Props {
  user: any;
  role: string;
  selectedCourseId?: string;
  /** When true, omit main page heading (e.g. inside course modal tab). */
  embedded?: boolean;
}

export function AssignmentsSection({ user, role, selectedCourseId, embedded }: Props) {
  const { t } = useI18n();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [submissionsFor, setSubmissionsFor] = useState<Assignment | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const showByCourse = !embedded && !selectedCourseId;

  const courseOptions = useMemo(() => {
    const m = new Map<string, string>();
    assignments.forEach((a) => {
      m.set(a.courseId, a.courseTitle || 'Course');
    });
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (!showByCourse || courseFilter === 'all') return assignments;
    return assignments.filter((a) => a.courseId === courseFilter);
  }, [assignments, courseFilter, showByCourse]);

  const groupedByCourse = useMemo(() => {
    if (!showByCourse) return null;
    const map = new Map<string, Assignment[]>();
    filteredAssignments.forEach((a) => {
      const cur = map.get(a.courseId);
      if (cur) cur.push(a);
      else map.set(a.courseId, [a]);
    });
    return Array.from(map.entries())
      .map(([courseId, items]) => ({
        courseId,
        title: items[0]?.courseTitle || 'Course',
        items,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredAssignments, showByCourse]);

  const load = () => {
    setLoading(true);
    const url = selectedCourseId
      ? `${API_BASE}/api/assignments?courseId=${encodeURIComponent(selectedCourseId)}`
      : role === 'instructor'
        ? `${API_BASE}/api/assignments/my`
        : `${API_BASE}/api/assignments/my`;
    fetch(url, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setAssignments(d.assignments); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [role, selectedCourseId]);

  if (loading) return <Spinner />;

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-6'}>
      {embedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1 min-w-0">
            {assignments[0]?.courseTitle ? (
              <p className="text-xs font-semibold text-indigo-300/90 flex items-center gap-1.5 truncate">
                <BookOpen size={14} className="shrink-0" />
                {assignments[0].courseTitle}
              </p>
            ) : null}
            <p className="text-sm text-zinc-500">
              {role === 'instructor'
                ? 'Quizzes and exams linked to this course. Students open them from the course player under Assignments.'
                : 'Complete every assignment with a passing score to unlock your certificate for this course.'}
            </p>
          </div>
          {role === 'instructor' && (
            <button onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shrink-0"
            >
              <Plus size={16} /> New assignment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('assignments')}</h2>
              {showByCourse ? (
                <p className="text-sm text-zinc-500 mt-1 max-w-2xl">{t('assignmentsByCourseHint')}</p>
              ) : null}
            </div>
            {role === 'instructor' && (
              <button onClick={() => setShowCreate(true)}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 self-start"
              >
                <Plus size={16} /> New Assignment
              </button>
            )}
          </div>
          {showByCourse && courseOptions.length > 1 ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 max-w-xl">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
                {t('assignmentsFilterLabel')}
              </label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className={selectCls}
              >
                <option value="all">{t('assignmentsFilterAll')}</option>
                {courseOptions.map(([cid, title]) => (
                  <option key={cid} value={cid}>{title}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      )}

      {assignments.length === 0 ? (
        <Empty icon={<FileText size={48} />} title="No assignments yet"
          desc={role === 'instructor' ? 'Create your first assignment' : 'No assignments available'}
        />
      ) : filteredAssignments.length === 0 ? (
        <Empty icon={<FileText size={48} />} title="No assignments in this course"
          desc="Try choosing “All courses” or another course from the filter."
        />
      ) : showByCourse && groupedByCourse ? (
        <div className="space-y-8">
          {groupedByCourse.map((group) => (
            <section key={group.courseId} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 min-w-0">
                  <BookOpen size={18} className="text-indigo-400 shrink-0" />
                  <span className="truncate">{group.title}</span>
                </h3>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {t('assignmentsCountInCourse').replace('{n}', String(group.items.length))}
                </span>
              </div>
              <div className="space-y-3">
                {group.items.map((asgn, i) => (
                  <AssignmentCard
                    key={asgn.id}
                    assignment={asgn}
                    role={role}
                    index={i}
                    showCourseChip={false}
                    onTake={() => setActiveAssignment(asgn)}
                    onEdit={role === 'instructor' ? () => setEditingAssignment(asgn) : undefined}
                    onViewSubmissions={role === 'instructor' ? () => setSubmissionsFor(asgn) : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((asgn, i) => (
            <AssignmentCard
              key={asgn.id}
              assignment={asgn}
              role={role}
              index={i}
              showCourseChip={Boolean(showByCourse && asgn.courseTitle)}
              onTake={() => setActiveAssignment(asgn)}
              onEdit={role === 'instructor' ? () => setEditingAssignment(asgn) : undefined}
              onViewSubmissions={role === 'instructor' ? () => setSubmissionsFor(asgn) : undefined}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeAssignment && (
          <TakeAssignmentModal assignment={activeAssignment}
            onClose={() => setActiveAssignment(null)} onSubmit={load}
          />
        )}
        {showCreate && role === 'instructor' && (
          <CreateAssignmentModal
            selectedCourseId={selectedCourseId}
            embedded={embedded}
            editingAssignment={null}
            onClose={() => setShowCreate(false)}
            onSaved={() => { setShowCreate(false); load(); }}
          />
        )}
        {editingAssignment && role === 'instructor' && (
          <CreateAssignmentModal
            selectedCourseId={selectedCourseId || editingAssignment.courseId}
            embedded={embedded}
            editingAssignment={editingAssignment}
            onClose={() => setEditingAssignment(null)}
            onSaved={() => { setEditingAssignment(null); load(); }}
          />
        )}
        {submissionsFor && role === 'instructor' && (
          <SubmissionsModal assignment={submissionsFor} onClose={() => setSubmissionsFor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AssignmentCard({
  assignment,
  role,
  index,
  showCourseChip = true,
  onTake,
  onEdit,
  onViewSubmissions,
}: {
  assignment: Assignment;
  role: string;
  index: number;
  showCourseChip?: boolean;
  onTake: () => void;
  onEdit?: () => void;
  onViewSubmissions?: () => void;
}) {
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const submitted = assignment.submission;
  const passThreshold = assignment.passingScore ?? 50;
  const displayPassed = submitted
    ? (submitted.passed === true
      || (typeof submitted.score === 'number' && submitted.score >= passThreshold))
    : false;
  const canRetake =
    role !== 'instructor' &&
    !!submitted &&
    !displayPassed &&
    !(assignment.dueDate && new Date(assignment.dueDate) < new Date());

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="bg-zinc-900 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              assignment.type === 'mcq' ? 'bg-blue-500/20 text-blue-400' :
              assignment.type === 'subjective' ? 'bg-purple-500/20 text-purple-400' :
              'bg-indigo-500/20 text-indigo-400'
            }`}>{assignment.type.toUpperCase()}</span>
            {showCourseChip && assignment.courseTitle ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-700/50 text-zinc-300 max-w-[180px] truncate" title={assignment.courseTitle}>
                {assignment.courseTitle}
              </span>
            ) : null}
            {isOverdue && !submitted && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Overdue</span>}
          </div>
          <h3 className="font-bold">{assignment.title}</h3>
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{assignment.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><FileText size={12} />{assignment.questions.length} questions</span>
            <span className="flex items-center gap-1"><Award size={12} />{assignment.maxScore} pts (pass {assignment.passingScore})</span>
            {assignment.dueDate && <span className="flex items-center gap-1"><Clock size={12} />{new Date(assignment.dueDate).toLocaleDateString()}</span>}
            {role === 'instructor' && <span className="flex items-center gap-1"><Users size={12} />{assignment.submissionCount} submitted</span>}
          </div>
        </div>

        <div className="flex-shrink-0">
          {submitted ? (
            <div className="text-right flex flex-col items-end gap-2">
              <div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                  displayPassed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {submitted.percentage}%
                </div>
                <p className="text-xs text-zinc-500 mt-1 capitalize">{submitted.status}</p>
              </div>
              {canRetake ? (
                <button
                  type="button"
                  onClick={onTake}
                  className="bg-amber-600/90 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  Re-attempt
                </button>
              ) : null}
            </div>
          ) : role !== 'instructor' ? (
            <button onClick={onTake}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              Take Quiz
            </button>
          ) : null}
        </div>
      </div>

      {submitted && role !== 'instructor' && (submitted.feedback || submitted.id) && (
        <div className="mt-3 p-3 bg-white/5 rounded-xl text-xs text-zinc-400 space-y-2">
          {submitted.feedback ? (
            <p>
              <span className="font-medium text-zinc-300">Summary: </span>
              <span className="line-clamp-2">{submitted.feedback}</span>
            </p>
          ) : null}
          {submitted.id ? (
            <Link
              to={`/dashboard/assignments/result/${submitted.id}`}
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold"
            >
              Open detailed results →
            </Link>
          ) : null}
        </div>
      )}

      {role === 'instructor' && (onEdit || onViewSubmissions) && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 flex items-center gap-1.5"
            >
              <Pencil size={14} /> Edit
            </button>
          )}
          {onViewSubmissions && (
            <button
              type="button"
              onClick={onViewSubmissions}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-200 flex items-center gap-1.5"
            >
              <Users size={14} /> Who completed
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function TakeAssignmentModal({ assignment, onClose, onSubmit }: any) {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const formattedAnswers = Object.entries(answers).map(([i, ans]) => ({
      questionIndex: Number(i),
      answer: ans,
    }));

    if (formattedAnswers.length < assignment.questions.length) {
      setError(`Please answer all ${assignment.questions.length} questions`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/assignments/${assignment.id}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers: formattedAnswers }),
      });
      const d = await r.json();
      if (d.success) {
        onSubmit();
        const sid = d.submissionId as string | undefined;
        if (sid) {
          navigate(`/dashboard/assignments/result/${sid}`);
        }
        onClose();
      } else {
        setError(d.message || 'Submission failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{assignment.title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <>
            {assignment.questions.map((q: Question, qIdx: number) => (
              <div key={qIdx} className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{qIdx + 1}</span>
                  <p className="font-medium">{q.question}</p>
                </div>
                {q.type !== 'subjective' && q.options ? (
                  <div className="grid grid-cols-2 gap-2 pl-10">
                    {q.options.map((opt, oIdx) => (
                      <button key={oIdx} onClick={() => setAnswers(a => ({ ...a, [qIdx]: oIdx }))}
                        className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                          answers[qIdx] === oIdx ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-bold mr-2 text-xs">{String.fromCharCode(65 + oIdx)}.</span>{opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[qIdx] || ''}
                    onChange={e => setAnswers(a => ({ ...a, [qIdx]: e.target.value }))}
                    placeholder="Type your answer..."
                    rows={4}
                    className={`${inputCls} pl-10 resize-none`}
                  />
                )}
              </div>
            ))}

            {error && <div className="bg-red-500/10 text-red-400 rounded-xl p-3 text-sm">{error}</div>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl font-medium">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : 'Submit'}
              </button>
            </div>
          </>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateAssignmentModal({
  selectedCourseId,
  embedded,
  editingAssignment,
  onClose,
  onSaved,
}: {
  selectedCourseId?: string;
  embedded?: boolean;
  editingAssignment: Assignment | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editingAssignment;
  const [form, setForm] = useState({ courseId: selectedCourseId || '', title: '', description: '', type: 'mcq', dueDate: '', maxScore: 100, passingScore: 50 });
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/courses/my`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setCourses(d.courses); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      setForm(f => ({ ...f, courseId: selectedCourseId }));
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (!editingAssignment) return;
    const due = editingAssignment.dueDate
      ? new Date(editingAssignment.dueDate).toISOString().slice(0, 16)
      : '';
    setForm({
      courseId: editingAssignment.courseId,
      title: editingAssignment.title,
      description: editingAssignment.description || '',
      type: editingAssignment.type || 'mcq',
      dueDate: due,
      maxScore: editingAssignment.maxScore ?? 100,
      passingScore: editingAssignment.passingScore ?? 50,
    });
    const qs = (editingAssignment.questions || []).length
      ? editingAssignment.questions.map((q) => ({
          question: q.question || '',
          type: (q.type as 'mcq' | 'subjective') || 'mcq',
          options: q.options?.length ? [...q.options] : ['', '', '', ''],
          correctAnswer: q.correctAnswer ?? 0,
          modelAnswer: q.modelAnswer || '',
          explanation: q.explanation || '',
        }))
      : [{ question: '', type: 'mcq' as const, options: ['', '', '', ''], correctAnswer: 0, explanation: '' }];
    setQuestions(qs);
    setError('');
  }, [editingAssignment]);

  const normalizeQuestionForType = (q: Question, type: 'mcq' | 'subjective'): Question => ({
    ...q,
    type,
    options: type === 'mcq' ? (q.options?.length ? q.options : ['', '', '', '']) : undefined,
    correctAnswer: type === 'mcq' ? (q.correctAnswer ?? 0) : undefined,
    modelAnswer: type === 'subjective' ? (q.modelAnswer || '') : undefined,
  });

  const handleTypeChange = (type: string) => {
    setForm(f => ({ ...f, type }));
    if (type !== 'mixed') {
      setQuestions(qs => qs.map(q => normalizeQuestionForType(q, type as 'mcq' | 'subjective')));
    }
  };

  const setQuestionType = (idx: number, type: 'mcq' | 'subjective') => {
    setQuestions(qs => qs.map((q, i) => i === idx ? normalizeQuestionForType(q, type) : q));
  };

  const addQuestion = () => setQuestions(q => [...q, {
    question: '', type: form.type === 'subjective' ? 'subjective' : 'mcq',
    options: form.type !== 'subjective' ? ['', '', '', ''] : undefined,
    correctAnswer: 0, modelAnswer: '', explanation: ''
  }]);

  const handleSave = async () => {
    if (!form.courseId || !form.title.trim()) { setError('Course and title required'); return; }
    if (!questions.some(q => (q.question || '').trim())) {
      setError('Add at least one question with prompt text');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = isEdit
        ? `${API_BASE}/api/assignments/${editingAssignment!.id}`
        : `${API_BASE}/api/assignments`;
      const r = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...form, questions }),
      });
      const d = await r.json();
      if (d.success) onSaved();
      else setError(d.message || (isEdit ? 'Could not update assignment' : 'Could not create assignment'));
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEdit ? 'Edit assignment' : embedded ? 'Add course assignment' : 'Create Assignment'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg"><XCircle size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Course *</label>
              {selectedCourseId || isEdit ? (
                <div className={`${selectCls} flex items-center text-zinc-300`}>
                  {courses.find((c: any) => c.id === (selectedCourseId || form.courseId))?.title || 'This course'}
                </div>
              ) : (
                <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} className={selectCls}>
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Type</label>
              <select value={form.type} onChange={e => handleTypeChange(e.target.value)} className={selectCls}>
                <option value="mcq">MCQ (Auto-graded)</option>
                <option value="subjective">Subjective (AI-graded)</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Assignment title" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Instructions..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Due Date</label>
              <input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Max Score</label>
              <input type="number" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Passing Score</label>
              <input type="number" value={form.passingScore} onChange={e => setForm(f => ({ ...f, passingScore: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Questions</h3>
              <button onClick={addQuestion} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus size={12} /> Add Question</button>
            </div>
            {questions.map((q, qi) => (
              <div key={qi} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Question {qi + 1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))} className="text-red-400/60 hover:text-red-400"><Trash2 size={12} /></button>
                  )}
                </div>
                <div className="grid md:grid-cols-[1fr_180px] gap-3">
                  <textarea value={q.question} onChange={e => setQuestions(qs => qs.map((qx, i) => i === qi ? { ...qx, question: e.target.value } : qx))}
                    placeholder="Question text..." rows={2} className={`${inputCls} resize-none`} />
                  {form.type === 'mixed' && (
                    <select value={q.type} onChange={e => setQuestionType(qi, e.target.value as 'mcq' | 'subjective')} className={selectCls}>
                      <option value="mcq">MCQ</option>
                      <option value="subjective">Subjective</option>
                    </select>
                  )}
                </div>
                {q.type === 'mcq' && q.options?.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
                      onChange={() => setQuestions(qs => qs.map((qx, i) => i === qi ? { ...qx, correctAnswer: oi } : qx))}
                      className="accent-green-500" title="Mark as correct" />
                    <input value={opt} onChange={e => setQuestions(qs => qs.map((qx, i) => i === qi ? { ...qx, options: qx.options?.map((o, j) => j === oi ? e.target.value : o) } : qx))}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`} className={inputCls} />
                  </div>
                ))}
                {q.type === 'subjective' && (
                  <textarea value={q.modelAnswer || ''} onChange={e => setQuestions(qs => qs.map((qx, i) => i === qi ? { ...qx, modelAnswer: e.target.value } : qx))}
                    placeholder="Model answer (for AI grading)..." rows={2} className={`${inputCls} resize-none`} />
                )}
              </div>
            ))}
          </div>

          {error && <div className="bg-red-500/10 text-red-400 rounded-xl p-3 text-sm">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl">Cancel</button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save changes' : 'Create Assignment')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SubmissionsModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/assignments/${assignment.id}/submissions`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) setRows(d.submissions || []);
        else setErr(d.message || 'Could not load submissions');
      })
      .catch(() => setErr('Network error'))
      .finally(() => setLoading(false));
  }, [assignment.id]);

  const passedCount = rows.filter((r: any) => r.passed).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Submissions</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{assignment.title}</p>
            <p className="text-xs text-zinc-600 mt-1">
              {rows.length} submission{rows.length !== 1 ? 's' : ''}
              {rows.length > 0 ? ` · ${passedCount} passed` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg">
            <XCircle size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-500" size={36} /></div>
          ) : err ? (
            <div className="text-red-400 text-sm text-center py-8">{err}</div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-10">No submissions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-white/10">
                  <th className="pb-2 pr-2 font-semibold">Student</th>
                  <th className="pb-2 pr-2 font-semibold">Score</th>
                  <th className="pb-2 pr-2 font-semibold">%</th>
                  <th className="pb-2 pr-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-b border-white/5 text-zinc-300">
                    <td className="py-2.5 pr-2">
                      <div className="font-medium text-white">{r.studentName || 'Unknown'}</div>
                      {r.studentEmail && <div className="text-xs text-zinc-500">{r.studentEmail}</div>}
                    </td>
                    <td className="py-2.5 pr-2 tabular-nums">{r.score}/{r.maxScore}</td>
                    <td className="py-2.5 pr-2 tabular-nums">{r.percentage}%</td>
                    <td className="py-2.5 pr-2">
                      <span className={r.passed ? 'text-green-400' : 'text-amber-400'}>{r.passed ? 'Passed' : 'Not passed'}</span>
                      <span className="text-zinc-600 text-xs ml-1 capitalize">({r.status})</span>
                    </td>
                    <td className="py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Empty({ icon, title, desc }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-zinc-700 mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-zinc-400 mb-2">{title}</h3>
      <p className="text-sm text-zinc-600">{desc}</p>
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center py-20"><Loader2 size={40} className="animate-spin text-indigo-500" /></div>;
}
