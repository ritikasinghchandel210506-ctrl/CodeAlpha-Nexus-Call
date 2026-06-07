import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import VideoGrid from './VideoGrid';
import ChatSidebar from './ChatSidebar';
import Whiteboard from './Whiteboard';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, 
  Edit3, LogOut, ShieldCheck, Users
} from 'lucide-react';

export default function Room({ roomId, onLeaveRoom }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef([]); // Stores tracked connection structures [{ peerId, peerConnection, track }]
  
  const [localStream, setLocalStream] = useState(null);
  const [remotes, setRemotes] = useState([]); // [{ id, username, stream }]
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Tab configuration layout
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'whiteboard'
  const [participantCount, setParticipantCount] = useState(1);

  // Configuration parameter map for native WebRTC Peer Connection
  const iceServersConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    // 1. Instantiation of media capture mechanisms
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Set up Socket communication architecture
        socketRef.current = io('http://localhost:5000');
        socketRef.current.emit('join-room', { roomId, username: user.name });

        // 3. Catch all existing user matrices inside allocated room
        socketRef.current.on('all-users', (users) => {
          setParticipantCount(users.length + 1);
          users.forEach(serverUser => {
            const pc = createPeerConnection(serverUser.id, socketRef.current.id, stream);
            peersRef.current.push({
              peerId: serverUser.id,
              peerConnection: pc
            });
          });
        });

        // 4. Inbound listener handles incoming signaling execution logic
        socketRef.current.on('user-joined-signal', (payload) => {
          const pc = addPeerConnection(payload.callerId, payload.signal, stream);
          peersRef.current.push({
            peerId: payload.callerId,
            peerConnection: pc
          });
          setParticipantCount(prev => prev + 1);
        });

        // 5. Catch back signals returning back from targets
        socketRef.current.on('receiving-returned-signal', (payload) => {
          const item = peersRef.current.find(p => p.peerId === payload.id);
          if (item && item.peerConnection) {
            item.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.signal))
              .catch(e => console.error("Remote description handling failure:", e));
          }
        });

        // 6. Handle peer departure lifecycle triggers cleanly
        socketRef.current.on('user-left', (userId) => {
          const item = peersRef.current.find(p => p.peerId === userId);
          if (item) {
            item.peerConnection.close();
            peersRef.current = peersRef.current.filter(p => p.peerId !== userId);
          }
          setRemotes(prev => prev.filter(r => r.id !== userId));
          setParticipantCount(prev => Math.max(1, prev - 1));
        });
      })
      .catch(err => {
        console.error("Critical: Local hardware pipeline failed initialization.", err);
        alert("Please authorize media accessories (Camera/Microphone) to sync matrix routing.");
      });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      peersRef.current.forEach(p => p.peerConnection.close());
    };
  }, [roomId]);

  // WebRTC Signal Constructors
  function createPeerConnection(userToSignal, callerId, stream) {
    const pc = new RTCPeerConnection(iceServersConfig);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Gathering candidates implicitly relies on setLocalDescription completion
      };
    };

    pc.ontrack = (event) => {
      setRemotes(prev => {
        if (prev.some(r => r.id === userToSignal)) return prev;
        return [...prev, { id: userToSignal, stream: event.streams[0] }];
      });
    };

    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        socketRef.current.emit('sending-signal', {
          userToSignal,
          callerId,
          signal: pc.localDescription,
          username: user.name
        });
      })
      .catch(e => console.error(e));

    return pc;
  }

  function addPeerConnection(callerId, incomingSignal, stream) {
    const pc = new RTCPeerConnection(iceServersConfig);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) { /* No-op standard */ }
    };

    pc.ontrack = (event) => {
      setRemotes(prev => {
        if (prev.some(r => r.id === callerId)) return prev;
        return [...prev, { id: callerId, stream: event.streams[0] }];
      });
    };

    pc.setRemoteDescription(new RTCSessionDescription(incomingSignal))
      .then(() => pc.createAnswer())
      .then(answer => pc.setLocalDescription(answer))
      .then(() => {
        socketRef.current.emit('returning-signal', {
          signal: pc.localDescription,
          callerId
        });
      })
      .catch(e => console.error(e));

    return pc;
  }

  // Capability Pipeline Controls
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        peersRef.current.forEach(p => {
          const senders = p.peerConnection.getSenders();
          const sender = senders.find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        // Watch for user clicking native "Stop Sharing" overlay trigger
        screenTrack.onended = () => {
          revertToCameraTrack();
        };

        // UI Feedback replacement updating local grid tracking
        setLocalStream(screenStream);
        setIsScreenSharing(true);
      } else {
        revertToCameraTrack();
      }
    } catch (e) {
      console.error("Screen sharing operation abort or denial.", e);
    }
  };

  const revertToCameraTrack = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(camStream => {
        const camTrack = camStream.getVideoTracks()[0];
        peersRef.current.forEach(p => {
          const senders = p.peerConnection.getSenders();
          const sender = senders.find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        });
        
        // Kill existing tracking stream setup
        if (localStream && localStream !== localStreamRef.current) {
          localStream.getTracks().forEach(t => t.stop());
        }

        // Reconnect local tracking references back up to the base camera track
        const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
        localStreamRef.current.removeTrack(originalVideoTrack);
        localStreamRef.current.addTrack(camTrack);

        setLocalStream(localStreamRef.current);
        setIsScreenSharing(false);
        setIsVideoOff(false);
      });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Dynamic Header Interface Container */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h1 className="text-sm font-semibold tracking-wider font-mono text-slate-200">
            CLUSTER NODE: <span className="text-indigo-400">{roomId.toUpperCase()}</span>
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-medium text-slate-400 border border-slate-700/50">
            <Users className="w-3 h-3 text-indigo-400" />
            <span>{participantCount} Active</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Operations Chat
          </button>
          <button 
            onClick={() => setActiveTab('whiteboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'whiteboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Live Board
          </button>
        </div>

        <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-950/30 border border-emerald-900/50 px-3 py-1 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline">E2EE Simulation Pipeline Configured</span>
        </div>
      </header>

      {/* Main Multi-Panel Workplace Arena */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Video Architecture Grid */}
        <div className="flex-1 p-4 overflow-y-auto min-h-0 bg-slate-950">
          <VideoGrid 
            localStream={localStream} 
            remotes={remotes} 
            localName={`${user.name} (You)`} 
            isVideoOff={isVideoOff}
          />
        </div>

        {/* Right Side: Tabbed Dynamic Function Sidebar Container */}
        <div className="w-full md:w-[380px] lg:w-[420px] border-l border-slate-800/80 bg-slate-900/40 flex flex-col shrink-0 relative min-h-0">
          {activeTab === 'chat' ? (
            <ChatSidebar socketRef={socketRef} roomId={roomId} username={user.name} />
          ) : (
            <Whiteboard socketRef={socketRef} roomId={roomId} />
          )}
        </div>
      </div>

      {/* Primary Dashboard Tactical Control Intercept Bar */}
      <footer className="h-20 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 px-6 flex items-center justify-between z-10">
        <div className="hidden sm:block">
          <p className="text-xs text-slate-500">NexusCall Hardware Intercept</p>
          <p className="text-xs font-semibold text-slate-300 truncate max-w-[180px]">{user.name}</p>
        </div>

        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          <button 
            onClick={toggleMute}
            className={`p-3.5 rounded-xl border transition-all duration-200 ${isMuted ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'}`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button 
            onClick={toggleVideo}
            className={`p-3.5 rounded-xl border transition-all duration-200 ${isVideoOff ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'}`}
            title={isVideoOff ? "Enable Video" : "Disable Video"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button 
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-xl border transition-all duration-200 hidden md:block ${isScreenSharing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'}`}
            title={isScreenSharing ? "Terminate Share" : "Share Desktop"}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button 
            onClick={onLeaveRoom}
            className="p-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-700 transition-all font-medium flex items-center justify-center gap-2"
            title="Terminate Linkage"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider hidden md:inline">Disconnect</span>
          </button>
        </div>

        <div className="hidden md:block text-right text-[11px] font-mono text-slate-500">
          Latency Sync: ~12ms <br /> Topology: WebRTC Mesh
        </div>
      </footer>
    </div>
  );
}