import { useRef, useEffect } from 'react';
import { useStore } from '../../store';

const COLORS = {
  accelX: '#60a5fa', accelY: '#4ade80', accelZ: '#f87171',
  gyroX: '#818cf8', gyroY: '#22d3ee', gyroZ: '#fb923c',
};

interface Props {
  height?: number;
  showGyro?: boolean;
}

export function WaveformCanvas({ height = 0, showGyro = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let rafId: number;

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = height > 0 ? height : rect.height;
      if (w === 0 || h === 0) { rafId = requestAnimationFrame(draw); return; }

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#0c0c0e';
      ctx.fillRect(0, 0, w, h);

      const { waveformData, currentTime } = useStore.getState();

      // Grid
      ctx.strokeStyle = '#1a1a1d';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 5; i++) {
        const y = (i / 5) * h;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      const len = waveformData.accelX.length || 1;
      const pps = w / len;
      for (let i = 50; i < len; i += 50) {
        ctx.beginPath(); ctx.moveTo(i * pps, 0); ctx.lineTo(i * pps, h); ctx.stroke();
      }

      // Channels
      const channels = showGyro
        ? [
            { d: waveformData.gyroX, c: COLORS.gyroX, r: 1.5, l: 'Gx', offset: 0 },
            { d: waveformData.gyroY, c: COLORS.gyroY, r: 1.5, l: 'Gy', offset: 0 },
            { d: waveformData.gyroZ, c: COLORS.gyroZ, r: 1.5, l: 'Gz', offset: 0 },
          ]
        : [
            { d: waveformData.accelX, c: COLORS.accelX, r: 6, l: 'Ax', offset: 0 },
            { d: waveformData.accelY, c: COLORS.accelY, r: 6, l: 'Ay', offset: 0 },
            { d: waveformData.accelZ, c: COLORS.accelZ, r: 6, l: 'Az', offset: 9.81 },
          ];

      for (let ci = 0; ci < channels.length; ci++) {
        const ch = channels[ci];
        if (!ch.d || ch.d.length === 0) continue;
        ctx.beginPath();
        ctx.strokeStyle = ch.c;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < ch.d.length; i++) {
          const x = (i / Math.max(ch.d.length - 1, 1)) * w;
          const val = ch.d[i] - (ch.offset || 0);
          const y = h / 2 - (val / ch.r) * (h / 2) * 0.75;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.fillStyle = ch.c;
        ctx.font = '13px IBM Plex Mono';
        ctx.globalAlpha = 0.7;
        ctx.fillText(ch.l, 8, ci * 20 + 20);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = '#52525b';
      ctx.font = '12px IBM Plex Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`${currentTime.toFixed(1)}s`, w - 8, h - 8);
      ctx.textAlign = 'left';

      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [height, showGyro]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: height > 0 ? height : '100%' }} className="block" />;
}
