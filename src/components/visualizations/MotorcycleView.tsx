import { useStore } from '../../store';

export function MotorcycleView() {
  const { roll, pitch } = useStore(s => s.orientation);
  const roadQuality = useStore(s => s.roadQuality);
  const ser = useStore(s => s.ser);
  const score = useStore(s => s.scores.compositeEma);

  const lean = roll;
  const leanColor = Math.abs(lean) > 25 ? '#f87171' : Math.abs(lean) > 15 ? '#fbbf24' : '#4ade80';
  const roadColor = roadQuality === 'SMOOTH' ? '#4ade80' : roadQuality === 'ROUGH' ? '#f87171' : '#fbbf24';
  const scoreColor = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div className="h-full flex flex-col px-4 py-3">
      {/* Score */}
      <div className="flex items-end gap-2 mb-3">
        <span className="text-7xl font-bold tabular-nums tracking-tighter leading-none" style={{ color: scoreColor }}>
          {Math.round(score)}
        </span>
        <div className="pb-2">
          <div className="text-base font-semibold text-text-strong">Ride Score</div>
          <div className="text-xs text-text-muted">MoRTH weighted</div>
        </div>
      </div>

      {/* Lean angle */}
      <div className="mb-2">
        <div className="text-4xl font-bold tabular-nums tracking-tight" style={{ color: leanColor }}>
          {lean >= 0 ? '+' : ''}{lean.toFixed(1)}°
        </div>
        <div className="text-xs text-text-muted uppercase tracking-wider mt-0.5">Lean angle</div>
      </div>

      {/* REAR VIEW motorcycle — shows left/right lean */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <svg width="200" height="180" viewBox="0 0 200 180">
          {/* Ground */}
          <line x1="20" y1="165" x2="180" y2="165" stroke={roadColor} strokeWidth="2" opacity="0.35" />
          {/* Lean arc */}
          <path d="M 50 165 A 50 50 0 0 1 150 165" fill="none" stroke="#27272a" strokeWidth="1" />

          {/* Bike + rider — pivots at ground contact, leans left/right */}
          <g transform={`rotate(${lean}, 100, 165)`} style={{ transition: 'transform 0.08s linear' }}>
            {/* Tire */}
            <ellipse cx="100" cy="158" rx="20" ry="7" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            {/* Mudguard */}
            <path d="M 88 150 Q 100 143 112 150" fill="none" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Body */}
            <path d="M 93 148 L 91 100 Q 91 94 97 94 L 103 94 Q 109 94 109 100 L 107 148 Z"
              fill="#1a1a1d" stroke="#3f3f46" strokeWidth="1" />
            {/* Engine fins */}
            {[125, 130, 135].map(y => (
              <g key={y}>
                <line x1="88" y1={y} x2="93" y2={y} stroke="#3f3f46" strokeWidth="1" />
                <line x1="107" y1={y} x2="112" y2={y} stroke="#3f3f46" strokeWidth="1" />
              </g>
            ))}
            {/* Exhaust */}
            <path d="M 88 140 L 78 145 Q 76 146 76 144 L 78 138" fill="none" stroke="#52525b" strokeWidth="1.5" />
            <path d="M 112 140 L 122 145 Q 124 146 124 144 L 122 138" fill="none" stroke="#52525b" strokeWidth="1.5" />
            {/* Fuel tank */}
            <ellipse cx="100" cy="100" rx="14" ry="8" fill="#27272a" stroke="#52525b" strokeWidth="1" />
            {/* Handlebars */}
            <line x1="68" y1="85" x2="132" y2="85" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
            <circle cx="66" cy="85" r="3" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5" />
            <circle cx="134" cy="85" r="3" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5" />
            {/* Mirrors */}
            <line x1="70" y1="83" x2="64" y2="74" stroke="#52525b" strokeWidth="1" />
            <ellipse cx="62" cy="72" rx="5" ry="3.5" fill="#1a1a1d" stroke="#52525b" strokeWidth="0.8" />
            <line x1="130" y1="83" x2="136" y2="74" stroke="#52525b" strokeWidth="1" />
            <ellipse cx="138" cy="72" rx="5" ry="3.5" fill="#1a1a1d" stroke="#52525b" strokeWidth="0.8" />
            {/* Headlight */}
            <circle cx="100" cy="88" r="4" fill="#fbbf24" opacity="0.35" />
            <circle cx="100" cy="88" r="2.5" fill="#fbbf24" opacity="0.5" />
            {/* Rider torso */}
            <path d="M 92 75 Q 92 58 100 55 Q 108 58 108 75 Z" fill="#27272a" stroke="#52525b" strokeWidth="1" />
            {/* Shoulders */}
            <line x1="82" y1="68" x2="118" y2="68" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
            {/* Arms */}
            <path d="M 82 68 Q 76 76 70 83" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
            <path d="M 118 68 Q 124 76 130 83" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
            {/* Helmet */}
            <ellipse cx="100" cy="44" rx="11" ry="13" fill="#27272a" stroke="#52525b" strokeWidth="1.5" />
            <path d="M 91 44 Q 100 50 109 44" fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.4" />
            {/* Tail light */}
            <rect x="96" y="147" width="8" height="2.5" rx="1" fill="#f87171" opacity="0.5" />
          </g>
        </svg>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        <div className="bg-bg-raised border border-border-subtle px-3 py-2">
          <div className="text-lg font-semibold" style={{ color: roadColor }}>{roadQuality}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Road</div>
        </div>
        <div className="bg-bg-raised border border-border-subtle px-3 py-2">
          <div className="text-lg font-semibold tabular-nums text-text">{pitch.toFixed(1)}°</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Pitch</div>
        </div>
        <div className="bg-bg-raised border border-border-subtle px-3 py-2">
          <div className="text-lg font-mono font-semibold tabular-nums text-text">{ser.toFixed(3)}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">SER</div>
        </div>
        <div className="bg-bg-raised border border-border-subtle px-3 py-2">
          <div className="text-lg font-mono font-semibold tabular-nums text-text">50<span className="text-sm text-text-dim"> Hz</span></div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Sample Rate</div>
        </div>
      </div>
    </div>
  );
}
