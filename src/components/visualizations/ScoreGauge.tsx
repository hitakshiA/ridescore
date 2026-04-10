import { useStore } from '../../store';

export function ScoreGauge() {
  const ema = useStore(s => s.scores.compositeEma);
  const score = Math.round(ema);
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171';
  const label = score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';

  const r = 52, sw = 6;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const offset = arc * (1 - score / 100);

  return (
    <div className="flex items-center gap-5 px-4 py-3">
      <svg width="120" height="100" viewBox="0 0 120 100">
        <circle cx="60" cy="58" r={r} fill="none" stroke="#1a1a1d" strokeWidth={sw}
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" transform="rotate(135 60 58)" />
        <circle cx="60" cy="58" r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${arc} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(135 60 58)" style={{ transition: 'stroke-dashoffset 0.3s, stroke 0.3s' }} />
        <text x="60" y="55" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontFamily="Space Grotesk" fontWeight="700" fontSize="36">
          {score}
        </text>
        <text x="60" y="78" textAnchor="middle" fill={color} fontFamily="Space Grotesk"
          fontWeight="500" fontSize="11" opacity="0.7">
          {label}
        </text>
      </svg>
      <div className="text-sm text-text-dim leading-relaxed">
        Composite driving score weighted by Indian crash fatality data (MoRTH 2023)
      </div>
    </div>
  );
}
