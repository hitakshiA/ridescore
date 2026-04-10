import { useRef, useEffect, useState } from 'react';
import { useStore } from '../../store';

export function Act2Comparison() {
  const scores = useStore(s => s.scores);
  const ser = useStore(s => s.ser);
  const roadQuality = useStore(s => s.roadQuality);
  const penaltyFactor = useStore(s => s.penaltyFactor);
  const [roadData, setRoadData] = useState<{ potholes: number[][]; regular: number[][] } | null>(null);

  useEffect(() => {
    fetch('/data/road_samples.json')
      .then(r => r.json())
      .then(d => setRoadData(d))
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="shrink-0 px-8 pt-5 pb-4 border-b border-border">
        <h2 className="text-xl font-bold text-text-strong">Why Scoring Needs Road Quality Detection</h2>
        <p className="text-sm text-text-dim mt-1 max-w-3xl">
          Indian roads produce accelerometer spikes identical to aggressive riding. Without separating
          road vibration from rider behavior, every rider on a rough road scores "dangerous."
        </p>
      </div>

      {/* Two columns — problem vs solution */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        {/* LEFT: The Problem */}
        <div className="border-r border-border flex flex-col min-h-0">
          <div className="shrink-0 px-6 pt-4 pb-2">
            <div className="text-xs text-red uppercase tracking-wider font-semibold mb-1">The Problem</div>
            <h3 className="text-base font-semibold text-text-strong">Potholes look like hard braking</h3>
            <p className="text-xs text-text-dim mt-1">
              A pothole spike of 0.3–0.6g is identical to a braking event. Naive scorers penalize the rider.
            </p>
          </div>

          <div className="flex-1 min-h-0 px-2 py-1">
            <PotholeCanvas data={roadData?.potholes} label="Pothole Z-axis acceleration" color="#f87171" />
          </div>

          <div className="shrink-0 grid grid-cols-3 gap-2 px-6 pb-4">
            <StatBlock label="Peak spike" value="0.45g" color="#f87171" />
            <StatBlock label="Naive penalty" value="-5 pts" color="#f87171" />
            <StatBlock label="Rider fault?" value="No" color="#f87171" />
          </div>
        </div>

        {/* RIGHT: The Solution */}
        <div className="flex flex-col min-h-0">
          <div className="shrink-0 px-6 pt-4 pb-2">
            <div className="text-xs text-green uppercase tracking-wider font-semibold mb-1">The Solution</div>
            <h3 className="text-base font-semibold text-text-strong">SER separates road from rider</h3>
            <p className="text-xs text-text-dim mt-1">
              Road vibration is &gt;10 Hz, rider actions &lt;5 Hz. FFT splits energy bands, penalties reduced up to 50%.
            </p>
          </div>

          <div className="flex-1 min-h-0 px-2 py-1">
            <PotholeCanvas data={roadData?.regular} label="Smooth road Z-axis acceleration" color="#4ade80" />
          </div>

          <div className="shrink-0 grid grid-cols-3 gap-2 px-6 pb-4">
            <StatBlock label="SER value" value={ser.toFixed(3)} color={roadQuality === 'ROUGH' ? '#f87171' : roadQuality === 'SMOOTH' ? '#4ade80' : '#fbbf24'} />
            <StatBlock label="Penalty adj." value={`×${penaltyFactor.toFixed(2)}`} color="#4ade80" />
            <StatBlock label="Fair score" value="Yes" color="#4ade80" />
          </div>
        </div>
      </div>

      {/* Bottom: Live SER bar */}
      <div className="shrink-0 border-t border-border px-8 py-4">
        <div className="flex items-center gap-10">
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Road</div>
            <div className="text-xl font-bold" style={{
              color: roadQuality === 'SMOOTH' ? '#4ade80' : roadQuality === 'ROUGH' ? '#f87171' : '#fbbf24'
            }}>{roadQuality}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">SER</div>
            <div className="text-xl font-mono font-bold text-text tabular-nums">{ser.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Penalty</div>
            <div className="text-xl font-mono font-bold text-text tabular-nums">×{penaltyFactor.toFixed(2)}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Live Score</div>
            <div className="text-3xl font-bold tabular-nums" style={{
              color: scores.compositeEma >= 70 ? '#4ade80' : scores.compositeEma >= 40 ? '#fbbf24' : '#f87171'
            }}>{Math.round(scores.compositeEma)}</div>
          </div>
        </div>

        {/* SER scale */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] text-text-muted w-10">Rough</span>
          <div className="flex-1 h-2 bg-bg-raised relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red/20 via-amber/20 to-green/20" />
            <div className="absolute top-0 bottom-0 w-0.5 bg-text-strong transition-all duration-300"
              style={{ left: `${Math.min(100, ser * 100)}%` }} />
            <div className="absolute top-0 bottom-0 w-px bg-text-muted/30" style={{ left: '30%' }} />
            <div className="absolute top-0 bottom-0 w-px bg-text-muted/30" style={{ left: '70%' }} />
          </div>
          <span className="text-[10px] text-text-muted w-12 text-right">Smooth</span>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-bg-raised border border-border-subtle px-3 py-2">
      <div className="text-base font-semibold font-mono tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[10px] text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

function PotholeCanvas({ data, label, color }: { data?: number[][]; label: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d')!;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if (w === 0 || h === 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0c0c0e';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1a1a1d';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, (i / 4) * h); ctx.lineTo(w, (i / 4) * h); ctx.stroke();
    }

    // Draw up to 3 samples
    const samples = data.slice(0, 3);
    const sw = w / samples.length;

    samples.forEach((sample, si) => {
      const ox = si * sw;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < sample.length; i++) {
        const x = ox + (i / sample.length) * sw;
        const y = h / 2 - ((sample[i] - 9.81) / 6) * (h / 2) * 0.8;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (si > 0) {
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
      }
    });

    ctx.fillStyle = '#52525b';
    ctx.font = '11px Space Grotesk';
    ctx.fillText(label, 8, 16);
  }, [data, label, color]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} className="block" />;
}
