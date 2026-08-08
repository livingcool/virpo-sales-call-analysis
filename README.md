# 🎙️ Sales Call Analysis — AI-Powered Tamil/Tanglish Coach

> Real-time sales call evaluation using **Sarvam AI (Tamil STT)**, **Gemini 2.5 Flash**, and a custom rubric engine — built for inside-sales teams in India.

[![CI](https://github.com/YOUR_USERNAME/sales-call-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/sales-call-assistant/actions/workflows/ci.yml)
[![Supabase Keep-Alive](https://github.com/YOUR_USERNAME/sales-call-assistant/actions/workflows/supabase-keepalive.yml/badge.svg)](https://github.com/YOUR_USERNAME/sales-call-assistant/actions/workflows/supabase-keepalive.yml)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Tamil STT** | Sarvam AI diarized speech-to-text for Tamil / Tanglish code-switched audio |
| 🧠 **Gemini Scoring** | Gemini 2.5 Flash evaluates 6 rubric categories with supporting evidence |
| 📊 **Deep Dive Charts** | Strongest & Weakest competency bars with verbatim call quotes |
| 🔴 **Coaching Flags** | Prioritized negative findings with Tamil rephrasing suggestions |
| 💾 **Supabase DB** | Persistent call records, analyses, and per-score reasoning |
| 🔒 **Encrypted Secrets** | `.env.enc` committed (AES-256-CBC); `.env.local` never committed |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/sales-call-assistant.git
cd sales-call-assistant
npm ci
```

### 2. Decrypt and set up secrets
```powershell
# Decrypt .env.enc → .env.local (ask team lead for the password)
powershell -ExecutionPolicy Bypass -File scripts/decrypt-env.ps1
```
Or copy the template and fill in your own keys:
```bash
cp .env.example .env.local
```

### 3. Run locally
```bash
npm run dev
# → http://localhost:3000
```

---

## 🔐 Secret Management

| File | Committed? | Purpose |
|---|---|---|
| `.env.local` | ❌ Never | Live secrets (git-ignored) |
| `.env.enc` | ✅ Yes | AES-256-CBC encrypted backup |
| `.env.example` | ✅ Yes | Template for new devs |

**Encrypt / Re-encrypt after changing secrets:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/encrypt-env.ps1
git add .env.enc && git commit -m "chore: rotate encrypted secrets"
```

---

## 🏗️ Architecture

```
Audio Upload (.mp3/.wav/.m4a)
      ↓
Sarvam AI STT  →  Diarized Transcript (Agent / Customer)
      ↓
Gemini 2.5 Flash  →  Rubric Scoring + Sub-score Reasons + Weak Areas
      ↓
Supabase (Postgres)  →  calls / analyses / insights / transcripts
      ↓
Next.js Dashboard  →  Deep Dive / Triage / Settings
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 App Router, Tailwind CSS, Recharts, Lucide
- **AI**: Google Gemini 2.5 Flash, Sarvam AI Diarization STT
- **Database**: Supabase (Postgres)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions (lint + type check + Supabase keep-alive)

---

## 📦 Deploy to Vercel

1. Import the repo in [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.example` in Vercel project settings
3. Click **Deploy** — Vercel auto-deploys on every push to `main`

---

## ⚙️ GitHub Actions

| Workflow | Schedule | Purpose |
|---|---|---|
| `ci.yml` | On every push/PR | ESLint + TypeScript + Build |
| `supabase-keepalive.yml` | Every 3 days | Pings Supabase so project never pauses |

> **Required GitHub Secrets** (set in repo Settings → Secrets):
> - `NEXT_PUBLIC_SUPABASE_URL`
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
> - `SUPABASE_SERVICE_ROLE_KEY`
> - `SARVAM_API_KEY`
> - `GEMINI_API_KEY`

---

## 📄 License

Private — Virpo Internal Use Only.
