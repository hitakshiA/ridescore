import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store';
import { useDataLoader } from './hooks/useDataLoader';
import { PlaybackEngine } from './playback/PlaybackEngine';
import { TopBar } from './components/layout/TopBar';
import { Act1RealData } from './components/acts/Act1RealData';
import { Act2Comparison } from './components/acts/Act2Comparison';
import { Act3Production } from './components/acts/Act3Production';

function App() {
  const { tripData, roadSamples, loading, error } = useDataLoader();
  const engineRef = useRef<PlaybackEngine | null>(null);
  const currentAct = useStore(s => s.currentAct);
  const playState = useStore(s => s.playState);

  useEffect(() => {
    if (!tripData) return;

    const engine = new PlaybackEngine(tripData, tripData.groundTruth);
    engineRef.current = engine;

    useStore.setState({
      playState: 'ready',
      totalDuration: tripData.duration,
      groundTruthTotal: tripData.groundTruth.length,
    });

    engine.seekTo(10);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [tripData]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !roadSamples) return;

    if (currentAct === 2) {
      engine.pause();
      engine.comparisonMode = true;
      const potholeSamples = roadSamples.potholes[0];
      if (potholeSamples) {
        const mean = potholeSamples.reduce((a, b) => a + b, 0) / potholeSamples.length;
        const perturbation = potholeSamples.map(v => (v - mean) * 0.8);
        engine.setPotholeOverlay(perturbation);
      }
      engine.seekTo(50);
      engine.start();
    } else {
      engine.comparisonMode = false;
      engine.setPotholeOverlay(null);
      if (currentAct === 1) {
        engine.seekTo(10);
      }
    }
  }, [currentAct, roadSamples]);

  const handlePlay = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleSeek = useCallback((time: number) => {
    engineRef.current?.seekTo(time);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-bg">
        <div className="text-xl text-text-dim mb-4">Loading IMU data...</div>
        <div className="w-48 h-1 bg-bg-raised overflow-hidden">
          <div className="h-full bg-indigo animate-pulse w-1/2" />
        </div>
        <div className="text-xs text-text-muted mt-4">
          20,291 samples at 50 Hz — Trip 17 (Souza et al.)
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="text-red text-lg">Error: {error}</div>
      </div>
    );
  }

  const showPlayOverlay = playState === 'ready' || playState === 'paused';

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden relative">
      <TopBar onPlay={handlePlay} onPause={handlePause} onSeek={handleSeek} />

      <div className="flex-1 min-h-0 relative">
        {currentAct === 1 && <Act1RealData />}
        {currentAct === 2 && <Act2Comparison />}
        {currentAct === 3 && <Act3Production />}

        {/* Play overlay — shown when paused/ready */}
        {showPlayOverlay && currentAct !== 3 && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/60 backdrop-blur-sm">
            <button
              onClick={handlePlay}
              className="group flex flex-col items-center gap-4 cursor-pointer"
            >
              <div className="w-24 h-24 flex items-center justify-center border-2 border-text-dim/30
                group-hover:border-text-strong group-hover:bg-bg-raised transition-all duration-200">
                <svg width="36" height="40" viewBox="0 0 36 40" fill="none">
                  <path d="M4 2L34 20L4 38V2Z" fill="currentColor" className="text-text-dim group-hover:text-text-strong transition-colors" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-text-strong">
                  {playState === 'ready' ? 'Start Ride Replay' : 'Resume'}
                </div>
                <div className="text-sm text-text-dim mt-0.5">
                  Processing real IMU data at 50 Hz — Souza et al. (CC BY 4.0)
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
