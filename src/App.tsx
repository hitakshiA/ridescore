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

  // Initialize engine when data loads
  useEffect(() => {
    if (!tripData) return;

    const engine = new PlaybackEngine(tripData, tripData.groundTruth);
    engineRef.current = engine;

    useStore.setState({
      playState: 'ready',
      totalDuration: tripData.duration,
      groundTruthTotal: tripData.groundTruth.length,
    });

    // Seek to t=10s — early aggressive events at t=16-26s show score drops
    engine.seekTo(10);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [tripData]);

  // Handle act changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !roadSamples) return;

    if (currentAct === 2) {
      // Act 2: enable comparison mode with pothole overlay
      engine.pause();
      engine.comparisonMode = true;

      // Create pothole perturbation signal
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
      <div className="h-screen flex flex-col items-center justify-center bg-surface">
        <div className="text-xl font-mono text-text-muted mb-4">
          Loading IMU data...
        </div>
        <div className="w-48 h-0.5 bg-surface-raised overflow-hidden">
          <div className="h-full bg-accent animate-pulse w-1/2" />
        </div>
        <div className="text-[10px] font-mono text-text-muted mt-4">
          20,291 samples at 50 Hz — Trip 17 (Souza et al.)
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-score-bad font-mono">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <TopBar onPlay={handlePlay} onPause={handlePause} onSeek={handleSeek} />

      {currentAct === 1 && <Act1RealData />}
      {currentAct === 2 && <Act2Comparison />}
      {currentAct === 3 && <Act3Production />}
    </div>
  );
}

export default App;
