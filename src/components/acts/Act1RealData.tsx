import { useState } from 'react';
import { MotorcycleView } from '../visualizations/MotorcycleView';
import { RideTimeline } from '../visualizations/RideTimeline';
import { RiderScoreCard } from '../visualizations/RiderScoreCard';
import { EventLog } from '../panels/EventLog';
import { WaveformCanvas } from '../visualizations/WaveformCanvas';
import { FFTSpectrumCanvas } from '../visualizations/FFTSpectrumCanvas';

export function Act1RealData() {
  const [techOpen, setTechOpen] = useState(true);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Road timeline */}
      <div className="shrink-0">
        <RideTimeline height={120} />
      </div>

      {/* Main 3-column layout — fills remaining height */}
      <div className="flex-1 grid grid-cols-[280px_1fr_260px] min-h-0 border-t border-border">

        {/* LEFT: Score + Bike + Stats — all integrated */}
        <div className="border-r border-border min-h-0 overflow-hidden">
          <MotorcycleView />
        </div>

        {/* CENTER: Signals */}
        <div className="flex flex-col min-h-0">
          {/* Accelerometer — takes most space */}
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-border shrink-0">
            <span className="text-sm text-text-dim">Accelerometer · 50 Hz</span>
          </div>
          <div className="flex-1 min-h-0">
            <WaveformCanvas />
          </div>

          {/* Tech toggle */}
          <button
            onClick={() => setTechOpen(!techOpen)}
            className="shrink-0 px-4 py-1.5 text-xs text-text-muted hover:text-text transition-colors
              border-t border-border flex items-center justify-between"
          >
            <span>{techOpen ? '▾' : '▸'} Gyroscope · FFT · Road Separation</span>
            <span className="text-indigo">{techOpen ? 'Hide' : 'Show'}</span>
          </button>
          {techOpen && (
            <div className="shrink-0 grid grid-cols-2 border-t border-border" style={{ height: 150 }}>
              <div className="border-r border-border p-1">
                <WaveformCanvas height={140} showGyro />
              </div>
              <div className="p-1">
                <FFTSpectrumCanvas height={140} />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Behavior breakdown + Event feed — both share space equally */}
        <div className="border-l border-border flex flex-col min-h-0">
          {/* Behavior — shrinks to content */}
          <div className="shrink-0">
            <div className="px-4 py-2 border-b border-border">
              <span className="text-sm font-medium text-text-strong">Riding Behavior</span>
            </div>
            <div className="px-4 py-2">
              <RiderScoreCard />
            </div>
          </div>

          {/* Events — fills remaining space */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-border">
            <div className="px-4 py-2 shrink-0">
              <span className="text-sm font-medium text-text-strong">Events</span>
            </div>
            <div className="flex-1 overflow-auto px-4 pb-2 min-h-0">
              <EventLog />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
