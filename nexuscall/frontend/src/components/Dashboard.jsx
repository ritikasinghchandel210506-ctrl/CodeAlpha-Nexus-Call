import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Video, PlusCircle, ArrowRight, LogOut, Radio } from 'lucide-react';

export default function Dashboard({ onJoinRoom }) {
  const { user, logout } = useAuth();
  const [roomId, setRoomId] = useState('');

  const generateQuickRoom = () => {
    const randomId = Math.random().toString(36).substring(2, 11);
    onJoinRoom(randomId);
  };

  const handleJoinExplicit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom(roomId.trim().toLowerCase());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 px-4">
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-slate-400">Authenticated Operator</p>
          <p className="text-sm font-semibold text-slate-200">{user.name}</p>
        </div>
        <button 
          onClick={logout} 
          className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/50 text-slate-400 hover:text-red-400 transition-all"
          title="Terminate Session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6">
        {/* Module A: Creation */}
        <div className="p-6 glass-panel rounded-2xl flex flex-col justify-between border border-slate-800 group hover:border-indigo-500/30 transition-all duration-300">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Establish Core</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Provision a unique cryptographic node space for immediate secure video routing and real-time presentation syncing.
            </p>
          </div>
          <button 
            onClick={generateQuickRoom}
            className="w-full flex items-center justify-center gap-2 mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 transition-all font-medium rounded-xl text-sm text-white shadow-md shadow-indigo-600/10"
          >
            Create Instanced Terminal
          </button>
        </div>

        {/* Module B: Connection */}
        <div className="p-6 glass-panel rounded-2xl flex flex-col justify-between border border-slate-800 group hover:border-cyan-500/30 transition-all duration-300">
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Intercept Matrix</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Input an active cluster index or token ID string directly to latch into an on-going video matrix stream interface.
            </p>
          </div>
          <form onSubmit={handleJoinExplicit} className="mt-6 space-y-3">
            <div className="relative">
              <input 
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter dynamic-room-id"
                className="w-full px-4 py-2.5 rounded-xl text-sm glass-input text-white tracking-wide font-mono"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 transition-all font-medium rounded-xl text-sm text-cyan-400 border border-cyan-500/30"
            >
              Sync Matrix ID <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}