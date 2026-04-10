import { useStore } from '../../store';
import type { ActNumber } from '../../playback/types';

interface Props {
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

const SPEEDS = [1, 2, 3, 5, 10];

export function TopBar({ onPlay, onPause }: Props) {
  const playState = useStore(s => s.playState);
  const currentAct = useStore(s => s.currentAct);
  const playbackSpeed = useStore(s => s.playbackSpeed);
  const currentTime = useStore(s => s.currentTime);
  const totalDuration = useStore(s => s.totalDuration);
  const setAct = useStore(s => s.setAct);
  const setSpeed = useStore(s => s.setPlaybackSpeed);

  const isPlaying = playState === 'playing';
  const mins = Math.floor(currentTime / 60);
  const secs = Math.floor(currentTime % 60);

  return (
    <header className="h-14 bg-bg-raised border-b border-border flex items-center justify-between px-5 shrink-0">
      {/* Left: brand */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-text-strong tracking-tight">RideScore</h1>
        <span className="text-sm text-text-dim">Two-Wheeler Behavior Analysis</span>
      </div>

      {/* Center: navigation */}
      <nav className="flex items-center bg-bg rounded-sm overflow-hidden border border-border-subtle">
        {([
          [1, 'Ride Replay'],
          [2, 'Road Quality'],
          [3, 'For OEMs'],
        ] as [ActNumber, string][]).map(([act, label]) => (
          <button
            key={act}
            onClick={() => setAct(act)}
            className={`px-5 py-1.5 text-sm font-medium transition-colors ${
              currentAct === act
                ? 'bg-text-strong text-bg'
                : 'text-text-dim hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Right: playback */}
      <div className="flex items-center gap-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="w-9 h-9 flex items-center justify-center border border-border
            hover:bg-bg-hover transition-colors text-text-strong text-sm"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="flex items-center border border-border-subtle overflow-hidden">
          {SPEEDS.map(speed => (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={`px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                playbackSpeed === speed
                  ? 'bg-text-strong text-bg'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>

        <span className="text-sm font-mono text-text-dim tabular-nums min-w-[100px] text-right">
          {mins}:{secs.toString().padStart(2, '0')} / {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
        </span>
      </div>
    </header>
  );
}
