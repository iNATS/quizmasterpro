
import React, { useState, useEffect } from 'react';
import { DB } from '../../services/db';
import { Quiz, Submission, Teacher, Question } from '../../types';
import { getQRCodeUrl } from '../../utils/qr';
import { translations, Language } from '../../translations';

interface QuizTakingProps {
  quizId: string;
}

const QuizTaking: React.FC<QuizTakingProps> = ({ quizId }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [started, setStarted] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, number | string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [timeState, setTimeState] = useState<{ status: 'not-started' | 'active' | 'ended', timeLeft?: number }>({ status: 'active' });

  const lang: Language = teacher?.settings.language || 'en';
  const t = translations[lang];
  const isRTL = teacher?.settings.isRTL || false;

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      const q = await DB.getQuizById(quizId);
      if (q) {
        setQuiz(q);
        const teach = await DB.getTeacherById(q.teacherId);
        setTeacher(teach);
        checkStatus(q);
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!quiz) return;
    const timer = setInterval(() => checkStatus(quiz), 1000);
    return () => clearInterval(timer);
  }, [quiz]);

  const checkStatus = (q: Quiz) => {
    const now = new Date();
    const start = new Date(q.startTime);
    const end = new Date(q.endTime);
    if (now < start) setTimeState({ status: 'not-started', timeLeft: Math.floor((start.getTime() - now.getTime()) / 1000) });
    else if (now > end) setTimeState({ status: 'ended' });
    else setTimeState({ status: 'active', timeLeft: Math.floor((end.getTime() - now.getTime()) / 1000) });
  };

  const handleStart = () => { 
    if (!firstName || !lastName || !phone || !email) {
      alert("All fields are required.");
      return;
    }
    setStarted(true); 
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    let autoScore = 0;
    const totalPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0);
    const answersArray: (number | string)[] = quiz.questions.map(q => currentAnswers[q.id] ?? (q.type === 'text' ? '' : -1));
    
    quiz.questions.forEach((q) => {
      if (q.type === 'choice' && currentAnswers[q.id] === q.correctAnswerIndex) {
        autoScore += q.points;
      }
    });

    const subId = `SUB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const requiresManual = quiz.questions.some(q => q.type === 'text');

    const submission: Submission = {
      id: subId,
      quizId: quiz.id,
      teacherId: quiz.teacherId,
      studentName: `${firstName} ${lastName}`,
      studentEmail: email,
      firstName,
      lastName,
      phone,
      answers: answersArray,
      score: autoScore, // Initial score from choice questions only
      totalPoints,
      status: requiresManual ? 'pending' : 'graded',
      submittedAt: new Date().toISOString()
    };

    try {
      await DB.addSubmission(submission);
      setSubmissionId(subId);
      setFinalScore(autoScore);
      setMaxScore(totalPoints);
      setIsFinished(true);
    } catch (e) {
      alert("Submission error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Portal...</div>;
  if (!quiz) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">Not Found</div>;

  const brandColor = teacher?.settings.brandColor || '#2563eb';
  const verificationUrl = `${window.location.origin}${window.location.pathname}#/verify/${submissionId}`;

  // State: Quiz Not Started Yet
  if (timeState.status === 'not-started') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-200 text-center max-w-xl w-full">
           <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-600 mx-auto mb-8 shadow-inner">
             <i className="fas fa-clock text-4xl"></i>
           </div>
           <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">{t.quizNotStarted}</h1>
           <p className="text-slate-500 text-lg mb-10">{t.waitMessage}</p>
           
           <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 inline-block px-12">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Countdown</div>
              <div className="text-5xl font-black text-slate-900 tabular-nums">
                {timeState.timeLeft ? `${Math.floor(timeState.timeLeft/3600)}h ${Math.floor((timeState.timeLeft%3600)/60)}m ${timeState.timeLeft%60}s` : '--'}
              </div>
           </div>
           
           <div className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400">{t.starts}: {new Date(quiz.startTime).toLocaleString()}</p>
           </div>
        </div>
      </div>
    );
  }

  // State: Quiz Ended
  if (timeState.status === 'ended' && !started) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-200 text-center max-w-xl w-full">
           <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-8">
             <i className="fas fa-calendar-times text-4xl"></i>
           </div>
           <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">{t.quizEnded}</h1>
           <p className="text-slate-500 text-lg mb-12">{t.endedMessage}</p>
           <button onClick={() => window.location.hash = '#/'} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all">{t.backHome}</button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const isPending = quiz.questions.some(q => q.type === 'text');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-300 print:bg-white overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Noto+Sans+Arabic:wght@400;700;900&family=Playfair+Display:ital,wght@1,700&display=swap');
          @media print {
            body { background: white !important; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            #cert-container { 
              box-shadow: none !important; 
              border: none !important; 
              margin: 0 !important;
              width: 297mm;
              height: 210mm;
            }
            @page { size: A4 landscape; margin: 0; }
          }
        `}} />
        
        <div className="no-print mb-8 flex flex-col items-center gap-6">
           {isPending ? (
              <div className="bg-amber-900/10 border border-amber-900/20 text-amber-900 px-10 py-6 rounded-3xl text-center shadow-xl backdrop-blur-md max-w-lg">
                <i className="fas fa-hourglass-half text-3xl mb-3"></i>
                <h2 className="text-2xl font-black">{t.pendingGrading}</h2>
                <p className="text-sm font-medium mt-1">Your auto-graded score is {finalScore}/{maxScore}. A teacher will review your text answers soon.</p>
              </div>
           ) : (
              <div className="flex gap-4">
                 <button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2">
                   <i className="fas fa-crown text-yellow-500"></i> Download Luxury Diploma
                 </button>
                 <button onClick={() => window.location.hash = '#/'} className="px-10 py-4 bg-white border-2 border-slate-300 rounded-2xl font-bold hover:bg-slate-50">{t.back}</button>
              </div>
           )}
        </div>

        {/* Certificate Section Only for non-pending or just as preview */}
        <div id="cert-container" className="bg-white w-[297mm] h-[210mm] shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative flex flex-col items-center shrink-0 select-none overflow-hidden p-2">
          <div className="absolute inset-4 border-[1px] border-[#D4AF37] opacity-60"></div>
          <div className="absolute inset-8 border-[6px] border-double border-[#D4AF37]"></div>
          <div className="z-10 w-full h-full flex flex-col items-center justify-between p-20 text-center">
            <div>
               <div className="flex justify-center mb-8">
                 {teacher?.settings.logoUrl ? (
                   <img src={teacher.settings.logoUrl} className="h-16 object-contain" />
                 ) : (
                    <div className="w-16 h-16 border-2 border-[#D4AF37] rotate-45 flex items-center justify-center">
                      <i className="fas fa-graduation-cap -rotate-45 text-[#D4AF37] text-2xl"></i>
                    </div>
                 )}
               </div>
               <h3 className="text-[#D4AF37] font-['Cinzel'] tracking-[0.4em] uppercase font-bold text-sm mb-4">{teacher?.settings.schoolName}</h3>
               <h1 className="text-slate-900 font-['Cinzel'] font-black text-6xl uppercase tracking-wider mb-2">{t.certificate}</h1>
               <div className="w-48 h-1 bg-[#D4AF37] mx-auto mb-10"></div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
               <p className="text-slate-400 font-medium italic mb-6">{t.awardedTo}</p>
               <h2 className={`text-7xl font-['Playfair_Display'] italic font-bold text-slate-800 mb-8 ${isRTL ? "font-['Noto_Sans_Arabic']" : ""}`}>
                  {firstName} {lastName}
               </h2>
               <div className="max-w-2xl mx-auto">
                 <p className="text-slate-600 leading-relaxed text-lg">
                   {t.forAchieving} <strong className="text-slate-900 font-black">{quiz.title}</strong>
                   <br/>
                   {t.degree}: <span className="text-[#D4AF37] font-black text-2xl">{isPending ? '--' : finalScore} / {maxScore}</span>
                 </p>
               </div>
            </div>
            <div className="w-full flex justify-between items-end px-12">
               <div className="text-center w-64 border-t border-[#D4AF37] pt-4">
                  <p className="font-['Cinzel'] font-bold text-slate-800 text-sm mb-1">{teacher?.name || t.manager}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.manager}</p>
               </div>
               <div className="relative">
                  <img src={getQRCodeUrl(verificationUrl)} className="w-20 h-20 grayscale opacity-80 border-2 border-[#D4AF37] p-1" />
                  <p className="text-[9px] font-black text-slate-400 mt-2 tracking-tighter uppercase">{t.id}: {submissionId}</p>
               </div>
               <div className="text-center w-64 border-t border-[#D4AF37] pt-4">
                  <p className="font-['Cinzel'] font-bold text-slate-800 text-sm mb-1">{new Date().toLocaleDateString()}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Conferral</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-12 text-center text-white">
             <i className="fas fa-id-card text-5xl text-brand-500 mb-6"></i>
             <h2 className="text-3xl font-black italic uppercase tracking-tighter">{quiz.title}</h2>
             <p className="text-slate-400 mt-2 text-sm">{quiz.description}</p>
          </div>
          <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.firstName}</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Ali" />
             </div>
             <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.lastName}</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Hassan" />
             </div>
             <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.phone}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder={t.phonePlaceholder} />
             </div>
             <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="ali@student.com" />
             </div>
             <button onClick={handleStart} className="md:col-span-2 py-5 bg-brand-600 text-white rounded-[2rem] font-black text-xl hover:bg-brand-500 shadow-xl transition-all">
                {t.startQuiz}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-6 z-50 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center mb-12">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">{quiz.title.charAt(0)}</div>
            <div>
               <h2 className="font-black text-slate-800 tracking-tighter uppercase italic">{quiz.title}</h2>
               <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">{firstName} {lastName}</p>
            </div>
         </div>
         <div className="text-center">
            <div className="text-3xl font-black tabular-nums" style={{ color: timeState.timeLeft && timeState.timeLeft < 120 ? '#ef4444' : brandColor }}>
              {timeState.timeLeft ? `${Math.floor(timeState.timeLeft/60)}:${(timeState.timeLeft%60).toString().padStart(2,'0')}` : '0:00'}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.timeRemaining}</p>
         </div>
      </header>

      <div className="space-y-8">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
             <div className="flex gap-8 mb-10 items-start">
                <span className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white flex-shrink-0 shadow-lg" style={{ backgroundColor: brandColor }}>{idx+1}</span>
                <div className="flex-1">
                  <p className="text-2xl font-black text-slate-800 leading-tight mb-2 tracking-tighter">{q.text}</p>
                  <span className="inline-block px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">{q.points} {t.points}</span>
                </div>
             </div>

             {q.type === 'choice' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => (
                    <button 
                      key={oIdx} 
                      onClick={() => setCurrentAnswers({...currentAnswers, [q.id]: oIdx})} 
                      className={`p-6 rounded-3xl border-2 text-right font-bold text-lg transition-all flex items-center gap-4 ${currentAnswers[q.id] === oIdx ? 'border-brand-500 bg-brand-50' : 'border-slate-50 bg-slate-50/50'}`} 
                    >
                      <div className={`w-6 h-6 rounded-full border-4 flex-shrink-0 ${currentAnswers[q.id] === oIdx ? 'bg-white' : 'bg-transparent'}`} style={{ borderColor: currentAnswers[q.id] === oIdx ? brandColor : '#cbd5e1' }}></div>
                      {opt}
                    </button>
                  ))}
                </div>
             ) : (
                <textarea 
                   rows={4}
                   value={currentAnswers[q.id] as string || ''}
                   onChange={(e) => setCurrentAnswers({...currentAnswers, [q.id]: e.target.value})}
                   placeholder="Type your answer here..."
                   className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-brand-500 font-bold transition-all"
                />
             )}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={submitting} className="w-full mt-12 py-6 rounded-[2.5rem] font-black text-2xl text-white shadow-2xl transition-all hover:scale-105" style={{ backgroundColor: brandColor }}>
          {submitting ? '...' : t.submitQuiz}
      </button>
    </div>
  );
};

export default QuizTaking;
