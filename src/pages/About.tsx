import React from 'react';
import { motion } from 'motion/react';
import { Users, Target, BookOpen } from 'lucide-react';

export function About() {
  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto z-10 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 italic">About Us</h1>
        <p className="max-w-2xl mx-auto text-zinc-400 text-lg">Pioneering the future of education with AI-driven adaptive learning systems.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 mt-16">
        {[
          { icon: Users, title: 'Our Mission', desc: 'To provide personalized education at scale for everyone, everywhere.' },
          { icon: Target, title: 'Our Vision', desc: 'A world where AI and human intelligence collaborate to unlock cognitive potential.' },
          { icon: BookOpen, title: 'Our Method', desc: 'Using CAROA engine to adapt content dynamically to each learner.' }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl"
          >
            <item.icon size={32} className="text-indigo-500 mb-6" />
            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
            <p className="text-zinc-400">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Our Story */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-32 max-w-4xl mx-auto text-center"
      >
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 italic">Our Story</h2>
        <div className="w-20 h-1 bg-indigo-600 mx-auto mb-8" />
        <p className="text-zinc-400 leading-relaxed">
          EDU-REV was born from a simple observation: traditional education is one-size-fits-all, but learning is deeply personal. We saw a future where technology could bridge that gap, creating a learning experience as unique as each student's fingerprint. Our journey began in a small research lab, fueled by a passion for AI and a belief in its power to democratize education. After years of developing and refining the CAROA engine, we launched EDU-REV to bring our vision to the world.
        </p>
      </motion.div>

      {/* Meet the Team */}
      <div className="mt-32 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 italic">Meet the Innovators</h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Dr. Arin Kale', role: 'Founder & AI Architect', img: 'https://randomuser.me/api/portraits/men/75.jpg' },
            { name: 'Jian Li', role: 'Lead UX Engineer', img: 'https://randomuser.me/api/portraits/women/75.jpg' },
            { name: 'Marcus Thorne', role: 'Head of Pedagogy', img: 'https://randomuser.me/api/portraits/men/76.jpg' }
          ].map((member, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-center"
            >
              <img src={member.img} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-indigo-500/50" />
              <h4 className="font-bold text-lg text-white">{member.name}</h4>
              <p className="text-indigo-400 text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Our Technology */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-32 bg-white/5 border border-white/10 p-12 rounded-3xl max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12"
      >
        <div className="flex-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">The CAROA Engine</h2>
          <p className="text-zinc-400 mb-6">The Cognitive Adaptive Reinforcement Optimization Algorithm is the heart of our platform. It's not just a recommendation engine; it's a dynamic system that models knowledge, estimates mastery, and uses reinforcement learning to discover the most effective learning paths for each individual.</p>
          <a href="#" className="font-bold text-indigo-400 hover:text-white transition-colors">Read the Whitepaper &rarr;</a>
        </div>
        <div className="flex-1">
          <BookOpen size={80} className="text-indigo-500 mx-auto" />
        </div>
      </motion.div>
    </div>
  );
}