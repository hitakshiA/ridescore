import { create } from 'zustand';
import type { PlayState, ActNumber, RoadQuality, TimelineEvent } from '../playback/types';
import { SCORING_WEIGHTS } from '../engine/constants';

export interface DashboardStore {
  // ── Playback ────────────────────────────────────────────────────────────
  currentTime: number;
  playState: PlayState;
  playbackSpeed: number;
  currentAct: ActNumber;
  totalDuration: number;

  // ── Raw signals (updated at 50 Hz by PlaybackEngine) ────────────────────
  waveformData: {
    accelX: number[];
    accelY: number[];
    accelZ: number[];
    gyroX: number[];
    gyroY: number[];
    gyroZ: number[];
  };

  // ── Orientation from Madgwick ───────────────────────────────────────────
  orientation: { roll: number; pitch: number; yaw: number };

  // ── FFT spectrum ────────────────────────────────────────────────────────
  fftBins: number[];
  fftFreqs: number[];
  ser: number;
  roadQuality: RoadQuality;
  penaltyFactor: number;

  // ── Scores (updated at 1 Hz) ────────────────────────────────────────────
  scores: {
    speed: number;
    braking: number;
    cornering: number;
    acceleration: number;
    context: number;
    hazard: number;
    composite: number;
    compositeEma: number;
  };

  // ── Naive comparison (Act 2) ────────────────────────────────────────────
  naiveComposite: number;

  // ── Events ──────────────────────────────────────────────────────────────
  eventLog: TimelineEvent[];
  groundTruthTotal: number;
  groundTruthDetected: number;

  // ── Performance ─────────────────────────────────────────────────────────
  processingTimeUs: number;
  framesProcessed: number;

  // ── Act 3 adjustable weights ────────────────────────────────────────────
  weights: Record<string, number>;

  // ── Actions ─────────────────────────────────────────────────────────────
  setPlayState: (s: PlayState) => void;
  setAct: (act: ActNumber) => void;
  setPlaybackSpeed: (speed: number) => void;
  setWeights: (w: Record<string, number>) => void;
  addEvent: (e: TimelineEvent) => void;
  resetEvents: () => void;
}

export const useStore = create<DashboardStore>((set) => ({
  currentTime: 0,
  playState: 'loading',
  playbackSpeed: 3,
  currentAct: 1,
  totalDuration: 0,

  waveformData: {
    accelX: [], accelY: [], accelZ: [],
    gyroX: [], gyroY: [], gyroZ: [],
  },

  orientation: { roll: 0, pitch: 0, yaw: 0 },

  fftBins: [],
  fftFreqs: [],
  ser: 0.5,
  roadQuality: 'MODERATE',
  penaltyFactor: 1,

  scores: {
    speed: 100, braking: 100, cornering: 100,
    acceleration: 100, context: 80, hazard: 100,
    composite: 80, compositeEma: 80,
  },

  naiveComposite: 80,

  eventLog: [],
  groundTruthTotal: 0,
  groundTruthDetected: 0,

  processingTimeUs: 0,
  framesProcessed: 0,

  weights: { ...SCORING_WEIGHTS },

  setPlayState: (s) => set({ playState: s }),
  setAct: (act) => set({ currentAct: act }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setWeights: (w) => set({ weights: w }),
  addEvent: (e) => set((state) => ({
    eventLog: [...state.eventLog.slice(-49), e],
  })),
  resetEvents: () => set({ eventLog: [], groundTruthDetected: 0 }),
}));
