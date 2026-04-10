# RideScore Demo Script — 90 Second Technical Walkthrough

**Recording setup:** Screen Studio, Chrome fullscreen on `https://imu-ridescore.vercel.app`
**Resolution:** 1920×1080, 60 FPS
**Voice:** Confident, technical, fast-paced — you're presenting to Varroc SMEs, not explaining to beginners

---

## Pre-Recording Checklist

1. Open `https://imu-ridescore.vercel.app` in Chrome
2. Make sure the play overlay ("Start Ride Replay") is visible
3. Open a second tab with the GitHub repo: `https://github.com/hitakshiA/ridescore`
4. Open a third tab with the raw dataset: `https://github.com/jair-jr/driverBehaviorDataset`
5. Have Screen Studio ready, cursor highlight ON

---

## THE SCRIPT

### [0:00–0:08] — HOOK + Context (Play overlay visible)

**On screen:** The dashboard with blurred play overlay. Pause here for a beat.

**Say:**
> "This is RideScore — a real-time driving behavior scoring system for two-wheelers. Everything you're about to see is computed live in the browser from real IMU sensor data. No pre-baked animations, no faked numbers. The same math runs in 1.2 milliseconds on a Cortex-M4."

**Action:** Click "Start Ride Replay"

---

### [0:08–0:30] — ACT 1: Live Signal Processing (Ride Replay tab)

**On screen:** Dashboard is now live. Waveforms scrolling, bike leaning, scores updating.

**Say:**
> "We're processing 50 Hz accelerometer and gyroscope data from a peer-reviewed dataset — Souza et al., CC BY 4.0. Twenty thousand samples, four hundred and five seconds of real riding."

**Action:** Point cursor at the accelerometer waveform

> "The raw 3-axis acceleration goes through a Madgwick AHRS filter — quaternion-based orientation fusion with a single tunable parameter, beta equals 0.033. Published accuracy: 0.59 degrees RMSE for roll estimation."

**Action:** Point at the motorcycle lean visualization on the left

> "That gives us the lean angle in real-time. Watch — when the rider corners, the motorcycle tilts."

**Action:** Point at the ride score (86, or whatever it shows)

> "The composite score is crash-weighted from MoRTH 2023 data. Speed behavior carries 35% weight because 68% of Indian two-wheeler fatalities are from overspeeding."

**Action:** Wait for an event to appear in the event feed (should happen around t=16-26s). Point at it.

> "There — emergency brake detected at 0.74g. That matches the ground truth label from the dataset. We're hitting 5 out of 14 labeled events and counting."

---

### [0:30–0:45] — Show Technical Panels

**Action:** Click "Expand" on the Gyroscope/FFT/Road Separation section

**Say:**
> "Here's where it gets interesting for Indian roads."

**Action:** Point at the FFT spectrum

> "This is a 128-point FFT on the Z-axis acceleration. Blue bars are rider dynamics below 5 hertz. Red bars are road surface vibration above 5 hertz. The Spectral Energy Ratio — SER — tells us the road condition in real-time."

**Action:** Point at the SER value and road quality indicator

> "SER of 0.8 means smooth road, full scoring penalties apply. When this drops below 0.3 on a pothole-heavy road, we reduce penalties by up to 50%. That's the key innovation — without this, every Indian rider on a village road scores dangerous."

---

### [0:45–1:05] — ACT 2: Road Quality Explainer

**Action:** Click "Road Quality" tab

**Say:**
> "Let me show you why this matters."

**Action:** Point at the left panel (potholes)

> "Left side: real pothole data from the González 2017 road anomaly dataset. A pothole produces a Z-axis spike of 0.3 to 0.6g — identical signature to a hard braking event. Any naive scoring system penalizes the rider for hitting a pothole."

**Action:** Point at the right panel (smooth road)

> "Right side: smooth road data from the same dataset. Flat line, minimal variation. The FFT energy distribution is completely different."

**Action:** Point at the SER bar at the bottom

> "Our SER algorithm separates these two cases. When road energy dominates, the penalty factor drops. Same rider behavior, fair score."

---

### [1:05–1:25] — ACT 3: Production Viability

**Action:** Click "For OEMs" tab

**Say:**
> "Now here's why this matters for Varroc."

**Action:** Point at the production deployment column on the right

> "The entire pipeline — Madgwick filter, FFT, scoring engine — fits in 15 kilobytes of Flash and 4 kilobytes of RAM. That runs on your existing instrument cluster MCU. Tier 1 deployment: zero additional BOM. Just a firmware update."

**Action:** Drag a weight slider (e.g., change Speed from 0.35 to 0.25)

> "The scoring formula is tunable. OEMs can calibrate per vehicle model. Drag the speed weight down, watch the composite recalculate live."

**Action:** Reset to defaults

**Action:** Point at the BOM section

> "Tier 2 adds a BMI270 IMU for 300 rupees — full lean angle estimation. Tier 3 leverages Varroc Connect for cloud sync and insurance API integration. The total addressable market: 260 million Indian two-wheelers, zero dedicated scoring solutions today."

---

### [1:25–1:35] — Source Code + Credibility

**Action:** Switch to the GitHub tab: `https://github.com/hitakshiA/ridescore`

**Say:**
> "Everything is open source. The signal processing engine is pure TypeScript — no server, no cloud dependency, no ML black box. The Madgwick filter is 80 lines. The FFT is 50 lines. Every constant traces to a datasheet or published paper."

**Action:** Briefly scroll through the README

> "Real data, real math, production-ready architecture."

---

### [1:35–1:45] — Close

**Action:** Switch back to the dashboard, click "Ride Replay", let it play

**Say:**
> "RideScore. Edge-first behavior scoring for Indian two-wheelers. Built for Varroc's existing hardware. Ready for 260 million riders."

**Action:** Let the dashboard animate for 2-3 seconds. End recording.

---

## Key Links to Show

| What | URL |
|------|-----|
| Live demo | `https://imu-ridescore.vercel.app` |
| Source code | `https://github.com/hitakshiA/ridescore` |
| IMU dataset | `https://github.com/jair-jr/driverBehaviorDataset` |
| Road anomaly data | `https://www.accelerometer.xyz` |
| MoRTH 2023 report | `https://morth.nic.in` |

## Tips for Recording

- **Speed:** Set playback to 3× so events happen fast enough to be dramatic in 90 seconds
- **Cursor:** Use Screen Studio's cursor spotlight — point deliberately at what you're talking about
- **Timing:** Don't rush the hook (first 8 seconds). Let the play overlay sit for a beat before clicking.
- **Events:** The aggressive braking cluster at t=16-26s is your money shot. Make sure you're talking about signal processing when it hits.
- **Score drops:** With EMA alpha at 0.5, the score drops visibly (86→78) during the braking cluster. Call it out.
- **Transitions:** Click tabs cleanly, don't hover. Each tab switch should feel intentional.
- **End strong:** The last thing the viewer sees should be the live dashboard with data flowing. Not a static slide.
