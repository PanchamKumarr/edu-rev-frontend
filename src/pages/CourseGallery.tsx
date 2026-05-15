import React, { useEffect, useState } from 'react';
import { Course } from '../types';
import { motion } from 'motion/react';
import { Star, Clock, BarChart, ArrowUpRight, Search } from 'lucide-react';
import { API_BASE } from '../lib/api';

export function CourseGallery({ onSelectCourse }: { onSelectCourse: (course: Course) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/courses`);
        const data = await res.json();
        const list = (data.courses || []) as Course[];
        setCourses(list);
      } catch (e) {
        console.error(e);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) => c.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Course Range</h1>
          <p className="text-zinc-500 font-medium tracking-tight">
            AI-filtered courses based on your current academic trajectory.
          </p>
        </div>
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search cognitive modules..."
            className="bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 w-full md:w-80 outline-none focus:border-indigo-500 transition-all font-sans text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] bg-zinc-900 animate-pulse rounded-[32px] border border-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((course, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className="bg-zinc-900 border border-zinc-800 rounded-[32px] overflow-hidden group cursor-pointer hover:border-zinc-700 transition-all shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={
                    course.thumbnail
                      ? (course.thumbnail.startsWith('http') ? course.thumbnail : `${API_BASE}${course.thumbnail}`)
                      : `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop`
                  }
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  alt={course.title}
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-black/50 backdrop-blur-md text-[10px] font-black uppercase px-3 py-1 rounded-full border border-white/10 tracking-widest">
                    {course.difficulty}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform">
                  <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        size={12}
                        fill={si < Math.floor(course.rating) ? 'currentColor' : 'none'}
                        className={si < Math.floor(course.rating) ? '' : 'text-zinc-700'}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500">({course.reviewCount} REVIEWS)</span>
                </div>

                <h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-indigo-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6 line-clamp-2">{course.description}</p>

                <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>12H</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart size={14} />
                      <span>{course.modules.length} MODS</span>
                    </div>
                  </div>
                  <div className="text-xl font-black italic tracking-tighter">
                    {course.isFree ? 'FREE' : `$${course.price}`}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {courses.length === 0 && !loading && (
        <div className="text-center py-20 bg-zinc-950 rounded-[40px] border border-dashed border-zinc-800">
          <h3 className="text-2xl font-bold uppercase tracking-tight text-zinc-600 mb-2">No Courses Synced</h3>
          <p className="text-zinc-700 text-sm font-medium">Be the first instructor to contribute to the EDU-Revolution.</p>
        </div>
      )}
    </div>
  );
}
