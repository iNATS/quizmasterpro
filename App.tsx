
import React, { useState, useEffect } from 'react';
import { DB } from './services/db';
import AdminDashboard from './components/Admin/AdminDashboard';
import QuizTaking from './components/Student/QuizTaking';
import AdminLogin from './components/Auth/AdminLogin';
import ResultLookup from './components/Student/ResultLookup';
import SuperAdminPanel from './components/SuperAdmin/SuperAdminPanel';
import StudentDashboard from './components/Student/StudentDashboard';
import ParentDashboard from './components/Parent/ParentDashboard';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(
    localStorage.getItem('teacher_session') === 'active'
  );
  const [isSuperAuthenticated, setIsSuperAuthenticated] = useState(
    localStorage.getItem('super_session') === 'active'
  );
  const [dbReady] = useState(DB.isConfigured());

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTeacherLogin = () => {
    setIsTeacherAuthenticated(true);
    localStorage.setItem('teacher_session', 'active');
    window.location.hash = '#/admin';
  };

  const handleSuperLogin = () => {
    setIsSuperAuthenticated(true);
    localStorage.setItem('super_session', 'active');
    window.location.hash = '#/super-admin';
  };

  const handleLogout = () => {
    setIsTeacherAuthenticated(false);
    setIsSuperAuthenticated(false);
    localStorage.removeItem('teacher_session');
    localStorage.removeItem('super_session');
    localStorage.removeItem('teacher_id');
    window.location.hash = '#/admin/login';
  };

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-center p-6">
        <div>
          <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
          <h1 className="text-2xl font-bold">System Configuration Error</h1>
          <p className="text-slate-400 mt-2 max-w-sm mx-auto">Please ensure Database Vault credentials are set correctly in services/db.ts.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (route.startsWith('#/verify/')) {
      const subId = route.replace('#/verify/', '');
      return <ResultLookup directSubId={subId} />;
    }

    if (route === '#/super-admin') {
      if (!isSuperAuthenticated) {
        window.location.hash = '#/admin/login';
        return <AdminLogin onLogin={handleTeacherLogin} onSuperAdminLogin={handleSuperLogin} />;
      }
      return <SuperAdminPanel onLogout={handleLogout} />;
    }

    if (route.startsWith('#/quiz/')) {
      const quizId = route.replace('#/quiz/', '');
      return <QuizTaking quizId={quizId} />;
    }

    if (route === '#/student') return <StudentDashboard />;
    // Parent Portal hidden for now
    if (route === '#/parent') return <div className="p-20 text-center font-bold text-slate-400">Portal is currently restricted.</div>;
    if (route.startsWith('#/results')) return <ResultLookup />;

    if (route === '#/admin/login') {
      return <AdminLogin onLogin={handleTeacherLogin} onSuperAdminLogin={handleSuperLogin} />;
    }

    if (route.startsWith('#/admin')) {
      if (!isTeacherAuthenticated) {
        window.location.hash = '#/admin/login';
        return <AdminLogin onLogin={handleTeacherLogin} onSuperAdminLogin={handleSuperLogin} />;
      }
      return <AdminDashboard onLogout={handleLogout} />;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-4xl w-full text-center">
          <div className="bg-slate-900 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <i className="fas fa-graduation-cap text-4xl text-white"></i>
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">QuizMaster</h1>
          <p className="text-slate-500 mb-16 text-xl leading-relaxed font-medium">Enterprise Assessment Management & Certification Engine.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <button onClick={() => window.location.hash = '#/student'} className="group bg-white p-10 rounded-[3rem] border border-slate-200 hover:border-brand-500 transition-all shadow-sm hover:shadow-2xl">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-graduate text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Student Portal</h3>
              <p className="text-sm text-slate-400 font-medium">View your history and certificates</p>
            </button>

            <button onClick={() => window.location.hash = '#/admin'} className="group bg-slate-900 p-10 rounded-[3rem] text-white hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-brand-500 mx-auto mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-shield text-2xl"></i>
              </div>
              <h3 className="text-xl font-black mb-2">Educator Portal</h3>
              <p className="text-sm text-slate-500 font-medium">Manage quizzes and analytics</p>
            </button>
          </div>
          
          <p className="mt-16 text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Institutional Grade Assessment Infrastructure</p>
        </div>
      </div>
    );
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">{renderContent()}</div>;
};

export default App;
