import { useStore } from '../../store';

const ITEMS: { key: string; label: string }[] = [
  { key: 'speed', label: 'Speed Control' },
  { key: 'braking', label: 'Braking' },
  { key: 'cornering', label: 'Cornering' },
  { key: 'acceleration', label: 'Throttle' },
  { key: 'context', label: 'Awareness' },
  { key: 'hazard', label: 'Hazard' },
];

function color(v: number) {
  if (v >= 80) return '#4ade80';
  if (v >= 60) return '#818cf8';
  if (v >= 40) return '#fbbf24';
  return '#f87171';
}

export function RiderScoreCard() {
  const scores = useStore(s => s.scores);

  return (
    <div className="space-y-3 py-1">
      {ITEMS.map(({ key, label }) => {
        const val = Math.round((scores as any)[key]);
        const c = color(val);
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text">{label}</span>
              <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: c }}>{val}</span>
            </div>
            <div className="h-1.5 bg-bg rounded-sm overflow-hidden">
              <div className="h-full rounded-sm transition-all duration-300"
                style={{ width: `${val}%`, backgroundColor: c, opacity: 0.6 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
