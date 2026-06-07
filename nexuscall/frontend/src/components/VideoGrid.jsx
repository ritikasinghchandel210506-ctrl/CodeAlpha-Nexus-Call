import React, { useEffect, useRef } from 'react';
import { User } from 'lucide-react';

function StreamCard({ stream, label, isLocal, fallbackActive }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl aspect-video w-full h-full flex items-center justify-center group">
      {fallbackActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2 border border-slate-700">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <span className="text-xs tracking-wider">Video Stream Inactive</span>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isLocal} 
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      )}
      
      {/* Display Card Metadata Banner */}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-200 flex items-center gap-2 max-w-[85%] truncate">
        <div className={`w-2 h-2 rounded-full ${isLocal ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}

export default function VideoGrid({ localStream, remotes, localName, isVideoOff }) {
  const totalStreams = remotes.length + 1;
  
  // Grid layout tuning calculations based on participant matrices
  let gridStyle = "grid-cols-1 md:grid-cols-1 max-w-3xl mx-auto";
  if (totalStreams === 2) gridStyle = "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto";
  if (totalStreams >= 3) gridStyle = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto";

  return (
    <div className={`grid gap-4 w-full h-full items-center justify-center ${gridStyle}`}>
      {/* Target A: Local Hardware Operator Node */}
      <StreamCard stream={localStream} label={localName} isLocal={true} fallbackActive={isVideoOff} />

      {/* Target B..N: Dynamic Mapping of Inbound Connection Pipelines */}
      {remotes.map((remote) => (
        <StreamCard 
          key={remote.id} 
          stream={remote.stream} 
          label={`Operator [${remote.id.substring(0, 5)}]`} 
          isLocal={false} 
          fallbackActive={false}
        />
      ))}
    </div>
  );
}