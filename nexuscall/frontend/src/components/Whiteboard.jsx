import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Shield, Circle } from 'lucide-react';

export default function Whiteboard({ socketRef, roomId }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Drawing Canvas Options State Config
  const [color, setColor] = useState('#6366f1'); // Vibrant indigo default
  const [brushWidth, setBrushWidth] = useState(3);
  const [mode, setMode] = useState('draw'); // 'draw' | 'erase'

  useEffect(() => {
    const canvas = canvasRef.current;
    // Account for high pixel density monitors correctly
    canvas.width = canvas.parentElement.clientWidth * 2;
    canvas.height = 500 * 2;
    canvas.style.width = `${canvas.parentElement.clientWidth}px`;
    canvas.style.height = `500px`;

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Direct synchronization of inbound coordinates from real-time channel
    if (socketRef.current) {
      socketRef.current.on('draw', (data) => {
        drawSequence(data.x0, data.y0, data.x1, data.y1, data.color, data.width, data.mode);
      });

      socketRef.current.on('clear-canvas', () => {
        executeLocalClear();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('draw');
        socketRef.current.off('clear-canvas');
      }
    };
  }, [socketRef]);

  // Unified Drawing Core Algorithm Execution Vector
  const drawSequence = (x0, y0, x1, y1, strokeColor, lineWidth, drawMode) => {
    if (!contextRef.current) return;
    contextRef.current.beginPath();
    contextRef.current.moveTo(x0, y0);
    contextRef.current.lineTo(x1, y1);
    contextRef.current.strokeStyle = drawMode === 'erase' ? '#0b0f19' : strokeColor; // Hardcoded container background context alignment
    contextRef.current.lineWidth = lineWidth;
    contextRef.current.stroke();
    contextRef.current.closePath();
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Handle both touch parameters and mouse indexing offsets safely
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const lastCoords = useRef({ x: 0, y: 0 });

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    lastCoords.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent accidental background viewport scrolling behavior while sketching
    
    const { x, y } = getCoordinates(e);
    const x0 = lastCoords.current.x;
    const y0 = lastCoords.current.y;

    drawSequence(x0, y0, x, y, color, brushWidth, mode);

    // Broadcast telemetry to peer array configuration nodes
    if (socketRef.current) {
      socketRef.current.emit('draw', {
        roomId, x0, y0, x1: x, y1: y, color, width: brushWidth, mode
      });
    }

    lastCoords.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const executeLocalClear = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClearRequest = () => {
    executeLocalClear();
    if (socketRef.current) {
      socketRef.current.emit('clear-canvas', { roomId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 relative min-h-0">
      <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 text-[11px] text-cyan-400 font-mono tracking-wider">
        <Shield className="w-3.5 h-3.5 text-cyan-500" />
        <span>SHARED COLLABORATIVE WHITEBOARD COMPONENT</span>
      </div>

      {/* Control Configuration Interface Area */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800/60 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setMode('draw')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${mode === 'draw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Draw
          </button>
          <button 
            onClick={() => setMode('erase')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${mode === 'erase' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Erase
          </button>
        </div>

        {mode === 'draw' && (
          <div className="flex items-center gap-2">
            {['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#ffffff'].map((c) => (
              <button 
                key={c}
                onClick={() => setColor(c)}
                className={`w-4 h-4 rounded-full border transition-transform ${color === c ? 'scale-125 border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        <button 
          onClick={handleClearRequest}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 border border-slate-700/60 text-slate-400 hover:text-red-400 transition-colors ml-auto"
          title="Clear Board Canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Core Canvas Visual Element Block */}
      <div className="flex-1 bg-slate-950/90 relative min-h-0 flex items-center justify-center p-2">
        <canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="bg-slate-950 rounded-xl cursor-crosshair shadow-inner max-w-full"
        />
      </div>
    </div>
  );
}