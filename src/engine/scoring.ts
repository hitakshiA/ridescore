/**
 * Crash-weighted driving behavior scoring engine.
 *
 * Weights derived from MoRTH 2023 Indian two-wheeler fatality statistics:
 * - 77,500 deaths/year (44.8% of all road deaths)
 * - 68.1% caused by overspeeding
 * - 23.6% dangerous/careless driving
 * - Head injuries cause 88% of motorcyclist deaths (WHO)
 */

import {
  G,
  BRAKE_MODERATE_G, BRAKE_HARD_G, BRAKE_EMERGENCY_G,
  BRAKE_PENALTY_MODERATE, BRAKE_PENALTY_HARD, BRAKE_PENALTY_EMERGENCY,
  ACCEL_MODERATE_G, ACCEL_AGGRESSIVE_G,
  ACCEL_PENALTY_MODERATE, ACCEL_PENALTY_AGGRESSIVE,
  LEAN_MODERATE_DEG, LEAN_HARD_DEG, LEAN_EXTREME_DEG,
  LEAN_PENALTY_MODERATE, LEAN_PENALTY_HARD, LEAN_PENALTY_EXTREME,
  YAW_RATE_THRESHOLD,
  SCORING_WEIGHTS,
  EMA_ALPHA,
} from './constants';

export interface ScoringEvent {
  type: string;
  value: number;
}

export interface SubScores {
  speed: number;
  braking: number;
  cornering: number;
  acceleration: number;
  context: number;
  hazard: number;
}

// ── Braking Score ───────────────────────────────────────────────────────────

export function scoreBraking(peakDecel: number, penaltyFactor: number = 1): { score: number; event: ScoringEvent | null } {
  const aG = Math.abs(peakDecel) / G;
  let penalty = 0;
  let event: ScoringEvent | null = null;

  if (aG >= BRAKE_EMERGENCY_G) {
    penalty = BRAKE_PENALTY_EMERGENCY * penaltyFactor;
    event = { type: 'emergency_brake', value: aG };
  } else if (aG >= BRAKE_HARD_G) {
    penalty = BRAKE_PENALTY_HARD * penaltyFactor;
    event = { type: 'hard_brake', value: aG };
  } else if (aG >= BRAKE_MODERATE_G) {
    penalty = BRAKE_PENALTY_MODERATE * penaltyFactor;
    event = { type: 'moderate_brake', value: aG };
  }

  return { score: Math.max(0, 100 - penalty), event };
}

// ── Acceleration Score ──────────────────────────────────────────────────────

export function scoreAcceleration(peakAccel: number, penaltyFactor: number = 1): { score: number; event: ScoringEvent | null } {
  const aG = Math.abs(peakAccel) / G;
  let penalty = 0;
  let event: ScoringEvent | null = null;

  if (aG >= ACCEL_AGGRESSIVE_G) {
    penalty = ACCEL_PENALTY_AGGRESSIVE * penaltyFactor;
    event = { type: 'aggressive_accel', value: aG };
  } else if (aG >= ACCEL_MODERATE_G) {
    penalty = ACCEL_PENALTY_MODERATE * penaltyFactor;
    event = { type: 'moderate_accel', value: aG };
  }

  return { score: Math.max(0, 100 - penalty), event };
}

// ── Cornering / Lean Angle Score ────────────────────────────────────────────

export function scoreCornering(peakLeanDeg: number, penaltyFactor: number = 1): { score: number; event: ScoringEvent | null } {
  const absLean = Math.abs(peakLeanDeg);
  let penalty = 0;
  let event: ScoringEvent | null = null;

  if (absLean >= LEAN_EXTREME_DEG) {
    penalty = LEAN_PENALTY_EXTREME * penaltyFactor;
    event = { type: 'extreme_lean', value: absLean };
  } else if (absLean >= LEAN_HARD_DEG) {
    penalty = LEAN_PENALTY_HARD * penaltyFactor;
    event = { type: 'hard_lean', value: absLean };
  } else if (absLean >= LEAN_MODERATE_DEG) {
    penalty = LEAN_PENALTY_MODERATE * penaltyFactor;
    event = { type: 'moderate_lean', value: absLean };
  }

  return { score: Math.max(0, 100 - penalty), event };
}

// ── Speed Score ─────────────────────────────────────────────────────────────

export function scoreSpeed(accelMagnitude: number, penaltyFactor: number = 1): number {
  return Math.max(0, 100 - Math.max(0, (accelMagnitude - 1.5) * 20) * penaltyFactor);
}

// ── Hazard Score ────────────────────────────────────────────────────────────

export function scoreHazard(yawRate: number, penaltyFactor: number = 1): number {
  return Math.max(0, 100 - Math.max(0, (yawRate - YAW_RATE_THRESHOLD) * 30) * penaltyFactor);
}

// ── Composite Score ─────────────────────────────────────────────────────────

export function computeComposite(
  sub: SubScores,
  weights: typeof SCORING_WEIGHTS = SCORING_WEIGHTS,
): number {
  return (
    weights.speed * sub.speed +
    weights.braking * sub.braking +
    weights.cornering * sub.cornering +
    weights.acceleration * sub.acceleration +
    weights.context * sub.context +
    weights.hazard * sub.hazard
  );
}

// ── EMA Smoothing ───────────────────────────────────────────────────────────

export function emaSmooth(current: number, previous: number, alpha: number = EMA_ALPHA): number {
  return alpha * current + (1 - alpha) * previous;
}
