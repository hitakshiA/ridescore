import { useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { SER_LOW_FREQ_CUTOFF } from '../../engine/constants';

export function FFTSpectrumCanvas({ height = 120 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let rafId: number;

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = height * dpr;
      ctx.scale(dpr, dpr);
      const w = rect.width, h = height;

      ctx.fillStyle = '#0c0c0e';
      ctx.fillRect(0, 0, w, h);

      const { fftBins, fftFreqs, ser, roadQuality } = useStore.getState();
      if (!fftBins.length) { rafId = requestAnimationFrame(draw); return; }

      let max = 0;
      for (const p of fftBins) if (p > max) max = p;
      if (max < 1e-10) max = 1;

      const n = Math.min(fftBins.length, 32);
      const bw = (w - 30) / n;
      const m = 15;

      for (let i = 0; i < n; i++) {
        const freq = fftFreqs[i] || 0;
        const norm = fftBins[i] / max;
        const bh = norm * (h - 24) * 0.8;
        const x = m + i * bw;
        const isLow = freq <= SER_LOW_FREQ_CUTOFF;
        ctx.fillStyle = isLow ? 'rgba(96, 165, 250, 0.5)' : 'rgba(248, 113, 113, 0.35)';
        ctx.fillRect(x + 1, h - 14 - bh, bw - 2, bh);
      }

      // 5 Hz cutoff
      const ci = fftFreqs.findIndex(f => f > SER_LOW_FREQ_CUTOFF);
      if (ci > 0) {
        const cx = m + ci * bw;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h - 14); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px IBM Plex Mono';
        ctx.fillText('5 Hz', cx + 4, 14);
      }

      const sc = roadQuality === 'SMOOTH' ? '#4ade80' : roadQuality === 'ROUGH' ? '#f87171' : '#fbbf24';
      ctx.fillStyle = sc;
      ctx.font = '600 12px IBM Plex Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`SER ${ser.toFixed(3)}  ${roadQuality}`, w - 6, 14);
      ctx.textAlign = 'left';

      ctx.font = '9px IBM Plex Mono';
      ctx.fillStyle = '#60a5fa'; ctx.fillText('Rider <5Hz', 6, h - 3);
      ctx.fillStyle = '#f87171'; ctx.fillText('Road >5Hz', 80, h - 3);

      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height }} className="block" />;
}
