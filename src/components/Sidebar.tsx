import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from './AuthProvider';
import { 
  Home, 
  BookOpen, 
  Video, 
  BarChart3, 
  MessageSquare, 
  Briefcase, 
  Award, 
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';

interface SidebarItem {
  icon: any;
  label: string;
  id: string;
  roles: string[];
}

const navItems: SidebarItem[] = [
  { icon: Home, label: 'Dashboard', id: 'dashboard', roles: ['student', 'instructor', 'admin'] },
  { icon: BookOpen, label: 'My Courses', id: 'courses', roles: ['student'] },
  { icon: Briefcase, label: 'Manage Courses', id: 'manage_courses', roles: ['instructor', 'admin'] },
  { icon: Video, label: 'Live Classes', id: 'live', roles: ['student', 'instructor'] },
  { icon: Award, label: 'Certificates', id: 'certs', roles: ['student'] },
  { icon: MessageSquare, label: 'Discussions', id: 'forums', roles: ['student', 'instructor'] },
  { icon: BarChart3, label: 'Analytics', id: 'analytics', roles: ['instructor', 'admin'] },
  { icon: Settings, label: 'Academic Meta', id: 'academic', roles: ['student', 'admin'] },
];

export function Sidebar({ activeTab, onTabChange }: { activeTab: string, onTabChange: (id: string) => void }) {
  const { profile, logout } = useAuth();

  const filteredItems = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="w-64 bg-zinc-950 text-zinc-400 h-screen flex flex-col border-r border-zinc-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl skew-x-[-10deg]">
          EV
        </div>
        <span className="font-bold text-white text-xl tracking-tighter uppercase font-sans">EDU-REV</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
              ${activeTab === item.id ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-zinc-900 hover:text-white'}
            `}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <item.icon size={20} className={activeTab === item.id ? 'text-indigo-500' : 'group-hover:text-white'} />
            <span className="font-sans font-medium text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-4 rounded-xl border border-indigo-500/20 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">CAROA Engine</span>
          </div>
          <p className="text-[10px] leading-relaxed opacity-60">AI is analyzing your learning patterns for personalized pathing.</p>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors text-zinc-500"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
