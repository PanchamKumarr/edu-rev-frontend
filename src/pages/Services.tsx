import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, BookType, Code2, LineChart, Users, ShieldCheck } from 'lucide-react';

export function Services() {
  const services = [
    { title: 'Adaptive Learning', desc: 'Real-time difficulty adjustment based on user performance.', icon: BrainCircuit },
    { title: 'Smart Assessments', desc: 'AI-graded quizzes with instant feedback and similarity scoring.', icon: BookType },
    { title: 'Developer APIs', desc: 'Integrate CAROA engine directly into your existing platforms.', icon: Code2 },
    { title: 'Predictive Analytics', desc: 'Identify learning drop-offs before they happen with intelligent tracking.', icon: LineChart }
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto z-10 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 italic">Services</h1>
        <p className="max-w-2xl mx-auto text-zinc-400 text-lg">Comprehensive AI-powered tools for modern educational institutions.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {services.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-6 bg-white/5 border border-white/10 p-8 rounded-3xl items-center"
          >
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <item.icon size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-zinc-400">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* How It Works */}
      <div className="mt-32 max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 italic">How It Works</h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {[
            { title: 'Data Collection', desc: 'The system gathers data on your interactions, scores, and time spent on modules.', num: 1 },
            { title: 'Knowledge Estimation', desc: 'CAROA updates your mastery level for each topic based on your performance.', num: 2 },
            { title: 'Path Optimization', desc: 'Reinforcement learning identifies the most effective learning sequences for you.', num: 3 },
            { title: 'Personalized Recommendation', desc: 'The system suggests the most relevant content to fill your knowledge gaps.', num: 4 }
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group"
            >
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center font-black text-2xl text-white border-4 border-black group-hover:scale-110 transition-transform">
                {step.num}
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-32 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 italic">Flexible Plans</h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Individual Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col"
          >
            <h3 className="text-2xl font-bold text-indigo-400 mb-4">For Individuals</h3>
            <p className="text-5xl font-black text-white mb-2">$29<span className="text-lg text-zinc-400">/month</span></p>
            <p className="text-zinc-400 mb-8">Unlock your full potential with personalized learning.</p>
            <ul className="space-y-3 text-zinc-300 mb-12 flex-1">
              <li className="flex items-center gap-3"><BrainCircuit size={16} className="text-indigo-500" /> Adaptive Learning Paths</li>
              <li className="flex items-center gap-3"><BookType size={16} className="text-indigo-500" /> Unlimited Smart Assessments</li>
              <li className="flex items-center gap-3"><LineChart size={16} className="text-indigo-500" /> Performance Analytics</li>
            </ul>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">Get Started</button>
          </motion.div>
          {/* Institutional Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white/10 border-2 border-indigo-500 p-8 rounded-3xl flex flex-col"
          >
            <h3 className="text-2xl font-bold text-indigo-300 mb-4">For Institutions</h3>
            <p className="text-5xl font-black text-white mb-2">Custom</p>
            <p className="text-zinc-300 mb-8">Empower your entire organization with our AI platform.</p>
            <ul className="space-y-3 text-zinc-200 mb-12 flex-1">
              <li className="flex items-center gap-3"><Code2 size={16} className="text-indigo-400" /> Full API Access</li>
              <li className="flex items-center gap-3"><Users size={16} className="text-indigo-400" /> Instructor & Admin Dashboards</li>
              <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-indigo-400" /> Enterprise-Grade Security</li>
            </ul>
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors">Contact Sales</button>
          </motion.div>
        </div>
      </div>

      {/* CAROA Deep Dive */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-40 max-w-6xl mx-auto"
      >
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 italic">The CAROA Engine</h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">Cognitive Adaptive Reinforcement Optimization Algorithm — The intelligence powering personalized learning at scale.</p>
          <div className="w-20 h-1 bg-indigo-600 mx-auto mt-8" />
        </div>

        <div className="bg-gradient-to-br from-indigo-950/20 via-black to-purple-950/20 border border-indigo-500/20 rounded-3xl p-12 mb-12">
          <p className="text-zinc-300 leading-relaxed text-center max-w-4xl mx-auto">
            CAROA is not just an algorithm—it's a living, learning system that evolves with every student interaction. By combining knowledge estimation, reinforcement learning, and adaptive recommendation systems, CAROA creates a unique learning journey for each individual. It identifies knowledge gaps, predicts learning outcomes, and continuously optimizes the path to mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Knowledge Modeling',
              points: [
                'Mastery estimation for each topic',
                'Real-time performance tracking',
                'Skill graph construction',
                'Knowledge prerequisites mapping'
              ]
            },
            {
              title: 'Reinforcement Learning',
              points: [
                'Optimal path discovery',
                'Content effectiveness scoring',
                'Dynamic difficulty adjustment',
                'Learning pattern recognition'
              ]
            },
            {
              title: 'Adaptive Recommendations',
              points: [
                'Personalized content ranking',
                'At-risk student identification',
                'Engagement prediction',
                'Learning outcome forecasting'
              ]
            }
          ].map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors"
            >
              <h3 className="text-2xl font-bold text-indigo-400 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-black">{i + 1}</div>
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-300">
                    <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <a href="#" className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl transition-colors uppercase tracking-widest text-sm">
            Download CAROA Whitepaper
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}