/**
 * Build-time data preparation script.
 * Converts raw CSV sensor data to optimized JSON for browser consumption.
 *
 * Run: npx tsx scripts/prepare-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../../');
const OUT = path.resolve(__dirname, '../public/data');

// ── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSV(filePath: string): Record<string, string[]>[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const row: Record<string, string[]> = {};
    headers.forEach((h, i) => { (row as any)[h] = vals[i]; });
    return row;
  });
}

// ── Resample to uniform 50 Hz ───────────────────────────────────────────────

function resampleUniform(
  uptimeNanos: number[],
  values: { x: number[]; y: number[]; z: number[] },
  targetRate: number = 50
) {
  const t0 = uptimeNanos[0];
  const times = uptimeNanos.map(t => (t - t0) / 1e9); // seconds
  const totalTime = times[times.length - 1];
  const nSamples = Math.floor(totalTime * targetRate);
  const tUniform = Array.from({ length: nSamples }, (_, i) => (i / targetRate));

  function interp(tTarget: number[], tSource: number[], vSource: number[]): number[] {
    const result: number[] = [];
    let j = 0;
    for (const t of tTarget) {
      while (j < tSource.length - 2 && tSource[j + 1] < t) j++;
      const t0 = tSource[j], t1 = tSource[j + 1];
      const v0 = vSource[j], v1 = vSource[j + 1];
      const frac = t1 !== t0 ? (t - t0) / (t1 - t0) : 0;
      result.push(v0 + frac * (v1 - v0));
    }
    return result;
  }

  return {
    time: tUniform,
    x: interp(tUniform, times, values.x),
    y: interp(tUniform, times, values.y),
    z: interp(tUniform, times, values.z),
  };
}

// ── Round to reduce JSON size ───────────────────────────────────────────────

function round(arr: number[], decimals: number = 4): number[] {
  const factor = Math.pow(10, decimals);
  return arr.map(v => Math.round(v * factor) / factor);
}

// ── Process Trip 17 ─────────────────────────────────────────────────────────

console.log('Processing Trip 17...');
const tripPath = path.join(ROOT, 'driverBehaviorDataset/data/17');

const accelRaw = parseCSV(path.join(tripPath, 'acelerometro_terra.csv'));
const gyroRaw = parseCSV(path.join(tripPath, 'giroscopio_terra.csv'));

const accelUptimes = accelRaw.map(r => Number((r as any).uptimeNanos));
const accelVals = {
  x: accelRaw.map(r => Number((r as any).x)),
  y: accelRaw.map(r => Number((r as any).y)),
  z: accelRaw.map(r => Number((r as any).z)),
};

const gyroUptimes = gyroRaw.map(r => Number((r as any).uptimeNanos));
const gyroVals = {
  x: gyroRaw.map(r => Number((r as any).x)),
  y: gyroRaw.map(r => Number((r as any).y)),
  z: gyroRaw.map(r => Number((r as any).z)),
};

const accelResampled = resampleUniform(accelUptimes, accelVals, 50);
const gyroResampled = resampleUniform(gyroUptimes, gyroVals, 50);

// Ground truth
const gtRaw = parseCSV(path.join(tripPath, 'groundTruth.csv'));
const groundTruth = gtRaw.map(r => ({
  event: String((r as any).evento).trim(),
  start: Number((r as any)[' inicio'] || (r as any).inicio),
  end: Number((r as any)[' fim'] || (r as any).fim),
}));

const trip17 = {
  sampleRate: 50,
  duration: Math.floor(accelResampled.time[accelResampled.time.length - 1]),
  samples: accelResampled.time.length,
  accel: {
    x: round(accelResampled.x),
    y: round(accelResampled.y),
    z: round(accelResampled.z),
  },
  gyro: {
    x: round(gyroResampled.x, 6),
    y: round(gyroResampled.y, 6),
    z: round(gyroResampled.z, 6),
  },
  groundTruth,
};

fs.writeFileSync(path.join(OUT, 'trip17.json'), JSON.stringify(trip17));
console.log(`  → trip17.json: ${trip17.samples} samples, ${trip17.duration}s, ${groundTruth.length} events`);
console.log(`  → Size: ${(fs.statSync(path.join(OUT, 'trip17.json')).size / 1024).toFixed(0)} KB`);

// ── Road anomaly samples ────────────────────────────────────────────────────

console.log('\nProcessing road anomaly samples...');
const roadPath = path.join(ROOT, 'data');

function loadRoadSamples(category: string, count: number = 5): number[][] {
  const catPath = path.join(roadPath, category);
  const files = fs.readdirSync(catPath).filter(f => f.endsWith('.csv')).slice(0, count);
  return files.map(fname => {
    const raw = fs.readFileSync(path.join(catPath, fname), 'utf-8');
    const lines = raw.trim().split('\n').slice(1); // skip header
    return lines.map(l => Math.round(Number(l.trim()) * 1000) / 1000);
  });
}

const roadSamples = {
  potholes: loadRoadSamples('potholes', 10),
  regular: loadRoadSamples('regular_road', 5),
  asphaltBumps: loadRoadSamples('asphalt_bumps', 5),
  metalBumps: loadRoadSamples('metal_bumps', 5),
  wornOut: loadRoadSamples('worn_out_road', 5),
};

fs.writeFileSync(path.join(OUT, 'road_samples.json'), JSON.stringify(roadSamples));
console.log(`  → road_samples.json: ${Object.values(roadSamples).flat().length} samples`);

// ── Copy scored timeline for validation ─────────────────────────────────────

console.log('\nCopying scored_timeline.json...');
fs.copyFileSync(
  path.join(ROOT, 'scored_timeline.json'),
  path.join(OUT, 'scored_timeline.json')
);
console.log('  → scored_timeline.json copied');

console.log('\nDone! Data files ready in public/data/');
