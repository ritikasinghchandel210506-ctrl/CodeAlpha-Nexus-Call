import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Room from './components/Room';

function AppContent() {
  const { user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState(null);

  if (!user) {
    return <Auth />;
  }

  if (!currentRoom) {
    return <Dashboard onJoinRoom={(roomId) => setCurrentRoom(roomId)} />;
  }

  return <Room roomId={currentRoom} onLeaveRoom={() => setCurrentRoom(null)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="w-screen h-screen relative bg-slate-950 overflow-hidden text-slate-100">
        <AppContent />
      </div>
    </AuthProvider>
  );
}