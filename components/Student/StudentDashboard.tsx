
import React, { useState, useEffect } from 'react';
import { DB } from '../../services/db';
import { Submission, Quiz } from '../../types';
import { translations } from '../../translations';

const StudentDashboard: React.FC = () => {
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [phone, setPhone] = useState('');
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default to English. In a real scenario, this might come from the school settings
  const lang = 'en'; 
  const t = translations[lang];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fName || !lName || !phone) return;
    
    setLoading(true);
    try {
      const data = await DB.getSubmissionsByIdentity(fName, lName, phone);
      if (data.length === 0) {
        setError("No records found with these details.");
      } else {
        setSubmissions(data);
        // Fetch quiz titles for the submissions
        const quizMap: Record<string, Quiz> = {};
        for (const sub of data) {
          if (!quizMap[sub.quizId]) {
            const q = await DB.getQuizById(sub.quizId);
            if (q) quizMap[sub.quizId] = q;
          }
        }
        setQuizzes(quizMap);
      }
    } catch (err) {
      setError("An error occurred while fetching your records.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
           <button onClick={() => window.location.hash = '#/'} className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2">
             <i className="fas fa-arrow-left"></i> {t.backHome}
           </button>
           <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{t.studentPortal}</h1>
        </header>

        {!submissions ? (
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 text-center max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
             <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-600 mx-auto mb-8">
               <i className="fas fa-user-graduate text-3xl"></i>
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-4">{t.academicRecords}</h2>
             <p className="text-slate-500 mb-8">Enter the details you used when taking your assessments to access your results.</p>
             
             {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}

             <form onSubmit={handleSearch} className="space-y-4 text-left">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-2">{t.firstName}</label>
                   <input 
                    required
                    type="text" 
                    value={fName}
                    onChange={e => setFName(e.target.value)}
                    placeholder="Ali"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-brand-100"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-2">{t.lastName}</label>
                   <input 
                    required
                    type="text" 
                    value={lName}
                    onChange={e => setLName(e.target.value)}
                    placeholder="Hassan"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-brand-100"
                   />
                 </div>
               </div>
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-2">{t.phone}</label>
                 <input 
                  required
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0xxxxxxxxx"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-brand-100"
                 />
               </div>
               <button type="submit" disabled={loading} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-lg hover:bg-brand-500 shadow-xl transition-all mt-4">
                 {loading ? t.verifying : t.accessDashboard}
               </button>
             </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
             <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="z-10">
                   <p className="text-brand-400 font-black uppercase text-[10px] tracking-widest mb-1">Student Profile</p>
                   <h2 className="text-4xl font-black tracking-tighter">{submissions[0]?.studentName}</h2>
                   <p className="text-slate-400 font-medium">Verified Phone: {phone}</p>
                </div>
                <div className="flex gap-4 z-10">
                   <div className="text-center bg-slate-800 px-8 py-5 rounded-3xl border border-slate-700 shadow-lg">
                      <div className="text-3xl font-black">{submissions.length}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Quizzes</div>
                   </div>
                   <div className="text-center bg-brand-900/40 px-8 py-5 rounded-3xl border border-brand-800 shadow-lg">
                      <div className="text-3xl font-black text-brand-400">
                        {Math.round(submissions.reduce((acc, s) => acc + (s.score / s.totalPoints), 0) / submissions.length * 100)}%
                      </div>
                      <div className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Avg Mastery</div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map(s => (
                  <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                           <i className="fas fa-certificate text-xl"></i>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(s.submittedAt).toLocaleDateString()}</span>
                     </div>
                     <h3 className="text-xl font-black text-slate-900 mb-2 truncate">
                        {quizzes[s.quizId]?.title || 'Assessment Record'}
                     </h3>
                     <div className="flex items-center gap-3 mb-8">
                        <div className="h-2 flex-1 bg-slate-50 rounded-full overflow-hidden">
                           <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${(s.score/s.totalPoints)*100}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-slate-900">{s.score}/{s.totalPoints}</span>
                     </div>
                     <button 
                        onClick={() => window.location.hash = `#/verify/${s.id}`}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md group-hover:shadow-lg"
                      >
                       <i className="fas fa-crown mr-2 text-yellow-400"></i> {t.certificate}
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
