import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, Module } from '../types';
import { 
  ChevronLeft, 
  CheckCircle2, 
  PlayCircle, 
  FileText, 
  HelpCircle,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { CAROA } from '../lib/caroa';
import { useAuth } from '../components/AuthProvider';

export function CoursePlayer({ course, onBack }: { course: Course, onBack: () => void }) {
  const { profile } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>(course.modules[0]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleComplete = async () => {
    if (!completed.includes(activeModule.id)) {
        const newCompleted = [...completed, activeModule.id];
        setCompleted(newCompleted);

        // Update CAROA engine
        if (profile?.id) {
            await CAROA.logActivity({
                courseId: course.id,
                moduleId: activeModule.id,
                action: 'view',
                timeSpent: 180 // Mock 3 mins
            });
            await CAROA.updateMastery(course.id, 0.05);
        }

        if (newCompleted.length === course.modules.length) {
            setShowConfetti(true);
        }
    }
  };

  const nextModule = () => {
    const nextIdx = course.modules.findIndex(m => m.id === activeModule.id) + 1;
    if (nextIdx < course.modules.length) {
        setActiveModule(course.modules[nextIdx]);
    }
  };

  const prevModule = () => {
    const prevIdx = course.modules.findIndex(m => m.id === activeModule.id) - 1;
    if (prevIdx >= 0) {
        setActiveModule(course.modules[prevIdx]);
    }
  };

  return (
    <div className="flex h-full bg-zinc-950 overflow-hidden font-sans">
      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-8 py-5 flex items-center justify-between border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"
            >
                <ChevronLeft size={24} />
            </button>
            <div>
                <h2 className="text-xl font-bold uppercase tracking-tight italic line-clamp-1">{course.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{activeModule.title}</span>
                    <span className="text-zinc-800 text-xs">/</span>
                    <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Module {course.modules.findIndex(m => m.id === activeModule.id) + 1} of {course.modules.length}</span>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end mr-4">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">CAROA Progress</span>
                 <div className="w-40 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-600 transition-all duration-1000" 
                        style={{ width: `${(completed.length / course.modules.length) * 100}%` }}
                    />
                 </div>
             </div>
          </div>
        </header>

        {/* Player / Content View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {activeModule.type === 'video' ? (
                <div className="aspect-video w-full rounded-[40px] bg-black border border-zinc-800 flex items-center justify-center relative overflow-hidden group mb-12 shadow-2xl">
                    <img 
                        src={`https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2062&auto=format&fit=crop`} 
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-110"
                        alt="Background"
                    />
                    <div className="z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/50 hover:scale-110 transition-transform cursor-pointer">
                            <PlayCircle size={40} fill="currentColor" />
                        </div>
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Cognitive Stream Active</p>
                    </div>
                </div>
              ) : null}

              <div className="prose prose-invert max-w-none">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-8 border-l-8 border-indigo-600 pl-8">{activeModule.title}</h1>
                <div className="text-zinc-400 leading-relaxed space-y-6 text-lg font-medium selection:bg-indigo-500/30">
                    <ReactMarkdown>{activeModule.content}</ReactMarkdown>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-20 flex items-center justify-between border-t border-zinc-900 pt-12 pb-20">
                <button 
                  onClick={prevModule}
                  disabled={course.modules.indexOf(activeModule) === 0}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-zinc-900 text-zinc-500 font-bold uppercase text-xs tracking-widest disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Previous Module
                </button>

                {!completed.includes(activeModule.id) ? (
                    <button 
                        onClick={handleComplete}
                        className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/20"
                    >
                        Mark as Complete
                        <Sparkles size={18} />
                    </button>
                ) : (
                    <div className="flex items-center gap-3 text-green-500 font-black uppercase text-sm tracking-widest bg-green-500/10 px-8 py-5 rounded-2xl border border-green-500/20">
                        Module Mastered
                        <CheckCircle2 size={18} />
                    </div>
                )}

                <button 
                   onClick={nextModule}
                   disabled={course.modules.indexOf(activeModule) === course.modules.length - 1}
                   className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-zinc-900 text-zinc-500 font-bold uppercase text-xs tracking-widest disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                >
                  Next Module
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Course Map / Sidebar */}
      <aside className="w-96 border-l border-zinc-900 flex flex-col bg-black/40 backdrop-blur-xl">
        <div className="p-8 border-b border-zinc-900">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-600/20">
                    <FileText size={20} />
                </div>
                <h3 className="font-bold uppercase tracking-tight">Adaptive Map</h3>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed font-medium">Navigate through your personalized cognitive journey. Modules highlighted are suggested by CAROA.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {course.modules.map((m, i) => {
              const isActive = activeModule.id === m.id;
              const isCompleted = completed.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m)}
                  className={`w-full group rounded-2xl p-4 flex items-start gap-4 transition-all text-left relative
                    ${isActive ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-zinc-900'}
                  `}
                >
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black
                        ${isCompleted ? 'bg-green-500/20 text-green-500 border border-green-500/20' : 
                          isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'}
                    `}>
                        {isCompleted ? <CheckCircle2 size={12} /> : i + 1}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                             <h4 className={`text-sm font-bold uppercase tracking-tight mb-1 leading-tight ${isActive ? 'text-indigo-400' : 'text-zinc-300'}`}>
                                {m.title}
                            </h4>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                                {m.type === 'video' ? <PlayCircle size={10} /> : m.type === 'quiz' ? <HelpCircle size={10} /> : <FileText size={10} />}
                                {m.type}
                            </span>
                            {isActive && <span className="text-indigo-500 flex items-center gap-1 tracking-tighter"><Sparkles size={8} /> ACTIVE STREAM</span>}
                        </div>
                    </div>
                </button>
              );
          })}
        </div>

        {/* Completion Modal / State */}
        <AnimatePresence>
            {showConfetti && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-zinc-900 border border-indigo-500/30 p-12 rounded-[60px] max-w-xl relative overflow-hidden"
                    >
                        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[80px] rounded-full" />
                        
                        <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-600/40">
                            <Award size={48} />
                        </div>
                        
                        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 italic">Course Mastered</h2>
                        <p className="text-zinc-500 font-medium leading-relaxed mb-12">
                            Congratulations! Your cognitive profile has been significantly upgraded. A verifiable blockchain certificate is being generated for your academic record.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={onBack}
                                className="w-full py-5 bg-zinc-800 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-zinc-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                            <button className="w-full py-5 bg-indigo-600 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20">
                                Claim Certificate
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </aside>
    </div>
  );
}
