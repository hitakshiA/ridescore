import { useStore } from '../../store';

export function OrientationDisplay() {
  const { roll, pitch, yaw } = useStore(s => s.orientation);
  const roadQuality = useStore(s => s.roadQuality);
  const penaltyFactor = useStore(s => s.penaltyFactor);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Lean Angle (Roll) — the key motorcycle metric */}
      <div className="col-span-2 flex items-center gap-4">
        {/* Arc indicator */}
        <svg width="64" height="40" viewBox="0 0 64 40">
          <path
            d="M 8 36 A 28 28 0 0 1 56 36"
            fill="none"
            stroke="#1c1c2a"
            strokeWidth="3"
          />
          {/* Needle */}
          <line
            x1="32" y1="36"
            x2={32 + 24 * Math.sin((roll * Math.PI) / 180)}
            y2={36 - 24 * Math.cos((roll * Math.PI) / 180)}
            stroke={Math.abs(roll) > 25 ? '#ef4444' : Math.abs(roll) > 15 ? '#f59e0b' : '#22c55e'}
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.1s' }}
          />
          <circle cx="32" cy="36" r="2" fill="#e8e8ec" />
        </svg>

        <div>
          <div className="text-[9px] font-mono text-text-muted tracking-wider">LEAN ANGLE</div>
          <div className="text-xl font-mono font-bold tabular-nums" style={{
            color: Math.abs(roll) > 25 ? '#ef4444' : Math.abs(roll) > 15 ? '#f59e0b' : '#22c55e'
          }}>
            {roll.toFixed(1)}°
          </div>
        </div>
      </div>

      {/* Pitch */}
      <div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">PITCH</div>
        <div className="text-sm font-mono font-semibold tabular-nums text-text-primary">
          {pitch.toFixed(1)}°
        </div>
      </div>

      {/* Yaw */}
      <div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">YAW</div>
        <div className="text-sm font-mono font-semibold tabular-nums text-text-primary">
          {yaw.toFixed(1)}°
        </div>
      </div>

      {/* Road Quality */}
      <div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">ROAD</div>
        <div className="text-sm font-mono font-semibold" style={{
          color: roadQuality === 'SMOOTH' ? '#22c55e' : roadQuality === 'ROUGH' ? '#ef4444' : '#f59e0b'
        }}>
          {roadQuality}
        </div>
      </div>

      {/* Penalty Factor */}
      <div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">PENALTY</div>
        <div className="text-sm font-mono font-semibold tabular-nums text-text-primary">
          ×{penaltyFactor.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
