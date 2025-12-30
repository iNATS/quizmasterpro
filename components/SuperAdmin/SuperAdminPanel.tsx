
import React, { useState, useEffect } from 'react';
import { DB } from '../../services/db';
import { Teacher, SubscriptionPlan, AppSettings } from '../../types';
import { hashPassword } from '../../utils/security';
import { translations, Language } from '../../translations';

const SuperAdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    isActive: true, 
    plan: 'basic' as SubscriptionPlan,
    language: 'en' as Language,
    isRTL: false
  });

  // Since Super Admin is a global role, we use English for its own interface 
  // but it configures the teachers' interfaces.
  const t = translations['en'];

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await DB.getTeachers();
      setTeachers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: '', 
      isActive: teacher.isActive,
      plan: teacher.plan,
      language: teacher.settings?.language || 'en',
      isRTL: teacher.settings?.isRTL || false
    });
    setShowModal('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showModal === 'create') {
        const hashedPass = await hashPassword(formData.password || 'password123');
        await DB.addTeacher({
          name: formData.name,
          email: formData.email,
          password: hashedPass,
          isActive: formData.isActive,
          plan: formData.plan,
          settings: {
            brandColor: '#2563eb',
            schoolName: formData.name,
            theme: 'blue',
            language: formData.language,
            isRTL: formData.isRTL
          }
        });
      } else if (showModal === 'edit' && selectedTeacher) {
        const updates: Partial<Teacher> = {
          name: formData.name,
          email: formData.email,
          isActive: formData.isActive,
          plan: formData.plan,
          settings: {
            ...selectedTeacher.settings,
            language: formData.language,
            isRTL: formData.isRTL
          }
        };
        if (formData.password) {
          updates.password = await hashPassword(formData.password);
        }
        await DB.updateTeacher(selectedTeacher.id, updates);
      }
      setShowModal(null);
      loadTeachers();
    } catch (e) {
      alert("Operation failed. Ensure the email is unique.");
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (confirm("Permanently remove this teacher and all their data? This action is irreversible.")) {
      await DB.deleteTeacher(id);
      loadTeachers();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-brand-500 flex items-center gap-3">
              <i className="fas fa-shield-alt"></i> {t.superAdminPortal}
            </h1>
            <p className="text-slate-400 mt-1">{t.superAdminPortal}</p>
          </div>
          <button onClick={onLogout} className="px-6 py-3 bg-slate-800 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700 shadow-lg">
            {t.signOut}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.totalTeachers}</h3>
            <div className="text-4xl font-black">{teachers.length}</div>
          </div>
          <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.activeStatus}</h3>
            <div className="text-4xl font-black text-green-400">{teachers.filter(t => t.isActive).length}</div>
          </div>
          <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.revenue}</h3>
            <div className="text-4xl font-black text-blue-400">Scaling</div>
          </div>
          <button 
            onClick={() => { setShowModal('create'); setFormData({ name: '', email: '', password: '', isActive: true, plan: 'basic', language: 'en', isRTL: false }); }}
            className="bg-brand-600 p-8 rounded-[2rem] border border-brand-500 flex flex-col items-center justify-center gap-2 font-black text-xl hover:bg-brand-500 transition-all shadow-2xl shadow-brand-900/40"
          >
            <i className="fas fa-user-plus text-2xl"></i>
            <span>{t.addTeacher}</span>
          </button>
        </div>

        <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">{t.identifiedTeacher}</th>
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">{t.subscriptionTier}</th>
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">{t.globalStatus}</th>
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">{t.management}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20 text-slate-500 animate-pulse font-bold">Synchronizing Encrypted Data...</td></tr>
              ) : teachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-white text-lg">{teacher.name}</div>
                    <div className="text-xs text-slate-500 font-medium">{teacher.email}</div>
                    <div className="mt-1 flex gap-2">
                       <span className="text-[9px] px-1 bg-slate-700 rounded text-slate-300 uppercase font-black">{teacher.settings.language}</span>
                       {teacher.settings.isRTL && <span className="text-[9px] px-1 bg-brand-900/50 rounded text-brand-400 uppercase font-black">RTL</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                      teacher.plan === 'enterprise' ? 'bg-amber-900/20 text-amber-400 border-amber-900/50' : 
                      teacher.plan === 'pro' ? 'bg-indigo-900/20 text-indigo-400 border-indigo-900/50' : 'bg-slate-700/50 text-slate-400 border-slate-600'
                    }`}>
                      {teacher.plan}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {teacher.isActive ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/20 text-green-400 rounded-full text-[10px] font-bold border border-green-900/50">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {t.systemActive}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/20 text-red-400 rounded-full text-[10px] font-bold border border-red-900/50">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span> {t.suspended}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(teacher)} className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-xl hover:bg-brand-600 text-white transition-all shadow-lg">
                        <i className="fas fa-cog"></i>
                      </button>
                      <button onClick={() => handleDeleteTeacher(teacher.id)} className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-xl hover:bg-red-600 text-white transition-all shadow-lg">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 max-w-lg w-full rounded-[3rem] p-12 border border-slate-700 shadow-2xl relative">
            <button onClick={() => setShowModal(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            <h2 className="text-3xl font-black mb-10 tracking-tighter text-white">
              {showModal === 'create' ? t.provisionTenant : t.manageAccount}
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">{t.accountName}</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">{t.corporateEmail}</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">{t.securityCredentials}</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-white font-bold" placeholder="••••••••" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Interface Language</label>
                    <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value as Language, isRTL: e.target.value === 'ar'})} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl outline-none text-white font-bold appearance-none">
                      <option value="en">English (US)</option>
                      <option value="ar">العربية (Arabic)</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-4 pl-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.isRTL} onChange={e => setFormData({...formData, isRTL: e.target.checked})} className="w-5 h-5 accent-brand-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Force RTL</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Subscription</label>
                    <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value as SubscriptionPlan})} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl outline-none text-white font-bold appearance-none">
                      <option value="basic">Standard</option>
                      <option value="pro">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-4 pl-4">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <div className="relative inline-block w-14 h-7 transition duration-200 ease-in">
                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="hidden" />
                        <div className={`w-14 h-7 rounded-full shadow-inner ${formData.isActive ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                        <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 transform ${formData.isActive ? 'translate-x-7' : ''}`}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-slate-400 hover:bg-slate-700 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-brand-600 rounded-2xl font-black text-white hover:bg-brand-500 transition-all shadow-xl shadow-brand-900/40">
                  {showModal === 'create' ? 'Finalize Account' : 'Confirm Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPanel;
