import { useStore } from '../../store';

export function PerformanceMetrics() {
  const processingTimeUs = useStore(s => s.processingTimeUs);
  const framesProcessed = useStore(s => s.framesProcessed);
  const currentTime = useStore(s => s.currentTime);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      <div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">PROCESSING</div>
        <div className="text-sm font-mono font-semibold tabular-nums text-text-primary">
          {processingTimeUs.toFixed(0)} µs
        </div>
      </div>

      <div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">FRAMES</div>
        <div className="text-sm font-mono font-semibold tabular-nums text-text-primary">
          {framesProcessed.toLocaleString()}
        </div>
      </div>

      <div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">TIME</div>
        <div className="text-sm font-mono font-semibold tabular-nums text-text-primary">
          {currentTime.toFixed(1)}s
        </div>
      </div>

      <div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">MCU TARGET</div>
        <div className="text-[10px] font-mono text-accent">
          1.2 ms / cycle
        </div>
        <div className="text-[8px] font-mono text-text-muted">
          Cortex-M4 @120MHz
        </div>
      </div>
    </div>
  );
}
