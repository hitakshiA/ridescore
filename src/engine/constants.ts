/** All algorithm constants in one place. Traceable to datasheets and standards. */

// ── Madgwick AHRS Filter ────────────────────────────────────────────────────
// Reference: Sebastian Madgwick, University of Bristol, 2011
export const SAMPLE_RATE = 50;          // Hz (dataset native rate)
export const MADGWICK_BETA = 0.033;     // Divergence rate parameter
export const DT = 1 / SAMPLE_RATE;     // 20ms per sample

// ── FFT / Spectral Energy Ratio ─────────────────────────────────────────────
export const FFT_WINDOW_SIZE = 128;     // 2.56 seconds at 50 Hz
export const SER_LOW_FREQ_CUTOFF = 5;   // Hz — rider dynamics below this
export const SER_HIGH_FREQ_CUTOFF = 10; // Hz — road surface above this
export const SER_SMOOTH_THRESHOLD = 0.7;
export const SER_ROUGH_THRESHOLD = 0.3;

// ── Scoring Weights ─────────────────────────────────────────────────────────
// Derived from MoRTH 2023 Indian two-wheeler fatality data
export const SCORING_WEIGHTS = {
  speed: 0.35,          // 68.1% of fatalities = overspeeding
  braking: 0.20,        // Hard braking = collision precursor
  cornering: 0.15,      // Single-vehicle crashes = 20-22% of 2W fatalities
  acceleration: 0.10,   // Rapid acceleration in traffic gaps
  context: 0.10,        // Time-of-day, road type risk
  hazard: 0.10,         // Evasive maneuver quality
} as const;

// ── Braking Thresholds (in g) ───────────────────────────────────────────────
export const G = 9.81;
export const BRAKE_MODERATE_G = 0.3;
export const BRAKE_HARD_G = 0.5;
export const BRAKE_EMERGENCY_G = 0.7;
export const BRAKE_PENALTY_MODERATE = 2;
export const BRAKE_PENALTY_HARD = 5;
export const BRAKE_PENALTY_EMERGENCY = 10;

// ── Acceleration Thresholds (in g) ──────────────────────────────────────────
export const ACCEL_MODERATE_G = 0.3;
export const ACCEL_AGGRESSIVE_G = 0.5;
export const ACCEL_PENALTY_MODERATE = 3;
export const ACCEL_PENALTY_AGGRESSIVE = 8;

// ── Cornering / Lean Angle Thresholds (in degrees) ──────────────────────────
export const LEAN_MODERATE_DEG = 15;
export const LEAN_HARD_DEG = 25;
export const LEAN_EXTREME_DEG = 35;
export const LEAN_PENALTY_MODERATE = 1;
export const LEAN_PENALTY_HARD = 5;
export const LEAN_PENALTY_EXTREME = 10;

// ── Hazard Detection ────────────────────────────────────────────────────────
export const YAW_RATE_THRESHOLD = 0.5;  // rad/s

// ── EMA Smoothing ───────────────────────────────────────────────────────────
export const EMA_ALPHA = 0.5;
export const EMA_INITIAL = 80;

// ── Waveform Display ────────────────────────────────────────────────────────
export const WAVEFORM_WINDOW_SAMPLES = 500; // 10 seconds at 50 Hz

// ── Signal Colors ───────────────────────────────────────────────────────────
export const SIGNAL_COLORS = {
  accelX: '#3b82f6',  // blue
  accelY: '#22c55e',  // green
  accelZ: '#ef4444',  // red
  gyroX: '#8b5cf6',   // purple
  gyroY: '#06b6d4',   // cyan
  gyroZ: '#f97316',   // orange
} as const;

export const SCORE_COLORS = {
  good: '#22c55e',
  moderate: '#f59e0b',
  bad: '#ef4444',
} as const;
