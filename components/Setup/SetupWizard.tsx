
import React, { useState, useEffect } from 'react';
import { generateSeedSQL } from '../../utils/sqlGenerator';

interface SetupWizardProps {
  onComplete: (config: { url: string; key: string }) => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const testConnection = async () => {
    if (!url || !key) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      if (response.ok || response.status === 404) { // 404 is fine as it means we hit the API
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch (e) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const downloadSQL = () => {
    const sql = generateSeedSQL();
    const blob = new Blob([sql], { type: 'text/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'setup_database.sql';
    link.click();
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-tools text-2xl"></i>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Installation Wizard</h1>
          <p className="text-brand-100 text-sm mt-1">Configure your Supabase Cloud environment</p>
        </div>

        {/* Steps Progress */}
        <div className="flex px-8 pt-8 gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-brand-500' : 'bg-slate-100'}`} />
          ))}
        </div>

        <div className="p-8 md:p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Connection Details</h2>
                <p className="text-slate-500 text-sm">Provide your Supabase Project API credentials</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Supabase Project URL</label>
                  <input 
                    type="text" 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Supabase Anon Key</label>
                  <input 
                    type="password" 
                    value={key} 
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-100 outline-none"
                  />
                </div>
              </div>

              {testResult === 'error' && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  <i className="fas fa-times-circle mr-2"></i> Connection failed. Check your URL and Key.
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={testConnection}
                  disabled={isTesting || !url || !key}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50"
                >
                  {isTesting ? <i className="fas fa-spinner animate-spin"></i> : 'Test Connection'}
                </button>
                <button 
                  onClick={() => setStep(2)}
                  disabled={testResult !== 'success'}
                  className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 disabled:opacity-50"
                >
                  Next Step <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-database text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Seed Database</h2>
                <p className="text-slate-500 text-sm">Download the SQL script and run it in your Supabase SQL Editor.</p>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-blue-300 max-h-40 overflow-y-auto border-2 border-slate-800 shadow-inner">
                {generateSeedSQL()}
              </div>

              <button 
                onClick={downloadSQL}
                className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-lg hover:bg-brand-700 shadow-xl shadow-brand-100 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
              >
                <i className="fas fa-file-download text-2xl"></i>
                Download SQL Script
              </button>
              
              <button onClick={() => setStep(3)} className="w-full py-2 text-slate-400 text-xs hover:underline">
                I've already run the script, skip to finish
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-double text-4xl"></i>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">Installation Complete</h2>
                <p className="text-slate-500 mt-2 px-4">Your application is now linked to Supabase. This setup will not be shown again.</p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-left">
                <h3 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-widest">Next Steps</h3>
                <ul className="text-sm text-blue-600 space-y-2">
                  <li className="flex gap-2"><i className="fas fa-circle text-[6px] mt-1.5"></i> Go to Admin Dashboard</li>
                  <li className="flex gap-2"><i className="fas fa-circle text-[6px] mt-1.5"></i> Create your first Quiz</li>
                  <li className="flex gap-2"><i className="fas fa-circle text-[6px] mt-1.5"></i> Share the link with Students</li>
                </ul>
              </div>

              <button 
                onClick={() => onComplete({ url, key })}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-xl"
              >
                Launch Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
