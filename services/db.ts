
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Quiz, Submission, Teacher } from '../types';

const VAULT = {
  u: "https://database-pre0225supabase-d4787c-46-202-132-189.traefik.me",
  k: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
};

const getInitialConfig = () => {
  const envUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : null;
  const envKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : null;

  return {
    url: envUrl || VAULT.u,
    key: envKey || VAULT.k
  };
};

const config = getInitialConfig();
const supabase: SupabaseClient = createClient(config.url, config.key);

const TABLES = {
  QUIZZES: 'quizzes',
  SUBMISSIONS: 'submissions',
  TEACHERS: 'teachers',
  TRANSLATIONS: 'app_translations'
};

export const DB = {
  isConfigured: () => true,

  getTranslations: async (lang: string): Promise<any | null> => {
    const { data, error } = await supabase.from(TABLES.TRANSLATIONS).select('bundle').eq('language', lang).single();
    if (error) return null;
    return data?.bundle;
  },

  getTeachers: async (): Promise<Teacher[]> => {
    const { data, error } = await supabase.from(TABLES.TEACHERS).select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addTeacher: async (teacher: Omit<Teacher, 'id' | 'createdAt'>): Promise<string> => {
    const { data, error } = await supabase.from(TABLES.TEACHERS).insert([{
      ...teacher,
      isActive: teacher.isActive ?? true,
      plan: teacher.plan ?? 'basic',
      settings: {
        language: 'en',
        isRTL: false,
        ...teacher.settings
      }
    }]).select().single();
    if (error) throw error;
    return data.id;
  },

  updateTeacher: async (id: string, updates: Partial<Teacher>): Promise<void> => {
    const { error } = await supabase.from(TABLES.TEACHERS).update(updates).eq('id', id);
    if (error) throw error;
  },

  deleteTeacher: async (id: string): Promise<void> => {
    const { error } = await supabase.from(TABLES.TEACHERS).delete().eq('id', id);
    if (error) throw error;
  },

  loginTeacher: async (email: string, hashedPass: string): Promise<Teacher | null> => {
    const { data, error } = await supabase.from(TABLES.TEACHERS)
      .select('*')
      .eq('email', email)
      .eq('password', hashedPass)
      .eq('isActive', true)
      .single();
    if (error || !data) return null;
    return data;
  },

  getTeacherById: async (id: string): Promise<Teacher | null> => {
    const { data, error } = await supabase.from(TABLES.TEACHERS).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  getQuizzes: async (teacherId: string): Promise<Quiz[]> => {
    const { data, error } = await supabase.from(TABLES.QUIZZES).select('*').eq('teacherId', teacherId).order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getQuizById: async (id: string): Promise<Quiz | undefined> => {
    const { data, error } = await supabase.from(TABLES.QUIZZES).select('*').eq('id', id).single();
    if (error) return undefined;
    return data as Quiz;
  },

  addQuiz: async (quiz: Omit<Quiz, 'id'>): Promise<string> => {
    const { data, error } = await supabase.from(TABLES.QUIZZES).insert([quiz]).select().single();
    if (error) throw error;
    return data.id;
  },

  updateQuiz: async (id: string, updatedQuiz: Partial<Quiz>): Promise<void> => {
    const { error } = await supabase.from(TABLES.QUIZZES).update(updatedQuiz).eq('id', id);
    if (error) throw error;
  },

  deleteQuiz: async (id: string): Promise<void> => {
    const { error } = await supabase.from(TABLES.QUIZZES).delete().eq('id', id);
    if (error) throw error;
  },

  addSubmission: async (sub: Submission): Promise<void> => {
    const { error } = await supabase.from(TABLES.SUBMISSIONS).insert([sub]);
    if (error) throw error;
  },

  updateSubmission: async (id: string, updates: Partial<Submission>): Promise<{ error: any }> => {
    const { error } = await supabase.from(TABLES.SUBMISSIONS).update(updates).eq('id', id);
    return { error };
  },

  getSubmissionsForQuiz: async (quizId: string): Promise<Submission[]> => {
    const { data, error } = await supabase.from(TABLES.SUBMISSIONS).select('*').eq('quizId', quizId);
    if (error) return [];
    return data || [];
  },

  getSubmissionById: async (id: string): Promise<Submission | null> => {
    const { data, error } = await supabase.from(TABLES.SUBMISSIONS).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  getSubmissionsByEmail: async (email: string): Promise<Submission[]> => {
    const { data, error } = await supabase.from(TABLES.SUBMISSIONS)
      .select('*')
      .eq('studentEmail', email)
      .order('submittedAt', { ascending: false });
    if (error) return [];
    return data || [];
  },

  getSubmissionsByIdentity: async (fName: string, lName: string, phone: string): Promise<Submission[]> => {
    const { data, error } = await supabase.from(TABLES.SUBMISSIONS)
      .select('*')
      .eq('firstName', fName)
      .eq('lastName', lName)
      .eq('phone', phone)
      .order('submittedAt', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
