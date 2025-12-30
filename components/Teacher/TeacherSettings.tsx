
import React, { useState } from 'react';
import { DB } from '../../services/db';
import { Teacher, AppSettings } from '../../types';
import { translations, Language } from '../../translations';

const THEMES: AppSettings['theme'][] = ['blue', 'emerald', 'rose', 'slate', 'violet'];

const TeacherSettings: React.FC<{ teacher: Teacher, onUpdate: () => void }> = ({ teacher, onUpdate }) => {
  const [settings, setSettings] = useState<AppSettings>(teacher.settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const t = translations[settings.language || 'en'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Logo file too large"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings({ ...settings, logoUrl: event.target?.result as string });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await DB.updateTeacher(teacher.id, { settings });
      onUpdate();
      alert("Settings updated!");
    } catch (e) { alert("Failed to save settings"); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl" dir={settings.isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Institution Branding</h2>
        <p className="text-slate-500">White-label your assessment platform and luxury certificates.</p>
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-2xl space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.institutionName}</label>
              <input type="text" value={settings.schoolName} onChange={e => setSettings({...settings, schoolName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.appLanguage}</label>
                  <select value={settings.language} onChange={e => setSettings({...settings, language: e.target.value as Language, isRTL: e.target.value === 'ar'})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold appearance-none">
                    <option value="en">English (US/UK)</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
               </div>
               <div className="flex items-end pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.isRTL} onChange={e => setSettings({...settings, isRTL: e.target.checked})} className="w-5 h-5 accent-brand-600" />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">{t.rtlLayout}</span>
                  </label>
               </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Brand Palette</label>
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                 <input type="color" value={settings.brandColor} onChange={e => setSettings({...settings, brandColor: e.target.value})} className="w-12 h-12 rounded-xl border-2 border-white cursor-pointer" />
                 <div className="text-[10px] text-slate-400 font-bold leading-tight uppercase">Custom color for UI buttons & certificate accents</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
             {settings.logoUrl ? (
                <div className="relative">
                  <img src={settings.logoUrl} className="h-24 object-contain mb-4" />
                  <button onClick={() => setSettings({...settings, logoUrl: undefined})} className="absolute -top-4 -right-4 bg-red-500 text-white w-6 h-6 rounded-full text-xs">×</button>
                </div>
             ) : (
                <i className="fas fa-image text-5xl text-slate-200 mb-4"></i>
             )}
             <label className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800">
               Upload Institution Logo
               <input type="file" onChange={handleFileUpload} className="hidden" />
             </label>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-6 bg-brand-600 text-white rounded-[2rem] font-black text-xl hover:bg-brand-500 shadow-xl transition-all">
          {saving ? '...' : t.saveSettings}
        </button>
      </div>
    </div>
  );
};

export default TeacherSettings;
