export interface TripData {
  sampleRate: number;
  duration: number;
  samples: number;
  accel: { x: number[]; y: number[]; z: number[] };
  gyro: { x: number[]; y: number[]; z: number[] };
  groundTruth: GroundTruthEvent[];
}

export interface GroundTruthEvent {
  event: string;
  start: number;
  end: number;
}

export interface RoadSamples {
  potholes: number[][];
  regular: number[][];
  asphaltBumps: number[][];
  metalBumps: number[][];
  wornOut: number[][];
}

export type PlayState = 'loading' | 'ready' | 'playing' | 'paused';
export type ActNumber = 1 | 2 | 3;
export type RoadQuality = 'SMOOTH' | 'MODERATE' | 'ROUGH';

export interface TimelineEvent {
  time: number;
  type: string;
  value: number;
  isGroundTruth: boolean;
}
