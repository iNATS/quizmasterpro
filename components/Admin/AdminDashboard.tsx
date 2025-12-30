
import React, { useState, useEffect } from 'react';
import QuizList from './QuizList';
import QuizBuilder from './QuizBuilder';
import TeacherSettings from '../Teacher/TeacherSettings';
import BillingSection from '../Teacher/BillingSection';
import ReportsView from './ReportsView';
import GradingView from './GradingView';
import { Quiz, Teacher } from '../../types';
import { DB } from '../../services/db';
import { translations } from '../../translations';

interface AdminDashboardProps {
  onLogout: () => void;
}

type View = 'list' | 'create' | 'edit' | 'settings' | 'billing' | 'reports' | 'grading';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [view, setView] = useState<View>('list');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const teacherId = localStorage.getItem('teacher_id');

  useEffect(() => {
    if (teacherId) {
      loadTeacher();
    }
  }, [teacherId]);

  const loadTeacher = async () => {
    if (!teacherId) return;
    const t = await DB.getTeacherById(teacherId);
    if (t && !t.isActive) {
      alert("This account has been suspended. Please contact administrator.");
      onLogout();
    }
    setTeacher(t);
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setView('edit');
  };

  const handleFinishBuilder = () => {
    setEditingQuiz(null);
    setView('list');
  };

  if (!teacher) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Authenticating Workspace...</div>;

  const t = translations[teacher.settings.language || 'en'];
  const isRTL = teacher.settings.isRTL;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-white p-8 flex flex-col shadow-2xl z-30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
        <div className="flex items-center gap-4 mb-12">
          {teacher.settings.logoUrl ? (
             <img src={teacher.settings.logoUrl} className="w-12 h-12 rounded-xl object-contain bg-white p-1" alt="logo" />
          ) : (
            <div className="bg-brand-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: teacher.settings.brandColor }}>
              <i className="fas fa-school text-xl"></i>
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">{teacher.settings.schoolName}</h1>
            <span className="inline-block mt-1 px-2 py-0.5 bg-brand-900/50 text-brand-400 text-[9px] font-black uppercase tracking-widest rounded">{teacher.plan} tier</span>
          </div>
        </div>
        
        <nav className="space-y-1.5 flex-1">
          <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${view === 'list' ? 'bg-slate-800 text-white font-bold border-brand-500 shadow-xl ' + (isRTL ? 'border-r-4' : 'border-l-4') : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fas fa-th-large w-5"></i><span>{t.dashboard}</span>
          </button>
          <button onClick={() => { setEditingQuiz(null); setView('create'); }} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${view === 'create' ? 'bg-slate-800 text-white font-bold border-brand-500 shadow-xl ' + (isRTL ? 'border-r-4' : 'border-l-4') : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fas fa-plus-circle w-5"></i><span>{t.newAssessment}</span>
          </button>
          <button onClick={() => setView('grading')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${view === 'grading' ? 'bg-slate-800 text-white font-bold border-brand-500 shadow-xl ' + (isRTL ? 'border-r-4' : 'border-l-4') : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fas fa-pen-nib w-5"></i><span>{t.gradeNow}</span>
          </button>
          <button onClick={() => setView('reports')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${view === 'reports' ? 'bg-slate-800 text-white font-bold border-brand-500 shadow-xl ' + (isRTL ? 'border-r-4' : 'border-l-4') : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fas fa-chart-bar w-5"></i><span>{t.globalReports}</span>
          </button>
          <div className="py-6"><div className="h-px bg-slate-800"></div></div>
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${view === 'settings' ? 'bg-slate-800 text-white font-bold border-brand-500 shadow-xl ' + (isRTL ? 'border-r-4' : 'border-l-4') : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fas fa-paint-brush w-5"></i><span>{t.branding}</span>
          </button>
          <button onClick={() => setView('billing')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${view === 'billing' ? 'bg-slate-800 text-white font-bold border-brand-500 shadow-xl ' + (isRTL ? 'border-r-4' : 'border-l-4') : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <i className="fas fa-credit-card w-5"></i><span>{t.subscription}</span>
          </button>
        </nav>

        <div className="pt-8 mt-8 border-t border-slate-800 space-y-4">
           <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-black">{teacher.name.charAt(0)}</div>
              <div className="text-[10px] text-slate-500 font-bold overflow-hidden truncate">Signed in: {teacher.email}</div>
           </div>
           <button onClick={onLogout} className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-red-400 hover:bg-red-950/30 transition-all font-bold text-sm">
            <i className="fas fa-power-off w-5"></i><span>{t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {view === 'list' && <QuizList onEdit={handleEdit} />}
          {(view === 'create' || view === 'edit') && (
            <QuizBuilder quiz={editingQuiz} onCancel={handleFinishBuilder} onSave={handleFinishBuilder} />
          )}
          {view === 'grading' && <GradingView teacherId={teacherId!} onBack={() => setView('list')} />}
          {view === 'reports' && <ReportsView teacherId={teacherId!} />}
          {view === 'settings' && <TeacherSettings teacher={teacher} onUpdate={loadTeacher} />}
          {view === 'billing' && <BillingSection teacher={teacher} onUpdate={loadTeacher} />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
