# 🧪 The Growth Lab — Learn. Think. Create. Grow.

> **A personal learning, strategic thinking, and creative development platform for Charu Bansal (MBA Product Management).**  
> *Personal growth first. Academic management second.*

---

## 🌟 What is The Growth Lab?

**The Growth Lab** is a high-energy personal development platform built for an MBA Product Management student who wants to develop elite confidence in branding, marketing strategy, communication clarity, analytical problem solving, and professional presence.

Rather than feeling like a rigid corporate Learning Management System, The Growth Lab functions as an **interactive creative studio**:
- **Bold Pop Academy Aesthetic**: High-energy Behance-inspired composition with an electric cobalt blue (`#2563EB`) primary visual identity, crisp slate canvas, and controlled canary/citron and emerald accents.
- **Voice-First Experience**: Designed for users who prefer speaking over typing, with instant speech-to-text dictation and conversational AI.
- **Real ChatGPT-Style Conversational AI**: Genuine OpenAI API integration (`gpt-4o-mini` / `gpt-4o`) via a secure backend proxy. Open-ended, natural conversations that accept single letters, incomplete thoughts, casual questions, and deep business discussions without forced scoring.
- **Persistent Server-Side SQLite Database**: Powered by Node.js 26 built-in `node:sqlite` (`data/growth_lab.db`), ensuring conversations, ideas, notes, and academic trackers are reliably saved across devices and sessions.

---

## 🚀 Core Upgrades & Architecture

### 1. Real ChatGPT-Style AI (`/api/chat`)
- **Natural, Open-Ended Assistant**: Behaves like ChatGPT. Chat freely on any topic—business, marketing, technology, daily routines, or casual reflections.
- **Zero Gatekeeping**: Accepts single letters (e.g. `"k"`), incomplete thoughts, and fragments without validation errors or forced exercises.
- **No Unsolicited Grading**: Does NOT force every message into an evaluation or assign arbitrary scores. Constructive communication feedback is generated **only** when the user explicitly requests it.
- **6 Contextual Modes** powered by genuine OpenAI models:
  1. **General Chat**: Natural open-ended ChatGPT conversations.
  2. **Study Assistant**: Demystifies PM2, Microeconomics, and MRM concepts using Indian market analogies (e.g. Jio, Zomato, Amul).
  3. **Communication Partner**: Spoken conversational dialogue partner.
  4. **Thought Builder**: Structures raw brain-dumps into Point-Reason-Example (P-R-E) or Problem-Analysis-Solution (P-A-S).
  5. **Brand Coach**: Discusses brand positioning, pricing power, and consumer psychology.
  6. **LinkedIn Assistant**: Crafts human, authentic post drafts free of corporate buzzwords.
- **Backend Key Security**: OpenAI API keys are stored server-side in `.env` and never exposed to the client browser.

### 2. Voice-First Communication Studio
- **Prominent Microphone Hero**: High-energy mic button with pulsing animation and live frequency waveform visualizer (Web Audio API `AnalyserNode`).
- **Live Speech-to-Text Transcription**: Words appear beneath the microphone in real time as you speak.
- **Dual Speech Engine**: Browser Web Speech API for zero-latency live streaming + OpenAI Whisper API (`whisper-1` via `/api/transcribe`) for audio fidelity.
- **Editable Transcript**: Polish, edit, or add words before sending.
- **Send to AI Speaking Partner**: One-click action appends the spoken thought to the ongoing persistent dialogue thread and generates a conversational ChatGPT response.
- **Optional Constructive Feedback**: On-demand analysis of sentence clarity, opening structure, concrete examples, conciseness, and a polished rewrite in your natural voice.
- **Topic Prompts Drawer**: Impromptu, Presentation, Interview, Storytelling, and P-R-E Practice presets.

### 3. Pop Art × Living Scrapbook Visual Identity
- **Electric Cobalt Primary**: Saturated cobalt/royal blue (`#2563EB`) as the signature anchor color, balanced with Canary Yellow, Bubblegum Pink, Cyan, and Lime accents.
- **Living Scrapbook Elements**: Layered index cards, tactile washi tape strips (6 colorways), brass paperclips, pushpins, rubber ink certification stamps (`COMPLETED ★`, `SUBMITTED ★`, `READ ★`), and notebook spiral binder rings.
- **Clean Reading & Practice Surfaces**: Distraction-free lined notebook paper for lecture notes and high-contrast practice cards with pop shadows.
- **Strict Design Standards**: No AI-generated human illustrations, faces, mascots, cartoon characters, washed-out pastels, or purple saturation.

### 4. Live Learning Library & Automated 24h Updates
- **Live Knowledge Feeds**: Connected to legitimate public feeds from **Think School** (YouTube Atom XML & v3 API), **Marketing Week RSS**, **Seth Godin RSS**, **Lenny's Newsletter RSS**, and **The Branding Journal** case studies.
- **Automated 24-Hour Scheduler**: Background daemon updates resources every 24 hours, with an on-demand manual **Refresh Discoveries** button in the UI.
- **Fresh Discoveries Shelf**: Highlights newly published content and displays actual verified update times.
- **8 Interactive Card Actions**: Every card supports *Open Source* (`target="_blank"`), *Watch Video*, *Bookmark*, *Mark Done*, *Personal Notes* (auto-saved), *Send to Idea Canvas*, *Use in Brand Lab*, and *Draft LinkedIn Post*.

### 5. Animated Companions: Mochi & Piko
- **Mochi**: Fluffy white spherical plush creature with pink inner ears, expressive glossy eyes, rosy blush, and stubby paws. Waddles into view, blinks, waves a paw on hover, and celebrates with joyful jumps when practice activities are completed.
- **Piko**: Smooth marshmallow teardrop gumdrop creature with a velvety white finish and ambient cobalt blue shadow. Peeks from behind scrapbook cards, shyly ducks down when Mochi approaches, and celebrates when notes are saved.
- **Interactive Coordinated Diorama**: Plays the coordinated **Peekaboo** interaction on the Homepage.
- **Full Accessibility**: Global companion toggle (`🐾 Mochi & Piko: Active / Resting`) and complete support for `@media (prefers-reduced-motion: reduce)`.

### 6. Persistent SQLite Architecture (`data/growth_lab.db`)
- Powered by Node.js 26 `node:sqlite` (`DatabaseSync`) with zero external native npm dependencies.
- **Tables**:
  - `conversations`: Conversation sessions and active modes.
  - `messages`: Persistent message thread with role, content, and optional audio recordings.
  - `learning_resources`: Ingested live resources, bookmarks, completion statuses, and user notes.
  - `learning_meta`: Ingestion timestamps and telemetry.
  - `user_state`: Two-way synchronization key-value store for profile, planner tasks, idea cards, and lecture notes.
- **Tables**:
  - `conversations`: Conversation sessions and active modes.
  - `messages`: Persistent message thread with role, content, and optional audio recordings.
  - `user_state`: Two-way synchronization key-value store for profile, planner tasks, idea cards, and lecture notes.

---

## 🏛️ The 5 Navigation Areas

1. **Home**: Daily personal dashboard with 5-second clarity, today's recommended inquiry, 5-minute quick win toggle, 20-minute workout preview, and upcoming Term II deadlines.
2. **Skill Studio**:
   - **Voice Studio**: Primary speech-to-text microphone interface and persistent ChatGPT speaking partner.
   - **Thought Builder**: Frameworks (P-R-E, P-A-S, S-A-R, C-E-C) for organizing raw thoughts.
   - **Brand Lab**: Step-by-step deconstruction of Indian & global brands with Socratic Devil's Advocate.
   - **6 Career Tracks**: Brand Strategy, Consumer Understanding, Business Knowledge, Analytical Thinking, Communication, and Execution.
3. **Explore**: Curated video/article library (Ritson, Think School, HBR), Idea Canvas concept board, and the 5-step Learning-to-LinkedIn post generator.
4. **MBA Hub**: Term II subjects (PM2, Microeconomics, MRM), downloadable original lecture slides, on-demand AI concept explainer, quiz generator, and document upload hub.
5. **My Growth**: Weekly growth reviews, streak tracker, completed drill history, and target role gap analysis.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti
- **Audio & Voice**: Web Audio API (`AudioContext`, `AnalyserNode`), `MediaRecorder`, Web Speech API, OpenAI Whisper (`whisper-1`)
- **Backend**: Node.js 26 HTTP server (`server/index.mjs`)
- **AI Integration**: OpenAI Chat Completions API (`gpt-4o-mini`, `gpt-4o`) & Whisper Audio Transcription API
- **Database**: Node.js 26 built-in `node:sqlite` (`data/growth_lab.db`)
- **Build Tool**: Vite 5

---

## ⚙️ Configuration & Environment

The backend server loads configuration from environment variables or a local `.env` file in the project root:

```env
# OpenAI API Key (Required for ChatGPT and Whisper)
OPENAI_API_KEY=sk-proj-...

# OpenAI Model (Default: gpt-4o-mini, or gpt-4o)
OPENAI_MODEL=gpt-4o-mini

# Server Port (Default: 5050)
PORT=5050
```

> **Note**: You can also configure or update your OpenAI API key directly inside the application UI via the **Settings Modal** (gear icon in the navigation bar) or the inline banner inside the AI Assistant. Keys are saved securely to `.env` on your server.

---

## 🚀 Running Locally

### Development Mode (with Hot Reloading)

Start both the backend server and the Vite dev server:

```bash
# 1. Install dependencies
npm install

# 2. Start the secure backend server (Port 5050)
npm run server

# 3. In a separate terminal, start Vite dev server (Port 5174)
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) in your browser. Vite automatically proxies all `/api` requests to `http://localhost:5050`.

---

## 🚢 Production Deployment

The Growth Lab includes a unified production server in `server/index.mjs` that serves both the compiled React single-page application and all backend API endpoints on a single port.

```bash
# 1. Compile TypeScript and build production assets into dist/
npm run build

# 2. Start the production server
npm start
```

The application will be live at `http://localhost:5050` (or the port specified by `$PORT` on your hosting provider like Render, Railway, Fly.io, or an EC2 instance).

### Deployment Checklist
- [x] Run `npm run build` to generate `/dist`.
- [x] Ensure `data/` directory is writable for SQLite persistence (`growth_lab.db`).
- [x] Set `OPENAI_API_KEY` in your hosting provider's environment variables.
- [x] Start command: `node server/index.mjs` (or `npm start`).
