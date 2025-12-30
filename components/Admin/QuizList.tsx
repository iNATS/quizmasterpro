
import React, { useState, useEffect } from 'react';
import { DB } from '../../services/db';
import { Quiz, Submission, Teacher } from '../../types';
import { exportToCSV } from '../../utils/export';
import { translations } from '../../translations';

interface QuizListProps {
  onEdit: (quiz: Quiz) => void;
}

const QuizList: React.FC<QuizListProps> = ({ onEdit }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const teacherId = localStorage.getItem('teacher_id');

  const loadData = async () => {
    if (!teacherId) return;
    setLoading(true);
    const tData = await DB.getTeacherById(teacherId);
    setTeacher(tData);
    
    const data = await DB.getQuizzes(teacherId);
    setQuizzes(data);
    
    const counts: Record<string, number> = {};
    for (const q of data) {
      const subs = await DB.getSubmissionsForQuiz(q.id);
      counts[q.id] = subs.length;
    }
    setSubmissionCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      await DB.deleteQuiz(id);
      loadData();
    }
  };

  const handleExport = async (quiz: Quiz) => {
    const submissions = await DB.getSubmissionsForQuiz(quiz.id);
    if (submissions.length === 0) {
      alert("No submissions yet for this quiz.");
      return;
    }

    const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Score', 'Total', 'Date'];
    const rows = submissions.map(s => [
      s.firstName,
      s.lastName,
      s.phone,
      s.studentEmail,
      s.score,
      s.totalPoints,
      new Date(s.submittedAt).toLocaleString(),
    ]);

    exportToCSV(`Report_${quiz.title.replace(/\s+/g, '_')}.csv`, headers, rows);
  };

  const handleCopyLink = (id: string) => {
    // Robust URL generation: ensures it uses the same origin and path the app is running on
    const baseUrl = window.location.href.split('#')[0];
    const url = `${baseUrl}#/quiz/${id}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
    }).catch(err => {
      alert("Failed to copy link. Manual link: " + url);
    });
  };

  if (loading || !teacher) return <div className="text-center py-20 font-bold text-slate-400">Loading assessments...</div>;

  const lang = teacher.settings.language || 'en';
  const t = translations[lang];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">{t.yourQuizzes}</h2>
          <p className="text-slate-500 mt-1">{t.isolatedWorkspace}</p>
        </div>
        <button onClick={loadData} className="p-2 text-slate-400 hover:text-brand-600 transition-colors">
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <i className="fas fa-folder-open text-5xl text-slate-300 mb-4"></i>
          <h3 className="text-xl font-medium text-slate-600">No quizzes in this workspace</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all hover:shadow-xl">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{quiz.title}</h3>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-brand-600"><i className="fas fa-users"></i> {submissionCounts[quiz.id] || 0} {t.responses}</span>
                  <span className="flex items-center gap-1"><i className="far fa-clock"></i> {t.starts}: {new Date(quiz.startTime).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCopyLink(quiz.id)} className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 text-sm font-bold border border-slate-200">
                  {copySuccess === quiz.id ? t.copied : t.share}
                </button>
                <button onClick={() => handleExport(quiz)} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-bold shadow-lg">
                  {t.report}
                </button>
                <button onClick={() => onEdit(quiz)} className="p-2 text-slate-300 hover:text-brand-600"><i className="fas fa-edit"></i></button>
                <button onClick={() => handleDelete(quiz.id)} className="p-2 text-slate-300 hover:text-red-500"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList;
