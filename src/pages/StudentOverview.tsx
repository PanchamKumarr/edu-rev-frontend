import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthProvider';
import { Trophy, Clock, Target, ArrowRight, TrendingUp, BrainCircuit, BookOpen } from 'lucide-react';
import { CAROA } from '../lib/caroa';
import { API_BASE, getAuthHeaders } from '../lib/api';

export function StudentOverview() {
  const { profile } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [stats, setStats] = useState({ courses: 0, completed: 0, mastery: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        const recs = await CAROA.fetchRecommendations();
        setRecommendations(recs.recommendations || []);

        const enrollRes = await fetch(`${API_BASE}/api/enrollments`, {
          headers: getAuthHeaders()
        });
        const enrollData = await enrollRes.json();
        const enrollments = enrollData.enrollments || [];

        setStats({
          courses: enrollments.length,
          completed: enrollments.filter((e: { progress?: number }) => e.progress === 100).length,
          mastery: 0.72
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Welcome back, {profile?.name}
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">
            CAROA has analyzed your last session. Here is your adaptive update.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">
            Current Academic Level
          </span>
          <div className="text-3xl font-mono font-bold text-indigo-500">B2.1 - Advanced</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Courses', value: stats.courses, icon: BookOpen, color: 'text-blue-500' },
          { label: 'Modules Completed', value: stats.completed, icon: Trophy, color: 'text-amber-500' },
          { label: 'Mastery Level', value: `${(stats.mastery * 100).toFixed(0)}%`, icon: Target, color: 'text-green-500' },
          { label: 'Learning Hours', value: '12.4', icon: Clock, color: 'text-purple-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-zinc-800 rounded-2xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <TrendingUp size={16} className="text-green-500 opacity-50" />
            </div>
            <div className="text-3xl font-bold font-mono">{stat.value}</div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <BrainCircuit size={18} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight">AI Recommended Pathing</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-zinc-900 animate-pulse rounded-3xl border border-zinc-800" />
              ))
            ) : recommendations.length > 0 ? (
              recommendations.map((rec: any, i: number) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-indigo-500/50 transition-colors group cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                          Priority {rec.priority}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">
                          • {rec.moduleId ? 'Module Recommendation' : 'Topic Insight'}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-white group-hover:text-indigo-400 transition-colors">
                        {rec.title}
                      </h3>
                      <p className="text-zinc-500 text-sm leading-relaxed">{rec.reasoning}</p>
                    </div>
                    <button className="p-4 bg-zinc-800 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center bg-zinc-900 rounded-3xl border border-dashed border-zinc-800">
                <p className="text-zinc-500 italic">CAROA is building your profile. Check back shortly.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-tight">Performance Summary</h2>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase mb-2">
                  <span>Knowledge Retention</span>
                  <span className="text-indigo-400">84%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[84%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase mb-2">
                  <span>Topic: Vector Calculus</span>
                  <span className="text-green-500">92%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[92%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase mb-2">
                  <span>Topic: Data Eng</span>
                  <span className="text-amber-500">45%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[45%]" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 italic">CAROA: Attention suggested in Module 3.</p>
              </div>
            </div>
          </div>

          <button className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-zinc-200 transition-colors">
            View Academic Timeline
          </button>
        </div>
      </div>
    </div>
  );
}
