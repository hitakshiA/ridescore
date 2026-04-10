import { useStore } from '../../store';

const LABELS: Record<string, string> = {
  speed: 'SPEED',
  braking: 'BRAKING',
  cornering: 'CORNERING',
  acceleration: 'ACCEL',
  context: 'CONTEXT',
  hazard: 'HAZARD',
};

const WEIGHT_LABELS: Record<string, string> = {
  speed: '0.35',
  braking: '0.20',
  cornering: '0.15',
  acceleration: '0.10',
  context: '0.10',
  hazard: '0.10',
};

function scoreColor(v: number) {
  if (v >= 70) return '#22c55e';
  if (v >= 40) return '#f59e0b';
  return '#ef4444';
}

export function SubScoreBars() {
  const scores = useStore(s => s.scores);

  const entries = ['speed', 'braking', 'cornering', 'acceleration', 'context', 'hazard'] as const;

  return (
    <div className="space-y-1.5">
      {entries.map(key => {
        const val = Math.round(scores[key]);
        const color = scoreColor(val);

        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-text-muted w-16 tracking-wider">
              {LABELS[key]}
            </span>
            <div className="flex-1 h-2.5 bg-surface-raised relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${val}%`,
                  backgroundColor: color,
                  opacity: 0.6,
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
            <span
              className="text-[11px] font-mono font-semibold tabular-nums w-7 text-right"
              style={{ color }}
            >
              {val}
            </span>
            <span className="text-[8px] font-mono text-text-muted w-6 text-right">
              ×{WEIGHT_LABELS[key]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
