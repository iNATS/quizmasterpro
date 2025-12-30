
import React, { useState } from 'react';
import { DB } from '../../services/db';
import { Submission } from '../../types';
import { translations } from '../../translations';

const ParentDashboard: React.FC = () => {
  const [childEmail, setChildEmail] = useState('');
  const [data, setData] = useState<Submission[] | null>(null);
  const [loading, setLoading] = useState(false);
  
  const lang = 'en'; 
  const t = translations[lang];

  const handleMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const results = await DB.getSubmissionsByEmail(childEmail.toLowerCase());
    setData(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-16">
           <button onClick={() => window.location.hash = '#/'} className="px-6 py-2 bg-slate-100 rounded-full text-slate-600 font-bold text-sm hover:bg-slate-200">
             {t.backHome}
           </button>
           <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest border-b-4 border-emerald-400 pb-1">{t.parentPortal}</h1>
        </header>

        {!data ? (
          <div className="max-w-2xl mx-auto bg-slate-50 p-12 rounded-[4rem] border border-slate-100 shadow-sm text-center">
             <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-8">
               <i className="fas fa-shield-heart text-3xl"></i>
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-4">{t.monitorProgress}</h2>
             <p className="text-slate-500 mb-10">Link to your child's academic journey using their student email address.</p>
             <form onSubmit={handleMonitor} className="space-y-4">
                <input 
                  required
                  type="email" 
                  value={childEmail}
                  onChange={e => setChildEmail(e.target.value)}
                  placeholder={t.childEmail}
                  className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[2rem] font-bold outline-none shadow-inner"
                />
                <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg hover:bg-emerald-500 shadow-xl transition-all">
                  {loading ? t.verifying : t.startMonitoring}
                </button>
             </form>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                   <div className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] shadow-sm">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Recent Milestones</h3>
                      <div className="space-y-6">
                        {data.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
                                   <i className="fas fa-award"></i>
                                </div>
                                <div>
                                   <div className="font-bold text-slate-800">ID {s.id.slice(0,6).toUpperCase()}</div>
                                   <div className="text-[10px] text-slate-400 uppercase font-black">{new Date(s.submittedAt).toLocaleDateString()}</div>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-xl font-black text-emerald-600">{((s.score/s.totalPoints)*100).toFixed(0)}%</div>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-emerald-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-6">Learning Pulse</h3>
                      <div className="flex items-baseline gap-2 mb-1">
                         <span className="text-6xl font-black">{(data.reduce((a,b) => a+(b.score/b.totalPoints),0)/data.length*100).toFixed(0)}</span>
                         <span className="text-xl font-bold text-emerald-400">%</span>
                      </div>
                      <p className="text-sm text-emerald-200">Consistency over {data.length} assessments.</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
