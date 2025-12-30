
import React, { useState, useEffect } from 'react';
import { DB } from '../../services/db';
import { Submission, Quiz } from '../../types';

interface ResultLookupProps {
  directSubId?: string;
}

const ResultLookup: React.FC<ResultLookupProps> = ({ directSubId }) => {
  const [accessCode, setAccessCode] = useState(directSubId || '');
  const [studentName, setStudentName] = useState('');
  const [foundSubmission, setFoundSubmission] = useState<Submission | null>(null);
  const [relatedQuiz, setRelatedQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (directSubId) {
      handleDirectLookup(directSubId);
    }
  }, [directSubId]);

  const handleDirectLookup = async (id: string) => {
    setLoading(true);
    try {
      const sub = await DB.getSubmissionById(id);
      if (sub) {
        const q = await DB.getQuizById(sub.quizId);
        setFoundSubmission(sub);
        setRelatedQuiz(q || null);
      } else {
        setError('Verification failed. Record not found.');
      }
    } catch (e) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const sub = await DB.getSubmissionById(accessCode);
      
      if (sub && sub.studentName.toLowerCase() === studentName.toLowerCase()) {
        const q = await DB.getQuizById(sub.quizId);
        setFoundSubmission(sub);
        setRelatedQuiz(q || null);
      } else {
        setError('No matching result found. Please check your name and code.');
        setFoundSubmission(null);
      }
    } catch (e) {
      setError('Connection error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (score: number, total: number) => {
    const pct = (score / total) * 100;
    if (pct >= 85) return { text: 'Excellent', class: 'bg-green-100 text-green-700' };
    if (pct >= 60) return { text: 'Passed', class: 'bg-blue-100 text-blue-700' };
    return { text: 'Failed', class: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {!foundSubmission ? (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-brand-600 p-10 text-white text-center">
              <h2 className="text-3xl font-extrabold mb-2">Student Portal</h2>
              <p className="opacity-80">Access your quiz results and certificate</p>
            </div>
            
            <form onSubmit={handleLookup} className="p-8 md:p-12 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                  <input 
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Access Code</label>
                  <input 
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="e.g. sub-uuid-123"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium animate-pulse text-center">
                <i className="fas fa-exclamation-triangle mr-2"></i>{error}
              </p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-extrabold text-lg shadow-lg shadow-brand-100 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <i className="fas fa-circle-notch animate-spin"></i> : null}
                {loading ? 'Searching...' : 'Find My Result'}
              </button>
              
              <button 
                type="button"
                onClick={() => window.location.hash = '#/'}
                className="w-full py-3 text-slate-400 hover:text-slate-600 font-medium"
              >
                Back to Home
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <span className="flex items-center gap-1 text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-200 shadow-sm">
                   <i className="fas fa-check-circle"></i> Verified Authentic
                 </span>
              </div>

              <div className="mb-8">
                <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
                  <i className="fas fa-user-graduate text-3xl"></i>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900">{foundSubmission.studentName}</h1>
                <p className="text-slate-500 font-medium">Official Result Statement</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="p-6 rounded-2xl bg-slate-50 text-left border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Quiz Assessment</div>
                  <div className="text-lg font-bold text-slate-800">{relatedQuiz?.title || 'Unknown Quiz'}</div>
                  <div className="text-sm text-slate-500 mt-1">{new Date(foundSubmission.submittedAt).toLocaleDateString()}</div>
                </div>
                <div className="p-6 rounded-2xl bg-brand-50 text-left border border-brand-100 relative overflow-hidden">
                  <div className="text-xs font-bold text-brand-400 uppercase mb-2">Final Degree</div>
                  <div className="text-3xl font-black text-brand-900">{foundSubmission.score} / {foundSubmission.totalPoints}</div>
                  <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getBadge(foundSubmission.score, foundSubmission.totalPoints).class}`}>
                    {getBadge(foundSubmission.score, foundSubmission.totalPoints).text}
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100 text-left">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Submission ID:</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">{foundSubmission.id}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Accuracy:</span>
                    <span className="font-bold text-brand-700">{((foundSubmission.score / foundSubmission.totalPoints) * 100).toFixed(1)}%</span>
                 </div>
              </div>

              <div className="mt-12 flex flex-col gap-3">
                 <button 
                  onClick={() => window.print()}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                 >
                   <i className="fas fa-print"></i> Generate PDF Record
                 </button>
                 <button 
                  onClick={() => setFoundSubmission(null)}
                  className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                 >
                   New Search
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultLookup;
