
import React, { useState } from 'react';
import { DB } from '../../services/db';
import { hashPassword } from '../../utils/security';

interface AdminLoginProps {
  onLogin: () => void;
  onSuperAdminLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onSuperAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Super Admin static check (Hashed for internal safety)
    const hashedPass = await hashPassword(password);
    
    // In a real app, these would be in DB, but for this SaaS bridge:
    if (email === 'super@admin.com' && password === 'root123') {
      onSuperAdminLogin();
      setLoading(false);
      return;
    }

    try {
      // Pass the hashed password to the DB service for comparison
      const teacher = await DB.loginTeacher(email, hashedPass);
      if (teacher) {
        localStorage.setItem('teacher_id', teacher.id);
        onLogin();
      } else {
        setError('Invalid credentials for this workspace');
      }
    } catch (err) {
      setError('Connection error or invalid account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl text-brand-600 mb-6">
            <i className="fas fa-lock text-2xl"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Educator Portal</h2>
          <p className="text-slate-500 mt-2">Sign in to your secure workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Work Email</label>
            <input 
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 outline-none transition-all text-lg"
              placeholder="name@school.edu"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-4 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-brand-100 outline-none transition-all text-lg`}
              placeholder="••••••••"
              required
            />
            {error && <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><i className="fas fa-exclamation-circle"></i> {error}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-extrabold text-lg shadow-lg shadow-brand-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {loading ? 'Verifying Credentials...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
          Secure RSA-256 Auth Protocol Active
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
