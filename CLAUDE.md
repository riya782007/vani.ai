# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (PWA disabled in dev)
npm run build    # Production build (generates SW + workbox files)
npm run start    # Start production server
npx tsc --noEmit # Type-check without emitting
```

## Architecture

### 5-View State Machine (`app/page.tsx`)
Single-file client component managing all UI state via a `view: 0|1|2|3|4` integer:
- **0** Auth Gate → **1** Mission Intake (company/role) → **2** Calibration (mic permission + terminal animation) → **3** Live Room → **4** Paywall Dashboard

View 2 is the critical gatekeeper: `navigator.mediaDevices.getUserMedia({ audio: true })` must resolve before advancing to View 3. The `MediaStream` is threaded as a prop into `LiveRoomView`.

### Live Room audio pipeline (`View 3`)
1. `MediaRecorder` captures mic → `audioChunks[]` blob  
2. `POST /api/chat` (FormData: audio blob + history JSON + company/role)  
3. Server: Gemini 1.5 Flash transcribes audio → generates HR response → ElevenLabs Turbo TTS streams back MP3  
4. Response headers carry `X-Transcript` and `X-AI-Response` (URL-encoded)  
5. Client plays MP3 via `new Audio(url)`, then re-arms `MediaRecorder` on `onended`  
6. Barge-in: tapping the visualizer calls `stopAI()` + immediately re-arms recorder

### API Routes
| Route | Purpose |
|---|---|
| `POST /api/research` | Tavily search for real interview questions + company culture |
| `POST /api/chat` | Audio → Gemini transcription → Gemini response → ElevenLabs TTS → MP3 |
| `POST /api/score` | Transcript → Gemini structured JSON (score, radar breakdown, heatmap) |
| `POST /api/razorpay` | Create ₹49 Razorpay order (4900 paise) |
| `POST /api/webhook` | Verify Razorpay signature → increment Supabase `users.credits` |

### PWA
`next.config.mjs` wraps with `@ducanh2912/next-pwa`. SW is disabled in dev. Build generates `public/sw.js` and workbox chunks — these are git-ignored.

### Environment variables
All secret keys are server-only (no `NEXT_PUBLIC_` prefix) except `NEXT_PUBLIC_RAZORPAY_KEY_ID`, which is needed by the Razorpay browser SDK loaded via `<script>` in the paywall view.

### Supabase schema (must create manually)
```sql
create table users (id uuid primary key default gen_random_uuid(), email text unique, credits int default 0);
create table transactions (id uuid primary key default gen_random_uuid(), payment_id text unique, user_id uuid references users(id), amount int, credits int, order_id text, created_at timestamptz default now());
```

### Design system
Background `#09090B`, surface `#111113`, border `#27272A`, muted text `#71717A`. `font-mono` for all scores/metrics/WPM. No Tailwind config file — uses Tailwind v4 via `@tailwindcss/postcss` with `@theme inline` in `globals.css`.
