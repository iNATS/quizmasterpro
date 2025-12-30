
import React, { useState, useEffect } from 'react';
import { DB } from '../../services/db';
import { Quiz, Submission, Teacher } from '../../types';
import { exportToCSV } from '../../utils/export';
import { translations } from '../../translations';

const ReportsView: React.FC<{ teacherId: string }> = ({ teacherId }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      const tData = await DB.getTeacherById(teacherId);
      setTeacher(tData);
      
      const qData = await DB.getQuizzes(teacherId);
      setQuizzes(qData);
      
      const allSubs: Submission[] = [];
      for (const q of qData) {
        const s = await DB.getSubmissionsForQuiz(q.id);
        allSubs.push(...s);
      }
      setSubmissions(allSubs);
      setLoading(false);
    };
    loadAllData();
  }, [teacherId]);

  if (loading || !teacher) return <div className="text-center py-20 animate-pulse font-bold text-slate-400">Aggregating Institutional Analytics...</div>;

  const t = translations[teacher.settings.language || 'en'];
  const isRTL = teacher.settings.isRTL;

  const stats = {
    totalSubmissions: submissions.length,
    avgScore: submissions.length ? (submissions.reduce((acc, s) => acc + (s.score / s.totalPoints), 0) / submissions.length * 100).toFixed(1) : 0,
    completionRate: quizzes.length ? (submissions.length / quizzes.length).toFixed(1) : 0
  };

  const scoreBuckets = [0, 0, 0, 0, 0]; 
  submissions.forEach(s => {
    const pct = (s.score / s.totalPoints) * 100;
    const idx = Math.min(Math.floor(pct / 20), 4);
    scoreBuckets[idx]++;
  });
  const maxBucket = Math.max(...scoreBuckets, 1);

  const handleGlobalExport = () => {
    const headers = ['Student Name', 'Quiz Title', 'Score', 'Total', 'Date'];
    const rows = submissions.map(s => [
      s.studentName,
      quizzes.find(q => q.id === s.quizId)?.title || 'N/A',
      s.score,
      s.totalPoints,
      new Date(s.submittedAt).toLocaleDateString()
    ]);
    exportToCSV(`Global_Report_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{t.insights}</h2>
          <p className="text-slate-500">{t.performanceMetrics}</p>
        </div>
        <button onClick={handleGlobalExport} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 flex items-center gap-2">
          <i className="fas fa-file-excel"></i> {t.exportMaster}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.engagedStudents}</div>
           <div className="text-4xl font-black text-slate-900">{stats.totalSubmissions}</div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.masteryIndex}</div>
           <div className="text-4xl font-black text-slate-900">{stats.avgScore}%</div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.engagementDensity}</div>
           <div className="text-4xl font-black text-slate-900">{stats.completionRate}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="font-black text-slate-800 mb-8 uppercase tracking-tighter text-sm">{t.distribution}</h3>
           <div className="flex items-end justify-between h-48 gap-4 px-4">
              {['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'].map((label, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full bg-slate-50 rounded-t-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                      <div 
                        className="bg-brand-500 rounded-t-lg transition-all duration-1000 group-hover:bg-brand-400" 
                        style={{ height: `${(scoreBuckets[i] / maxBucket) * 100}%` }}
                      ></div>
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center leading-none">{label}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="font-black text-slate-800 mb-8 uppercase tracking-tighter text-sm">{t.topAssessments}</h3>
           <div className="space-y-4">
             {quizzes.slice(0, 5).map(q => {
               const qSubs = submissions.filter(s => s.quizId === q.id);
               const avg = qSubs.length ? (qSubs.reduce((a, b) => a + (b.score/b.totalPoints), 0) / qSubs.length * 100).toFixed(0) : 0;
               return (
                 <div key={q.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-slate-700 truncate">{q.title}</span>
                        <span className="text-xs font-black text-slate-400">{avg}%</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${avg}%` }}></div>
                      </div>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
         <table className="w-full text-left">
           <thead>
             <tr className="bg-slate-50 border-b border-slate-100">
               <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.candidate}</th>
               <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.module}</th>
               <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.result}</th>
               <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.submittedAt}</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {submissions.slice(0, 10).map(s => (
               <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                 <td className="px-10 py-5 font-bold text-slate-700">{s.studentName}</td>
                 <td className="px-10 py-5 text-sm text-slate-500">{quizzes.find(q => q.id === s.quizId)?.title}</td>
                 <td className="px-10 py-5">
                   <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black border border-green-100">
                     {s.score} / {s.totalPoints}
                   </span>
                 </td>
                 <td className="px-10 py-5 text-xs text-slate-400">{new Date(s.submittedAt).toLocaleDateString()}</td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
};

export default ReportsView;
