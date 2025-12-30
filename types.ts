
export interface Question {
  id: string;
  type: 'choice' | 'text'; // Added type
  text: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
}

export interface Quiz {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  questions: Question[];
  createdAt: string;
  requiresManualGrading?: boolean; // Flag for UI
}

export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise';

export interface AppSettings {
  brandColor: string;
  logoUrl?: string;
  schoolName: string;
  theme: 'blue' | 'emerald' | 'rose' | 'slate' | 'violet';
  language: 'en' | 'ar';
  isRTL: boolean;
}

export interface Teacher {
  id: string;
  email: string;
  password?: string;
  name: string;
  settings: AppSettings;
  createdAt: string;
  isActive: boolean;
  plan: SubscriptionPlan;
  subscriptionStatus?: string;
  subscriptionExpiry?: string;
}

export interface Submission {
  id: string;
  quizId: string;
  teacherId: string;
  studentName: string;
  studentEmail?: string;
  firstName: string;
  lastName: string;
  phone: string;
  answers: (number | string)[]; // Can store index or text
  score: number;
  totalPoints: number;
  status: 'pending' | 'graded'; // Status for manual grading
  manualScores?: Record<number, number>; // Points assigned to specific indices
  submittedAt: string;
}
