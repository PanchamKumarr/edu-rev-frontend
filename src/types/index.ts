export type Role = 'student' | 'instructor' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  displayName: string;
  photoURL?: string;
  createdAt: any;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  price: number;
  isFree: boolean;
  thumbnail?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: Module[];
  rating: number;
  reviewCount: number;
}

export interface Module {
  id: string;
  title: string;
  content: string;
  type: 'video' | 'document' | 'quiz';
  order: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completedModules: string[];
  enrolledAt: any;
  lastAccessed: any;
  certificateId?: string;
}

export interface MasteryRecord {
  userId: string;
  topicId: string;
  level: number; // 0 to 1
  lastUpdated: any;
}

export interface ActivityLog {
  userId: string;
  courseId: string;
  moduleId: string;
  action: 'view' | 'quiz_start' | 'quiz_end' | 'video_watch';
  timeSpent: number;
  score?: number;
  timestamp: any;
}
