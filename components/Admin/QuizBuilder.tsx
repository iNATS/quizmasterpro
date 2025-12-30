
import React, { useState, useEffect } from 'react';
import { Quiz, Question, Teacher } from '../../types';
import { DB } from '../../services/db';
import { translations } from '../../translations';

interface QuizBuilderProps {
  quiz?: Quiz | null;
  onCancel: () => void;
  onSave: () => void;
}

const QuizBuilder: React.FC<QuizBuilderProps> = ({ quiz, onCancel, onSave }) => {
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [startTime, setStartTime] = useState(quiz?.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState(quiz?.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '');
  const [questions, setQuestions] = useState<Question[]>(quiz?.questions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const teacherId = localStorage.getItem('teacher_id');

  useEffect(() => {
    if (teacherId) {
      DB.getTeacherById(teacherId).then(setTeacher);
    }
  }, [teacherId]);

  const addQuestion = () => {
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: 'choice',
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      points: 1
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      setQuestions(newQuestions);
    }
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (qId: string) => {
    const q = questions.find(q => q.id === qId);
    if (q) updateQuestion(qId, { options: [...q.options, ''] });
  };

  const removeOption = (qId: string, optIdx: number) => {
    const q = questions.find(q => q.id === qId);
    if (q && q.options.length > 2) {
      const newOpts = q.options.filter((_, i) => i !== optIdx);
      updateQuestion(qId, { 
        options: newOpts,
        correctAnswerIndex: q.correctAnswerIndex >= newOpts.length ? 0 : q.correctAnswerIndex
      });
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!teacherId) {
      setError("No teacher identity found. Please re-login.");
      return;
    }
    if (!title || !startTime || !endTime || questions.length === 0) {
      setError("Please fill in all basic fields and add at least one question.");
      return;
    }

    setSaving(true);
    try {
      const requiresManual = questions.some(q => q.type === 'text');
      const quizData: Omit<Quiz, 'id'> = {
        teacherId,
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        questions,
        requiresManualGrading: requiresManual,
        createdAt: quiz?.createdAt || new Date().toISOString()
      };

      if (quiz?.id) {
        await DB.updateQuiz(quiz.id, quizData);
      } else {
        await DB.addQuiz(quizData);
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "Database communication error.");
    } finally {
      setSaving(false);
    }
  };

  if (!teacher) return null;

  const t = translations[teacher.settings.language || 'en'];
  const isRTL = teacher.settings.isRTL;

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-slate-200">
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{quiz ? t.updateQuiz : t.newAssessment}</h2>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">{t.back}</button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 disabled:opacity-50">
            {saving ? '...' : t.deployQuiz}
          </button>
        </div>
      </div>

      {error && <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3"><i className="fas fa-exclamation-triangle"></i>{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">{t.displayTitle}</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-100 outline-none transition-all text-xl font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">{t.openingTime}</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">{t.deadline}</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800">{t.questionSet}</h3>
          <button onClick={addQuestion} className="px-4 py-2 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100">+ {t.addQuestion}</button>
        </div>
        
        {questions.map((q, idx) => (
          <div key={q.id} className="p-8 rounded-3xl border-2 border-slate-100 bg-slate-50/50 space-y-6 relative group">
            <div className={`absolute top-6 flex gap-2 ${isRTL ? 'left-6' : 'right-6'}`}>
               <button onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0} className="p-2 text-slate-300 hover:text-brand-600 disabled:opacity-20"><i className="fas fa-arrow-up"></i></button>
               <button onClick={() => moveQuestion(idx, 'down')} disabled={idx === questions.length - 1} className="p-2 text-slate-300 hover:text-brand-600 disabled:opacity-20"><i className="fas fa-arrow-down"></i></button>
               <button onClick={() => removeQuestion(q.id)} className="p-2 text-slate-300 hover:text-red-500"><i className="fas fa-trash"></i></button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black flex-shrink-0">{idx + 1}</span>
                <div className="space-y-1 text-center">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t.points}</label>
                   <input 
                      type="number" 
                      min="1" 
                      value={q.points} 
                      onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })} 
                      className="w-12 py-1 text-center border-b-2 border-slate-300 bg-transparent font-bold outline-none focus:border-brand-500"
                   />
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.questionType}</label>
                     <select 
                        value={q.type} 
                        onChange={(e) => updateQuestion(q.id, { type: e.target.value as 'choice' | 'text' })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none font-bold"
                     >
                        <option value="choice">{t.multipleChoice}</option>
                        <option value="text">{t.shortText}</option>
                     </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.questionSet}</label>
                    <input type="text" value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} placeholder="..." className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                </div>

                {q.type === 'choice' && (
                  <div className="space-y-3">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-3 group/opt">
                        <input 
                          type="radio" 
                          name={`q-${q.id}`}
                          checked={q.correctAnswerIndex === optIdx} 
                          onChange={() => updateQuestion(q.id, { correctAnswerIndex: optIdx })} 
                          className="w-5 h-5 accent-brand-600" 
                        />
                        <input type="text" value={opt} onChange={(e) => {
                          const n = [...q.options]; n[optIdx] = e.target.value; updateQuestion(q.id, { options: n });
                        }} className="flex-1 px-4 py-2 bg-white border border-slate-100 rounded-lg outline-none" />
                        {q.options.length > 2 && (
                          <button onClick={() => removeOption(q.id, optIdx)} className="p-2 text-slate-200 hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-opacity">
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addOption(q.id)} className="text-sm font-bold text-brand-600 hover:text-brand-700 mt-2 flex items-center gap-1">
                      <i className="fas fa-plus-circle"></i> {t.addChoice}
                    </button>
                  </div>
                )}

                {q.type === 'text' && (
                  <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl text-xs font-bold border border-blue-100">
                    <i className="fas fa-info-circle mr-2"></i> This question will require manual correction by you after the student submits the quiz.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizBuilder;
