import { useRef, useEffect } from 'react';
import { useStore } from '../../store';

export function RideTimeline({ height = 120 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emojiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const emojiReady = useRef(false);

  // Pre-render the motorcycle emoji to an offscreen canvas (once)
  useEffect(() => {
    const oc = document.createElement('canvas');
    oc.width = 64;
    oc.height = 64;
    const ctx = oc.getContext('2d')!;
    ctx.font = '44px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏍️', 32, 34);
    emojiCanvasRef.current = oc;
    emojiReady.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let rafId: number;

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = height;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx.scale(dpr, dpr);

      const state = useStore.getState();
      const { currentTime, totalDuration, eventLog, scores, orientation, roadQuality } = state;

      ctx.fillStyle = '#0c0c0e';
      ctx.fillRect(0, 0, w, h);

      if (totalDuration <= 0) { rafId = requestAnimationFrame(draw); return; }

      const progress = currentTime / totalDuration;
      const pad = 50;
      const rL = pad, rR = w - pad, rW = rR - rL;
      const rY = h * 0.55;
      const rH = 36;

      // ── Road ──
      ctx.fillStyle = '#1a1a1d';
      ctx.fillRect(rL - 4, rY - rH / 2 - 4, rW + 8, rH + 8);
      ctx.fillStyle = '#111113';
      ctx.fillRect(rL, rY - rH / 2, rW, rH);

      // Edge lines
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      [rY - rH / 2, rY + rH / 2].forEach(y => {
        ctx.beginPath(); ctx.moveTo(rL, y); ctx.lineTo(rR, y); ctx.stroke();
      });

      // Center dashes
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.setLineDash([24, 16]);
      ctx.beginPath(); ctx.moveTo(rL, rY); ctx.lineTo(rR, rY); ctx.stroke();
      ctx.setLineDash([]);

      // Traversed highlight
      const bikeX = rL + progress * rW;
      ctx.fillStyle = 'rgba(250, 250, 250, 0.015)';
      ctx.fillRect(rL, rY - rH / 2, bikeX - rL, rH);

      // ── Events on road ──
      for (const ev of eventLog) {
        const x = rL + (ev.time / totalDuration) * rW;
        const isHard = ev.type.includes('emergency') || ev.type.includes('extreme');
        const isWarn = ev.type.includes('hard') || ev.type.includes('aggressive');
        const color = isHard ? '#f87171' : isWarn ? '#fbbf24' : '#818cf8';
        const barH = isHard ? 26 : isWarn ? 18 : 12;

        // Bar above road
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x - 1, rY - rH / 2 - barH - 2, 2, barH);
        ctx.globalAlpha = 1;

        // Dot on road
        ctx.beginPath();
        ctx.arc(x, rY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (ev.isGroundTruth) {
          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 12px Space Grotesk';
          ctx.textAlign = 'center';
          ctx.fillText('✓', x, rY - rH / 2 - barH - 6);
          ctx.textAlign = 'left';
        }
      }

      // ── Bike emoji on the road ──
      const lean = orientation.roll;
      const roadQualityShake = roadQuality === 'ROUGH' ? (Math.random() - 0.5) * 4 : roadQuality === 'MODERATE' ? (Math.random() - 0.5) * 1.5 : 0;

      // Check if there's a recent event (within last 2 seconds) for flash effect
      const recentEvent = eventLog.length > 0 && (currentTime - eventLog[eventLog.length - 1].time) < 2;
      const isHardRecent = recentEvent && eventLog.length > 0 &&
        (eventLog[eventLog.length - 1].type.includes('hard') ||
         eventLog[eventLog.length - 1].type.includes('emergency') ||
         eventLog[eventLog.length - 1].type.includes('aggressive') ||
         eventLog[eventLog.length - 1].type.includes('extreme'));

      // Glow — changes color on events
      const glowColor = isHardRecent ? 'rgba(248, 113, 113, 0.25)' : 'rgba(250, 250, 250, 0.1)';
      const glowR = isHardRecent ? 35 : 26;
      const glow = ctx.createRadialGradient(bikeX, rY, 0, bikeX, rY, glowR);
      glow.addColorStop(0, glowColor);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(bikeX, rY, glowR, 0, Math.PI * 2); ctx.fill();

      // Draw emoji — flip so bike faces right along the road
      if (emojiReady.current && emojiCanvasRef.current) {
        ctx.save();
        ctx.translate(bikeX + roadQualityShake, rY);
        ctx.rotate((lean * Math.PI) / 180 * 0.3);
        // The 🏍️ emoji faces left by default on most platforms — flip it
        ctx.scale(-1, 1);
        ctx.drawImage(emojiCanvasRef.current, -20, -22, 40, 40);
        ctx.restore();
      }

      // Score above bike
      const sc = scores.compositeEma;
      const scoreColor = sc >= 70 ? '#4ade80' : sc >= 40 ? '#fbbf24' : '#f87171';

      // Score background pill
      const scoreText = Math.round(sc).toString();
      ctx.font = 'bold 18px Space Grotesk';
      const scoreW = ctx.measureText(scoreText).width;
      const pillW = scoreW + 16;
      const pillH = 24;
      const pillX = bikeX - pillW / 2;
      const pillY = rY - rH / 2 - 42;

      ctx.fillStyle = '#141416';
      ctx.strokeStyle = scoreColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = scoreColor;
      ctx.textAlign = 'center';
      ctx.fillText(scoreText, bikeX, pillY + 17);
      ctx.textAlign = 'left';

      // ── Time labels — below road ──
      const timeY = rY + rH / 2 + 16;
      ctx.fillStyle = '#52525b';
      ctx.font = '11px IBM Plex Mono';
      ctx.textAlign = 'left';
      ctx.fillText('0:00', rL, timeY);
      ctx.textAlign = 'center';
      const m = Math.floor(currentTime / 60);
      const s = Math.floor(currentTime % 60);
      ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, bikeX, timeY);
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, '0')}`, rR, timeY);

      // ── Legend — at bottom left ──
      ctx.textAlign = 'left';
      ctx.font = '10px Space Grotesk';
      ctx.fillStyle = '#f87171'; ctx.fillText('● Hard', rL, h - 6);
      ctx.fillStyle = '#fbbf24'; ctx.fillText('● Warning', rL + 50, h - 6);
      ctx.fillStyle = '#4ade80'; ctx.fillText('✓ Verified', rL + 120, h - 6);
      ctx.textAlign = 'left';

      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height }} className="block" />;
}
