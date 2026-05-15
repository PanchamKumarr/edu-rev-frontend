import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Users, TrendingUp, Award, AlertCircle } from 'lucide-react';

const data = [
  { name: 'Mon', engagement: 4000, active: 2400 },
  { name: 'Tue', engagement: 3000, active: 1398 },
  { name: 'Wed', engagement: 2000, active: 9800 },
  { name: 'Thu', engagement: 2780, active: 3908 },
  { name: 'Fri', engagement: 1890, active: 4800 },
  { name: 'Sat', engagement: 2390, active: 3800 },
  { name: 'Sun', engagement: 3490, active: 4300 },
];

const studentPerformance = [
    { name: 'Alice', mastery: 85, predicted: 90 },
    { name: 'Bob', mastery: 45, predicted: 60 },
    { name: 'Charlie', mastery: 92, predicted: 95 },
    { name: 'Diana', mastery: 25, predicted: 30 },
]

export function InstructorAnalytics() {
  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-black uppercase tracking-tighter italic">Instructor Insights</h1>
           <p className="text-zinc-500 font-medium tracking-tight mt-1">Real-time cohort performance and CAROA predictive analysis.</p>
        </div>
        <div className="flex gap-4">
            <button className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Export Report</button>
            <button className="px-6 py-3 bg-indigo-600 rounded-2xl text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20">Trigger AI Scan</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
              { label: 'Total Active Learners', value: '1,248', icon: Users, color: 'text-blue-400' },
              { label: 'Avg Mastery Gain', value: '+12%', icon: TrendingUp, color: 'text-green-400' },
              { label: 'Certs Issued', value: '450', icon: Award, color: 'text-amber-400' },
              { label: 'At-Risk Detected', value: '12', icon: AlertCircle, color: 'text-red-400' },
          ].map((stat, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[40px] flex items-center justify-between">
                  <div>
                      <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">{stat.label}</div>
                      <div className="text-3xl font-black italic tracking-tighter">{stat.value}</div>
                  </div>
                  <stat.icon className={stat.color} size={32} />
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[60px] space-y-8">
              <h3 className="text-lg font-bold uppercase tracking-tight italic flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                  Cohort Engagement Stream
              </h3>
              <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data}>
                          <defs>
                              <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #1f2937', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                          />
                          <Area type="monotone" dataKey="engagement" stroke="#6366f1" fillOpacity={1} fill="url(#colorEng)" strokeWidth={3} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[60px] space-y-8">
              <h3 className="text-lg font-bold uppercase tracking-tight italic flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Individual Mastery vs Predicted
              </h3>
              <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={studentPerformance}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #1f2937', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                          />
                          <Bar dataKey="mastery" fill="#6366f1" radius={[10, 10, 0, 0]} />
                          <Bar dataKey="predicted" fill="#10b981" radius={[10, 10, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
    </div>
  );
}
