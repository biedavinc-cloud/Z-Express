import React, { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

export default function SignaturePad({ onChange, label, hint, clearLabel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3D1E00';
  }, []);

  const position = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (event) => {
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = position(event);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = position(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const data = canvasRef.current.toDataURL('image/png');
    if (onChange) onChange(data);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    if (onChange) onChange('');
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-destructive"
        >
          <Eraser className="h-3.5 w-3.5" />
          {clearLabel}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        className="mt-2 h-36 w-full touch-none rounded-2xl border border-dashed border-border bg-white"
      />
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      {hasInk ? null : <span className="sr-only">empty</span>}
    </div>
  );
}