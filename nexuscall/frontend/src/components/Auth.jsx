import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Auth() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@nexus.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (!success) {
      setError('Invalid email or password parameters.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 px-4">
      <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl relative border border-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-500/30">
          <Shield className="w-6 h-6 text-white" />
        </div>
        
        <div className="text-center mt-4 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-400">
            NexusCall
          </h1>
          <p className="text-sm text-slate-400 mt-2">Secure Real-Time Operations Suite</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Workspace Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input text-white" 
                placeholder="name@company.com" 
                required 
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Try: admin@nexus.io, user@nexus.io, or guest@nexus.io</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Access Security Code</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input text-white" 
                placeholder="••••••••" 
                required 
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Universal Mock Password: password123</p>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-white font-medium rounded-xl text-sm shadow-lg shadow-indigo-600/20 mt-6 disabled:opacity-50"
          >
            {submitting ? 'Verifying Gateway...' : 'Initialize Session'}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}