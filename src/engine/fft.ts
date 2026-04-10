/**
 * Radix-2 DIT FFT + Spectral Energy Ratio (SER) for road surface separation.
 *
 * SER distinguishes road vibration (>10 Hz) from rider dynamics (<5 Hz).
 * This is the key India-specific innovation: prevents penalizing riders
 * for rough road conditions (potholes, speed breakers).
 *
 * Reference: IRC SP:16-2019 road roughness classification
 */

import { SER_LOW_FREQ_CUTOFF, SER_SMOOTH_THRESHOLD, SER_ROUGH_THRESHOLD, SAMPLE_RATE } from './constants';

/**
 * In-place Cooley-Tukey radix-2 FFT.
 * Input: real array (length must be power of 2).
 * Returns: magnitude-squared (power spectrum) of positive frequencies.
 */
export function radix2FFT(input: Float64Array): Float64Array {
  const N = input.length;
  // Bit-reversal permutation
  const real = new Float64Array(N);
  const imag = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    let j = 0;
    let n = i;
    for (let k = 0; k < Math.log2(N); k++) {
      j = (j << 1) | (n & 1);
      n >>= 1;
    }
    real[j] = input[i];
  }

  // Butterfly computation
  for (let size = 2; size <= N; size *= 2) {
    const halfSize = size / 2;
    const angle = -2 * Math.PI / size;
    for (let i = 0; i < N; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const cos = Math.cos(angle * j);
        const sin = Math.sin(angle * j);
        const tReal = real[i + j + halfSize] * cos - imag[i + j + halfSize] * sin;
        const tImag = real[i + j + halfSize] * sin + imag[i + j + halfSize] * cos;
        real[i + j + halfSize] = real[i + j] - tReal;
        imag[i + j + halfSize] = imag[i + j] - tImag;
        real[i + j] += tReal;
        imag[i + j] += tImag;
      }
    }
  }

  // Return power spectrum (positive frequencies only)
  const halfN = N / 2 + 1;
  const power = new Float64Array(halfN);
  for (let i = 0; i < halfN; i++) {
    power[i] = real[i] * real[i] + imag[i] * imag[i];
  }
  return power;
}

/** Get frequencies for each FFT bin. */
export function fftFrequencies(windowSize: number, sampleRate: number = SAMPLE_RATE): Float64Array {
  const halfN = windowSize / 2 + 1;
  const freqs = new Float64Array(halfN);
  for (let i = 0; i < halfN; i++) {
    freqs[i] = (i * sampleRate) / windowSize;
  }
  return freqs;
}

/** Hanning window. */
function hanningWindow(N: number): Float64Array {
  const w = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
  }
  return w;
}

// Pre-compute for 128-point window
const HANNING_128 = hanningWindow(128);

/**
 * Spectral Energy Ratio: energy below 5 Hz / total energy.
 * SER ≥ 0.7: SMOOTH road — full scoring penalties
 * SER ≤ 0.3: ROUGH road — penalties reduced 50%
 */
export function computeSER(
  zAccel: Float64Array,
  sampleRate: number = SAMPLE_RATE,
  windowSize: number = 128,
): number {
  if (zAccel.length < windowSize) return 0.5;

  // Remove DC offset
  let mean = 0;
  for (let i = 0; i < windowSize; i++) mean += zAccel[i];
  mean /= windowSize;

  // Apply Hanning window
  const windowed = new Float64Array(windowSize);
  const hann = windowSize === 128 ? HANNING_128 : hanningWindow(windowSize);
  for (let i = 0; i < windowSize; i++) {
    windowed[i] = (zAccel[i] - mean) * hann[i];
  }

  // FFT
  const power = radix2FFT(windowed);
  const freqs = fftFrequencies(windowSize, sampleRate);

  // Partition energy
  let eLow = 0;
  let eTotal = 0;
  for (let i = 0; i < power.length; i++) {
    eTotal += power[i];
    if (freqs[i] <= SER_LOW_FREQ_CUTOFF) {
      eLow += power[i];
    }
  }

  if (eTotal < 1e-10) return 0.5;
  return eLow / eTotal;
}

/** Convert SER to penalty reduction factor (0.5 to 1.0). */
export function serToPenaltyFactor(ser: number): number {
  if (ser >= SER_SMOOTH_THRESHOLD) return 1.0;
  if (ser <= SER_ROUGH_THRESHOLD) return 0.5;
  return 0.5 + 0.5 * (ser - SER_ROUGH_THRESHOLD) / (SER_SMOOTH_THRESHOLD - SER_ROUGH_THRESHOLD);
}

/** Human-readable road quality label. */
export function serToLabel(ser: number): 'SMOOTH' | 'MODERATE' | 'ROUGH' {
  if (ser >= SER_SMOOTH_THRESHOLD) return 'SMOOTH';
  if (ser <= SER_ROUGH_THRESHOLD) return 'ROUGH';
  return 'MODERATE';
}
