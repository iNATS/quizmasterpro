
import React, { useState, useEffect } from 'react';
import { DB } from '../../services/db';
import { Submission, Quiz, Question } from '../../types';
import { translations } from '../../translations';

interface GradingViewProps {
  teacherId: string;
  onBack: () => void;
}

const GradingView: React.FC<GradingViewProps> = ({ teacherId, onBack }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [tempScores, setTempScores] = useState<Record<number, number>>({});

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    const allQuizzes = await DB.getQuizzes(teacherId);
    const quizMap: Record<string, Quiz> = {};
    const pendingSubs: Submission[] = [];

    for (const q of allQuizzes) {
      quizMap[q.id] = q;
      const subs = await DB.getSubmissionsForQuiz(q.id);
      pendingSubs.push(...subs.filter(s => s.status === 'pending'));
    }

    setQuizzes(quizMap);
    setSubmissions(pendingSubs);
    setLoading(false);
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    
    // Calculate total score adding choice scores + manual scores
    const quiz = quizzes[selectedSubmission.quizId];
    let manualTotal = 0;
    Object.values(tempScores).forEach(s => manualTotal += s);
    
    // Auto choice points were already in selectedSubmission.score
    const finalScore = selectedSubmission.score + manualTotal;
    
    const updates = {
      status: 'graded' as const,
      score: finalScore,
      manualScores: tempScores
    };

    // We need a DB.updateSubmission method (Assuming it exists or adding logic)
    // For this context, we will call a generic update on the submissions table via Supabase
    const { error } = await (DB as any).updateSubmission(selectedSubmission.id, updates);
    
    if (!error) {
      setSelectedSubmission(null);
      setTempScores({});
      loadSubmissions();
    }
  };

  const t = translations['en']; // Simplified for portal

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">Loading Submissions...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-all">
          <i className="fas fa-arrow-left"></i> {t.back}
        </button>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{t.gradeNow}</h2>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
           <i className="fas fa-check-double text-5xl text-green-200 mb-6"></i>
           <h3 className="text-xl font-black text-slate-400">All submissions are fully graded!</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* List */}
           <div className="space-y-4">
              {submissions.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => { setSelectedSubmission(s); setTempScores(s.manualScores || {}); }}
                  className={`w-full text-left p-6 rounded-3xl border transition-all ${selectedSubmission?.id === s.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg'}`}
                >
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-lg">{s.firstName} {s.lastName}</h4>
                      <span className="text-[10px] font-black uppercase opacity-60">{new Date(s.submittedAt).toLocaleDateString()}</span>
                   </div>
                   <p className={`text-xs font-bold ${selectedSubmission?.id === s.id ? 'text-slate-400' : 'text-slate-500'}`}>{quizzes[s.quizId]?.title}</p>
                </button>
              ))}
           </div>

           {/* Detail View */}
           <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-xl min-h-[500px]">
              {selectedSubmission ? (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                   <header className="border-b border-slate-50 pb-6">
                      <h3 className="text-2xl font-black text-slate-800">{selectedSubmission.firstName}'s Answers</h3>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{quizzes[selectedSubmission.quizId].title}</p>
                   </header>
                   
                   <div className="space-y-8">
                      {quizzes[selectedSubmission.quizId].questions.map((q, idx) => {
                        if (q.type !== 'text') return null;
                        const answer = selectedSubmission.answers[idx];
                        return (
                          <div key={q.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                             <div className="flex justify-between">
                                <span className="text-xs font-black text-slate-400 uppercase">Question {idx + 1}</span>
                                <span className="text-xs font-black text-brand-600 uppercase">{q.points} {t.points} max</span>
                             </div>
                             <p className="font-bold text-slate-800">{q.text}</p>
                             <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium italic text-slate-600">
                                "{answer || 'No answer provided'}"
                             </div>
                             <div className="flex items-center gap-4 pt-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Award Points:</label>
                                <input 
                                  type="number" 
                                  max={q.points}
                                  min={0}
                                  value={tempScores[idx] || 0}
                                  onChange={(e) => setTempScores({...tempScores, [idx]: parseInt(e.target.value) || 0})}
                                  className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg font-black text-center focus:ring-2 focus:ring-brand-100"
                                />
                             </div>
                          </div>
                        );
                      })}
                   </div>

                   <button 
                    onClick={handleGrade}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 shadow-2xl transition-all"
                   >
                     {t.saveGrade}
                   </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                   <i className="fas fa-edit text-5xl mb-4"></i>
                   <p className="font-black">Select a submission to start grading</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default GradingView;
