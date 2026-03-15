# PGIS Breathe — HRV Breathing Coach

*A component of the Performance Glycemic Intelligence System (PGIS)*

A beautiful, evidence-based progressive web app for guided HRV breathing exercises. Designed for Dr. O.'s personal use — optimized for both daytime performance and nighttime recovery.

---

## Evidence-Based Protocols

| Protocol | Phases | BPM | Mode | Key Evidence |
|---|---|---|---|---|
| **Resonance Breathing** | 5s in / 5s out | 6.0 | Day & Night | Chaitanya et al. (2022); Steffen et al. (2017) |
| **Extended Exhale** | 4s in / 8s out | 5.0 | Day & Night | Magnon et al. (2021); Birdee et al. (2023) |
| **4-7-8 Breathing** | 4s in / 7s hold / 8s out | 3.2 | Night | Vierra et al. (2022) |
| **Box Breathing** | 4s in / 4s hold / 4s out / 4s hold | 3.75 | Day | Kasap et al. (2025) |
| **Slow Deep Breathing** | 5s in / 2s pause / 7s out | 4.3 | Day & Night | Laborde et al. (2022) |
| **Sleep Preparation** | 4s in / 4s hold / 8s out | 3.75 | Night | Vierra et al. (2022); Magnon et al. (2021) |

---

## Features

- **Auto Day/Night Mode** — detects time of day and selects appropriate protocols
- **Animated Breathing Orb** — physiological lung volume curve animation
- **Phase Progress Ring** — SVG ring showing current phase progress
- **Real-time Waveform** — live breathing rhythm visualization
- **Audio Cues** — synthesized tones for phase transitions (Web Audio API)
- **Session Tracking** — localStorage persistence with streak counting
- **Evidence Badges** — each protocol card cites the source research
- **Mobile PWA** — installable on iPhone/Android home screen

---

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion / CSS animations
- Web Audio API (synthesized tones)
- localStorage (session history)
- Express.js (static server)
- Vite (build tool)

---

## Local Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

---

## Railway Deployment

### Option 1: Nixpacks (Recommended)

1. Push code to GitHub
2. Create new Railway project → "Deploy from GitHub repo"
3. Railway auto-detects Node.js and uses `nixpacks.toml`
4. Set environment variable: `NODE_ENV=production`
5. Railway assigns a public URL automatically

### Option 2: Docker

1. Railway will auto-detect the `Dockerfile`
2. No additional configuration needed
3. Set `PORT` environment variable if needed (defaults to 3000)

### Environment Variables

| Variable | Value | Required |
|---|---|---|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `3000` | Optional |

### Build Command
```
pnpm install --frozen-lockfile && pnpm run build
```

### Start Command
```
node dist/index.js
```

---

## Install as PWA (iPhone)

1. Open the Railway URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Name it "HRV Breathe"
5. Tap "Add"

The app will launch full-screen from your home screen.

---

## Recommended Daily Practice

| Time | Protocol | Duration |
|---|---|---|
| Morning (6–9 AM) | Resonance Breathing | 20 min |
| Midday reset | Box Breathing | 5 min |
| Pre-workout | Extended Exhale | 10 min |
| Post-workout | Slow Deep Breathing | 15 min |
| Pre-sleep (9–10 PM) | Sleep Preparation | 12 min |
| Bedtime | 4-7-8 Breathing | 8 min |

---

## PGIS Integration

PGIS Breathe is designed as a standalone component of the PGIS ecosystem. HRV data is stored locally in the browser (localStorage) and can be correlated with CGM, HRV, sleep, and training data in the main PGIS system. All personal data remains on-device — no server-side storage.

---

*Built for Dr. Chukwuma Onyeije, MFM Specialist & Physician-Developer*  
*DoctorsWhoCode.blog · Performance Glycemic Intelligence System*
