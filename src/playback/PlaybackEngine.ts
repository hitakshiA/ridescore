/**
 * PlaybackEngine — runs outside React, owns the requestAnimationFrame loop.
 *
 * Feeds real IMU samples through Madgwick → FFT → SER → Scoring pipeline,
 * writing results to Zustand store. Canvas components read store directly.
 */

import { MadgwickAHRS } from '../engine/madgwick';
import { computeSER, serToPenaltyFactor, serToLabel, radix2FFT, fftFrequencies } from '../engine/fft';
import {
  scoreBraking, scoreAcceleration, scoreCornering,
  scoreSpeed, scoreHazard, computeComposite, emaSmooth,
} from '../engine/scoring';
import { RingBuffer } from '../engine/ring-buffer';
import { SAMPLE_RATE, WAVEFORM_WINDOW_SAMPLES, FFT_WINDOW_SIZE, EMA_INITIAL } from '../engine/constants';
import type { TripData, GroundTruthEvent } from './types';
import { useStore } from '../store';

export class PlaybackEngine {
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private accumulator = 0;
  private sampleIndex = 0;
  private secondCounter = 0; // samples within current second

  // Signal processing
  private madgwick = new MadgwickAHRS();
  private zBuffer = new RingBuffer(FFT_WINDOW_SIZE);

  // Waveform ring buffers
  private wfAccelX = new RingBuffer(WAVEFORM_WINDOW_SAMPLES);
  private wfAccelY = new RingBuffer(WAVEFORM_WINDOW_SAMPLES);
  private wfAccelZ = new RingBuffer(WAVEFORM_WINDOW_SAMPLES);
  private wfGyroX = new RingBuffer(WAVEFORM_WINDOW_SAMPLES);
  private wfGyroY = new RingBuffer(WAVEFORM_WINDOW_SAMPLES);
  private wfGyroZ = new RingBuffer(WAVEFORM_WINDOW_SAMPLES);

  // Per-second accumulators
  private secPeakDecel = 0;
  private secPeakAccel = 0;
  private secPeakLean = 0;
  private secPeakYawRate = 0;
  private secAccelMag = 0;
  private secSampleCount = 0;

  // Score state
  private compositeEma = EMA_INITIAL;

  // Comparison mode (Act 2)
  comparisonMode = false;
  private potholeOverlay: Float64Array | null = null;
  private potholeOffset = 0;

  constructor(
    private data: TripData,
    private groundTruth: GroundTruthEvent[],
  ) {}

  get currentTimeSec(): number {
    return this.sampleIndex / SAMPLE_RATE;
  }

  /** Start or resume playback. */
  start(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = 0;
    this.rafId = requestAnimationFrame(this.tick);
    useStore.getState().setPlayState('playing');
  }

  /** Pause playback. */
  pause(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    useStore.getState().setPlayState('paused');
  }

  /** Seek to a specific second. Re-runs Madgwick from start. */
  seekTo(timeSec: number): void {
    const wasPaused = this.rafId === null;
    this.pause();

    // Reset state
    this.madgwick.reset();
    this.zBuffer.clear();
    this.wfAccelX.clear(); this.wfAccelY.clear(); this.wfAccelZ.clear();
    this.wfGyroX.clear(); this.wfGyroY.clear(); this.wfGyroZ.clear();
    this.compositeEma = EMA_INITIAL;
    this.secPeakDecel = 0; this.secPeakAccel = 0;
    this.secPeakLean = 0; this.secPeakYawRate = 0;
    this.secAccelMag = 0; this.secSampleCount = 0;
    this.secondCounter = 0;
    this.accumulator = 0;

    useStore.setState({
      eventLog: [],
      groundTruthDetected: 0,
      framesProcessed: 0,
    });

    // Fast-forward: run Madgwick on all samples up to target
    const targetIdx = Math.min(Math.floor(timeSec * SAMPLE_RATE), this.data.samples - 1);
    for (let i = 0; i <= targetIdx; i++) {
      this.processOneSample(i, true); // silent = true (don't update store)
    }

    this.sampleIndex = targetIdx + 1;

    // Update store with current state
    this.flushToStore();

    if (!wasPaused) this.start();
  }

  /** Set pothole overlay data for Act 2 comparison. */
  setPotholeOverlay(data: number[] | null): void {
    this.potholeOverlay = data ? new Float64Array(data) : null;
    this.potholeOffset = 0;
  }

  /** Destroy engine. */
  destroy(): void {
    this.pause();
  }

  // ── Core loop ───────────────────────────────────────────────────────────

  private tick = (timestamp: number): void => {
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    const speed = useStore.getState().playbackSpeed;
    const dtMs = (timestamp - this.lastTimestamp) * speed;
    this.lastTimestamp = timestamp;
    this.accumulator += dtMs;

    const sampleIntervalMs = 1000 / SAMPLE_RATE; // 20ms
    const t0 = performance.now();
    let samplesThisFrame = 0;

    while (this.accumulator >= sampleIntervalMs && this.sampleIndex < this.data.samples) {
      this.processOneSample(this.sampleIndex, false);
      this.sampleIndex++;
      this.accumulator -= sampleIntervalMs;
      samplesThisFrame++;

      // Cap at 200 samples per frame to prevent lockup at high speeds
      if (samplesThisFrame > 200) {
        this.accumulator = 0;
        break;
      }
    }

    const processingTimeUs = (performance.now() - t0) * 1000;

    if (samplesThisFrame > 0) {
      this.flushToStore(processingTimeUs, samplesThisFrame);
    }

    if (this.sampleIndex >= this.data.samples) {
      this.pause();
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  // ── Per-sample processing ─────────────────────────────────────────────

  private processOneSample(idx: number, silent: boolean): void {
    const ax = this.data.accel.x[idx];
    const ay = this.data.accel.y[idx];
    let az = this.data.accel.z[idx];
    const gx = this.data.gyro.x[idx];
    const gy = this.data.gyro.y[idx];
    const gz = this.data.gyro.z[idx];

    // Act 2: overlay pothole noise on Z-axis
    let azWithPothole = az;
    if (this.comparisonMode && this.potholeOverlay) {
      const pIdx = this.potholeOffset % this.potholeOverlay.length;
      azWithPothole = az + this.potholeOverlay[pIdx];
      this.potholeOffset++;
    }

    // Madgwick filter
    this.madgwick.update(gx, gy, gz, ax, ay, this.comparisonMode ? azWithPothole : az);
    const euler = this.madgwick.getEuler();

    // Push to waveform buffers
    this.wfAccelX.push(ax);
    this.wfAccelY.push(ay);
    this.wfAccelZ.push(this.comparisonMode ? azWithPothole : az);
    this.wfGyroX.push(gx);
    this.wfGyroY.push(gy);
    this.wfGyroZ.push(gz);

    // Push to FFT buffer
    this.zBuffer.push(this.comparisonMode ? azWithPothole : az);

    // Accumulate per-second features
    this.secPeakDecel = Math.min(this.secPeakDecel, ay); // most negative Y
    this.secPeakAccel = Math.max(this.secPeakAccel, ay); // most positive Y
    if (Math.abs(euler.roll) > Math.abs(this.secPeakLean)) {
      this.secPeakLean = euler.roll;
    }
    this.secPeakYawRate = Math.max(this.secPeakYawRate, Math.abs(gz));

    const rmsAx = Math.abs(ax);
    const rmsAy = Math.abs(ay);
    this.secAccelMag += Math.sqrt(rmsAx * rmsAx + rmsAy * rmsAy);
    this.secSampleCount++;
    this.secondCounter++;

    // Every 50 samples = 1 second: compute scores
    if (this.secondCounter >= SAMPLE_RATE) {
      this.computeSecondScores(silent);
      this.secondCounter = 0;
    }
  }

  private computeSecondScores(silent: boolean): void {
    const timeSec = Math.floor(this.sampleIndex / SAMPLE_RATE);

    // SER
    const zArr = this.zBuffer.toArray();
    const ser = computeSER(zArr, SAMPLE_RATE, FFT_WINDOW_SIZE);
    const penaltyFactor = serToPenaltyFactor(ser);

    // Sub-scores
    const brakingResult = scoreBraking(this.secPeakDecel, penaltyFactor);
    const accelResult = scoreAcceleration(this.secPeakAccel, penaltyFactor);
    const corneringResult = scoreCornering(this.secPeakLean, penaltyFactor);
    const avgAccelMag = this.secSampleCount > 0 ? this.secAccelMag / this.secSampleCount : 0;
    const sSpeed = scoreSpeed(avgAccelMag, penaltyFactor);
    const sHazard = scoreHazard(this.secPeakYawRate, penaltyFactor);
    const sContext = 80;

    const sub = {
      speed: sSpeed,
      braking: brakingResult.score,
      cornering: corneringResult.score,
      acceleration: accelResult.score,
      context: sContext,
      hazard: sHazard,
    };

    const composite = computeComposite(sub);
    this.compositeEma = emaSmooth(composite, this.compositeEma);

    // Naive composite (no road adjustment)
    const brakingNaive = scoreBraking(this.secPeakDecel, 1);
    const accelNaive = scoreAcceleration(this.secPeakAccel, 1);
    const corneringNaive = scoreCornering(this.secPeakLean, 1);
    const sSpeedNaive = scoreSpeed(avgAccelMag, 1);
    const sHazardNaive = scoreHazard(this.secPeakYawRate, 1);
    const naiveComposite = computeComposite({
      speed: sSpeedNaive, braking: brakingNaive.score,
      cornering: corneringNaive.score, acceleration: accelNaive.score,
      context: sContext, hazard: sHazardNaive,
    });

    // Check ground truth
    if (!silent) {
      const events = [brakingResult.event, accelResult.event, corneringResult.event]
        .filter((e): e is NonNullable<typeof e> => e !== null);

      const matchingGT = this.groundTruth.filter(
        gt => gt.start <= timeSec + 1 && gt.end >= timeSec
      );

      for (const ev of events) {
        const isGT = matchingGT.length > 0;
        useStore.getState().addEvent({
          time: timeSec,
          type: ev.type,
          value: ev.value,
          isGroundTruth: isGT,
        });
        if (isGT) {
          useStore.setState(s => ({ groundTruthDetected: s.groundTruthDetected + 1 }));
        }
      }
    }

    // FFT bins for visualization
    if (!silent && this.zBuffer.isFull) {
      const windowed = new Float64Array(FFT_WINDOW_SIZE);
      const arr = this.zBuffer.toArray();
      let mean = 0;
      for (let i = 0; i < FFT_WINDOW_SIZE; i++) mean += arr[i];
      mean /= FFT_WINDOW_SIZE;
      for (let i = 0; i < FFT_WINDOW_SIZE; i++) {
        windowed[i] = (arr[i] - mean) * (0.5 * (1 - Math.cos(2 * Math.PI * i / (FFT_WINDOW_SIZE - 1))));
      }
      const power = radix2FFT(windowed);
      const freqs = fftFrequencies(FFT_WINDOW_SIZE, SAMPLE_RATE);
      useStore.setState({
        fftBins: Array.from(power.slice(0, 32)),
        fftFreqs: Array.from(freqs.slice(0, 32)),
      });
    }

    if (!silent) {
      useStore.setState({
        scores: {
          ...sub,
          composite,
          compositeEma: this.compositeEma,
        },
        naiveComposite,
        ser,
        roadQuality: serToLabel(ser),
        penaltyFactor,
      });
    }

    // Reset accumulators
    this.secPeakDecel = 0;
    this.secPeakAccel = 0;
    this.secPeakLean = 0;
    this.secPeakYawRate = 0;
    this.secAccelMag = 0;
    this.secSampleCount = 0;
  }

  private flushToStore(processingTimeUs?: number, samplesThisFrame?: number): void {
    const euler = this.madgwick.getEuler();

    const update: Partial<DashboardStore> = {
      currentTime: this.sampleIndex / SAMPLE_RATE,
      orientation: euler,
      waveformData: {
        accelX: Array.from(this.wfAccelX.last(WAVEFORM_WINDOW_SAMPLES)),
        accelY: Array.from(this.wfAccelY.last(WAVEFORM_WINDOW_SAMPLES)),
        accelZ: Array.from(this.wfAccelZ.last(WAVEFORM_WINDOW_SAMPLES)),
        gyroX: Array.from(this.wfGyroX.last(WAVEFORM_WINDOW_SAMPLES)),
        gyroY: Array.from(this.wfGyroY.last(WAVEFORM_WINDOW_SAMPLES)),
        gyroZ: Array.from(this.wfGyroZ.last(WAVEFORM_WINDOW_SAMPLES)),
      },
    };

    if (processingTimeUs !== undefined) {
      update.processingTimeUs = processingTimeUs;
    }
    if (samplesThisFrame !== undefined) {
      update.framesProcessed = (useStore.getState().framesProcessed || 0) + samplesThisFrame;
    }

    useStore.setState(update as any);
  }
}

// Need to import the type for flushToStore
type DashboardStore = import('../store').DashboardStore;
