import { useStore } from '../../store';

const LABELS: Record<string, string> = {
  emergency_brake: '⚠ Emergency brake',
  hard_brake: 'Hard brake',
  moderate_brake: 'Moderate brake',
  aggressive_accel: 'Hard acceleration',
  moderate_accel: 'Moderate acceleration',
  extreme_lean: '⚠ Extreme lean',
  hard_lean: 'Hard lean',
  moderate_lean: 'Moderate lean',
};

const COLORS: Record<string, string> = {
  emergency_brake: '#f87171', hard_brake: '#fbbf24', moderate_brake: '#71717a',
  aggressive_accel: '#fbbf24', moderate_accel: '#71717a',
  extreme_lean: '#f87171', hard_lean: '#fbbf24', moderate_lean: '#71717a',
};

export function EventLog() {
  const events = useStore(s => s.eventLog);
  const gtTotal = useStore(s => s.groundTruthTotal);
  const gtDetected = useStore(s => s.groundTruthDetected);

  return (
    <div>
      {gtTotal > 0 && (
        <div className="flex justify-between mb-2">
          <span className="text-xs text-text-muted">Ground truth</span>
          <span className="text-sm font-mono font-semibold text-green">{gtDetected}/{gtTotal}</span>
        </div>
      )}
      <div className="space-y-1">
        {events.length === 0 && (
          <div className="text-sm text-text-muted py-4 text-center">Waiting for events...</div>
        )}
        {[...events].reverse().slice(0, 12).map((ev, i) => (
          <div key={`${ev.time}-${i}`} className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-muted tabular-nums w-8">{ev.time}s</span>
            <span className="text-sm flex-1" style={{ color: COLORS[ev.type] || '#71717a' }}>
              {LABELS[ev.type] || ev.type}
            </span>
            <span className="text-xs font-mono text-text-muted tabular-nums">{ev.value.toFixed(2)}g</span>
            {ev.isGroundTruth && <span className="text-green text-sm">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
