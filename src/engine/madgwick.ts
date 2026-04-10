/**
 * Madgwick AHRS Filter — Quaternion-based orientation from 6-axis IMU.
 *
 * Direct port of scoring_pipeline.py MadgwickAHRS class.
 * Zero allocations per update call.
 *
 * Reference: Sebastian Madgwick, University of Bristol, 2011
 * Published accuracy: 0.59° RMSE for roll estimation
 * On Cortex-M4 at 120 MHz: ~100 µs per update, <1 KB RAM
 */

import { MADGWICK_BETA, DT } from './constants';

export class MadgwickAHRS {
  q0 = 1;
  q1 = 0;
  q2 = 0;
  q3 = 0;

  private beta: number;
  private dt: number;

  constructor(beta: number = MADGWICK_BETA, dt: number = DT) {
    this.beta = beta;
    this.dt = dt;
  }

  /** Process one IMU sample. Gyro in rad/s, accel in m/s². */
  update(gx: number, gy: number, gz: number, ax: number, ay: number, az: number): void {
    let { q0, q1, q2, q3 } = this;

    // Normalize accelerometer
    let norm = Math.sqrt(ax * ax + ay * ay + az * az);
    if (norm < 1e-10) return;
    ax /= norm; ay /= norm; az /= norm;

    // Precompute
    const _2q0 = 2 * q0, _2q1 = 2 * q1, _2q2 = 2 * q2, _2q3 = 2 * q3;
    const _4q0 = 4 * q0, _4q1 = 4 * q1, _4q2 = 4 * q2;
    const _8q1 = 8 * q1, _8q2 = 8 * q2;
    const q0q0 = q0 * q0, q1q1 = q1 * q1, q2q2 = q2 * q2, q3q3 = q3 * q3;

    // Gradient descent — objective function minimizing gravity alignment error
    let s0 = _4q0 * q2q2 + _2q2 * ax + _4q0 * q1q1 - _2q1 * ay;
    let s1 = _4q1 * q3q3 - _2q3 * ax + 4 * q0q0 * q1 - _2q0 * ay - _4q1 + _8q1 * q1q1 + _8q1 * q2q2 + _4q1 * az;
    let s2 = 4 * q0q0 * q2 + _2q0 * ax + _4q2 * q3q3 - _2q3 * ay - _4q2 + _8q2 * q1q1 + _8q2 * q2q2 + _4q2 * az;
    let s3 = 4 * q1q1 * q3 - _2q1 * ax + 4 * q2q2 * q3 - _2q2 * ay;

    // Normalize gradient
    norm = Math.sqrt(s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3);
    if (norm < 1e-10) return;
    s0 /= norm; s1 /= norm; s2 /= norm; s3 /= norm;

    // Quaternion derivative from gyroscope
    let qDot0 = 0.5 * (-q1 * gx - q2 * gy - q3 * gz);
    let qDot1 = 0.5 * (q0 * gx + q2 * gz - q3 * gy);
    let qDot2 = 0.5 * (q0 * gy - q1 * gz + q3 * gx);
    let qDot3 = 0.5 * (q0 * gz + q1 * gy - q2 * gx);

    // Apply feedback correction
    qDot0 -= this.beta * s0;
    qDot1 -= this.beta * s1;
    qDot2 -= this.beta * s2;
    qDot3 -= this.beta * s3;

    // Integrate
    q0 += qDot0 * this.dt;
    q1 += qDot1 * this.dt;
    q2 += qDot2 * this.dt;
    q3 += qDot3 * this.dt;

    // Normalize quaternion
    norm = Math.sqrt(q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
    this.q0 = q0 / norm;
    this.q1 = q1 / norm;
    this.q2 = q2 / norm;
    this.q3 = q3 / norm;
  }

  /** Get Euler angles in degrees. Roll = lean angle for motorcycle. */
  getEuler(): { roll: number; pitch: number; yaw: number } {
    const { q0, q1, q2, q3 } = this;

    // Roll (lean angle)
    const sinr = 2 * (q0 * q1 + q2 * q3);
    const cosr = 1 - 2 * (q1 * q1 + q2 * q2);
    const roll = Math.atan2(sinr, cosr) * (180 / Math.PI);

    // Pitch
    let sinp = 2 * (q0 * q2 - q3 * q1);
    sinp = Math.max(-1, Math.min(1, sinp));
    const pitch = Math.asin(sinp) * (180 / Math.PI);

    // Yaw
    const siny = 2 * (q0 * q3 + q1 * q2);
    const cosy = 1 - 2 * (q2 * q2 + q3 * q3);
    const yaw = Math.atan2(siny, cosy) * (180 / Math.PI);

    return { roll, pitch, yaw };
  }

  /** Reset to identity quaternion. */
  reset(): void {
    this.q0 = 1; this.q1 = 0; this.q2 = 0; this.q3 = 0;
  }
}
