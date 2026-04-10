import { useStore } from '../../store';
import { SCORING_WEIGHTS } from '../../engine/constants';

const WEIGHT_ITEMS: { key: string; label: string; reason: string }[] = [
  { key: 'speed', label: 'Speed', reason: '68.1% of fatalities' },
  { key: 'braking', label: 'Braking', reason: 'Collision precursor' },
  { key: 'cornering', label: 'Cornering', reason: '20-22% of 2W crashes' },
  { key: 'acceleration', label: 'Acceleration', reason: 'Traffic gap risk' },
  { key: 'context', label: 'Context', reason: 'Time/road type' },
  { key: 'hazard', label: 'Hazard', reason: 'Evasive maneuvers' },
];

export function Act3Production() {
  const scores = useStore(s => s.scores);
  const framesProcessed = useStore(s => s.framesProcessed);
  const processingTimeUs = useStore(s => s.processingTimeUs);
  const weights = useStore(s => s.weights);
  const setWeights = useStore(s => s.setWeights);
  const gtTotal = useStore(s => s.groundTruthTotal);
  const gtDetected = useStore(s => s.groundTruthDetected);

  const handleWeight = (key: string, val: number) => setWeights({ ...weights, [key]: val });

  return (
    <div className="flex-1 grid grid-cols-[1fr_1fr_1fr] min-h-0">

      {/* LEFT: Trip Summary */}
      <div className="border-r border-border p-8 flex flex-col gap-6">
        <div>
          <div className="text-sm text-text-muted uppercase tracking-wider mb-3">Trip Summary</div>
          <div className="flex items-end gap-3">
            <span className="text-8xl font-bold tabular-nums tracking-tighter leading-none" style={{
              color: scores.compositeEma >= 70 ? '#4ade80' : scores.compositeEma >= 40 ? '#fbbf24' : '#f87171'
            }}>
              {Math.round(scores.compositeEma)}
            </span>
            <div className="pb-3">
              <div className="text-lg font-semibold text-text-strong">Overall Score</div>
              <div className="text-sm text-text-dim">Trip 17 — MoRTH weighted</div>
            </div>
          </div>
        </div>

        {/* Sub-score grid */}
        <div className="grid grid-cols-2 gap-2">
          {WEIGHT_ITEMS.map(({ key, label }) => {
            const val = Math.round((scores as any)[key]);
            const c = val >= 80 ? '#4ade80' : val >= 60 ? '#818cf8' : val >= 40 ? '#fbbf24' : '#f87171';
            return (
              <div key={key} className="bg-bg-raised border border-border-subtle p-3">
                <div className="text-xs text-text-muted uppercase tracking-wider">{label}</div>
                <div className="text-3xl font-bold tabular-nums mt-1" style={{ color: c }}>{val}</div>
              </div>
            );
          })}
        </div>

        {/* Detection rate */}
        {gtTotal > 0 && (
          <div className="bg-bg-raised border border-border-subtle p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Event Detection vs Ground Truth</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green">
                {gtTotal > 0 ? Math.round((gtDetected / gtTotal) * 100) : 0}%
              </span>
              <span className="text-base text-text-dim">({gtDetected}/{gtTotal} events)</span>
            </div>
          </div>
        )}
      </div>

      {/* CENTER: Scoring Formula + Weights */}
      <div className="border-r border-border p-8 flex flex-col gap-5">
        <div className="text-sm text-text-muted uppercase tracking-wider">Scoring Formula</div>

        {/* Formula */}
        <div className="bg-bg-raised border border-border-subtle p-4 font-mono text-base leading-relaxed">
          <span className="text-text-dim">C = </span>
          {WEIGHT_ITEMS.map(({ key }, i) => (
            <span key={key}>
              {i > 0 && <span className="text-text-muted"> + </span>}
              <span className="text-indigo font-semibold">{((weights[key] as number) || 0).toFixed(2)}</span>
              <span className="text-text-dim">·S<sub>{key.slice(0, 3)}</sub></span>
            </span>
          ))}
        </div>

        {/* Weight sliders */}
        <div className="flex-1 space-y-4 overflow-auto">
          {WEIGHT_ITEMS.map(({ key, label, reason }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-base font-medium text-text">{label}</span>
                  <span className="text-xs text-text-muted ml-2">{reason}</span>
                </div>
                <span className="text-base font-mono font-semibold tabular-nums text-indigo">
                  {((weights[key] as number) || 0).toFixed(2)}
                </span>
              </div>
              <input
                type="range" min="0" max="0.5" step="0.01"
                value={weights[key] || 0}
                onChange={e => handleWeight(key, parseFloat(e.target.value))}
                className="w-full h-2 bg-bg-raised appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo
                  [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:rounded-none"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setWeights({ ...SCORING_WEIGHTS })}
          className="shrink-0 px-4 py-2 text-sm border border-border text-text-dim
            hover:text-text hover:bg-bg-hover transition-colors"
        >
          Reset to MoRTH Defaults
        </button>
      </div>

      {/* RIGHT: Production Specs */}
      <div className="p-8 flex flex-col gap-4">
        <div className="text-sm text-text-muted uppercase tracking-wider">Production Deployment</div>

        <div className="flex-1 flex flex-col gap-3">
          {[
            { label: 'Pipeline Latency', value: `${Math.max(1, processingTimeUs).toFixed(0)} µs`, sub: 'Target: <2 ms on Cortex-M4' },
            { label: 'Code Size', value: '15 KB', sub: 'Flash (Madgwick + FFT + Scoring)' },
            { label: 'RAM Usage', value: '4 KB', sub: 'Ring buffers + FFT workspace' },
            { label: 'CPU Utilization', value: '0.12%', sub: 'at 50 Hz on 120 MHz MCU' },
            { label: 'Frames Processed', value: framesProcessed.toLocaleString(), sub: 'Live in this session' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-bg-raised border border-border-subtle p-4">
              <div className="text-xs text-text-muted uppercase tracking-wider">{label}</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-text-strong mt-1">{value}</div>
              <div className="text-xs text-text-muted mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* BOM */}
        <div className="bg-bg-raised border border-indigo/30 p-4">
          <div className="text-xs text-indigo uppercase tracking-wider font-semibold mb-3">Bill of Materials</div>
          <div className="space-y-2">
            {[
              ['Tier 1 (firmware only)', '₹0', '#4ade80'],
              ['Tier 2 (BMI270 IMU)', '₹300', '#d4d4d8'],
              ['Tier 3 (Varroc Connect)', 'Included', '#71717a'],
            ].map(([name, price, color]) => (
              <div key={name as string} className="flex justify-between text-sm">
                <span className="text-text">{name}</span>
                <span className="font-mono font-semibold" style={{ color: color as string }}>{price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
