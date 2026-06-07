import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, FileText, Download } from 'lucide-react';
import { encryptMessage, decryptMessage } from '../utils/crypto';

export default function ChatSidebar({ socketRef, roomId, username }) {
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleInboundMessage = (msg) => {
      // Automatic decryption routine on intercepting cipher text pipeline
      const decryptedText = msg.text ? decryptMessage(msg.text) : '';
      setMessages((prev) => [...prev, { ...msg, text: decryptedText }]);
    };

    socketRef.current.on('receive-message', handleInboundMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive-message', handleInboundMessage);
      }
    };
  }, [socketRef, roomId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Encrypt the message text before transmission over the network
    const encrypted = encryptMessage(textInput.trim());

    const messagePayload = {
      roomId,
      sender: username,
      text: encrypted,
      fileData: null
    };

    socketRef.current.emit('send-message', messagePayload);
    
    // Store plaintext locally for user readability without immediate cycles
    setMessages((prev) => [...prev, { sender: 'You', text: textInput.trim(), fileData: null, timestamp }]);
    setTextInput('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const filePayload = {
        roomId,
        sender: username,
        text: null,
        fileData: {
          name: file.name,
          type: file.type,
          raw: reader.result // Base64 encoding transport pipeline string conversion
        }
      };

      socketRef.current.emit('send-message', filePayload);
      setMessages((prev) => [...prev, { sender: 'You', text: null, fileData: filePayload.fileData, timestamp }]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 relative min-h-0">
      {/* Threat Mitigation Status Banner */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 text-[11px] text-indigo-400 font-mono tracking-wider">
        <Shield className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
        <span>AES-256 CHANNEL SECURITY SIMULATION ACTIVE</span>
      </div>

      {/* Messages Output Interface */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <p className="text-xs font-mono border border-slate-800 rounded-lg p-2 bg-slate-900/50">
              Clear Text Vector Initialized. <br /> Safe transmission guaranteed.
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isSelf = msg.sender === 'You';
          return (
            <div key={idx} className={`flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5 px-1">
                <span className="font-semibold text-slate-400">{msg.sender}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              
              <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isSelf ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/40'}`}>
                {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                
                {msg.fileData && (
                  <div className="flex items-center gap-2 bg-slate-950/40 p-2 rounded-xl border border-slate-850">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-mono text-[11px] truncate text-slate-200">{msg.fileData.name}</p>
                    </div>
                    <a 
                      href={msg.fileData.raw} 
                      download={msg.fileData.name}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 ml-auto shrink-0"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Sub-Panel Input Controls */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-800/80">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <label className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0">
            <FileText className="w-4 h-4" />
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
          
          <input 
            type="text" 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Secure message vector..." 
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-xs glass-input text-white"
          />
          
          <button 
            type="submit"
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 active:scale-95 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}