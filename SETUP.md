# Setup & Deployment Guide

This guide walks you from a blank machine to a fully deployed MedPlatform instance using only free-tier services.

---

## Prerequisites

- Node.js 18+ and Python 3.11+
- A GitHub account
- Free accounts on [Supabase](https://supabase.com), [Render](https://render.com), and [Vercel](https://vercel.com)

---

## Step 1 — Create Your GitHub Repository

```bash
git init
git add .
git commit -m "feat: initial project"
git branch -M main
git remote add origin https://github.com/WellNest-Innovations/medicare.git
git push -u origin main
```

GitHub Actions CI starts running automatically on every push.

---

## Step 2 — Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → **New Project**

   - Name: `medplatform`
   - Region: Singapore or Mumbai (closest free-tier regions to Kenya)
   - Save your database password

2. Open **SQL Editor → New Query**, paste `supabase/migrations/001_schema.sql`, and click **Run**

3. Collect your keys from **Settings → API**:

| Key Name                        | Where to Find It                                                  |
| ------------------------------- | ----------------------------------------------------------------- |
| `SUPABASE_URL`                  | Settings → API → Project URL                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` public key                                |
| `SUPABASE_SERVICE_KEY`          | Settings → API → `service_role` key (**never expose in browser**) |
| `SUPABASE_JWT_SECRET`           | Settings → JWT Settings → JWT Secret                              |

---

## Step 3 — Deploy the Backend (Render)

1. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo

2. Fill in:

   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

3. Add environment variables:

| Key                    | Value                              |
| ---------------------- | ---------------------------------- |
| `SUPABASE_URL`         | your Supabase project URL          |
| `SUPABASE_SERVICE_KEY` | your service_role key              |
| `SUPABASE_JWT_SECRET`  | your JWT secret                    |
| `APP_ENV`              | `production`                       |
| `ALLOWED_ORIGINS`      | your Vercel URL (add after Step 4) |

4. Click **Create Web Service** — wait ~3 minutes, then verify:
   ```
   GET https://medplatform-api.onrender.com/health
   → {"status":"ok","service":"medplatform-api"}
   ```

---

## Step 4 — Deploy the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variables:

| Key                             | Value                                  |
| ------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | your Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key                          |
| `NEXT_PUBLIC_API_URL`           | `https://medplatform-api.onrender.com` |

4. Click **Deploy** — you'll get a URL like `https://medplatform-abc123.vercel.app`
5. Go back to Render → update `ALLOWED_ORIGINS` to your Vercel URL → Save

---

## Step 5 — Keep Render Free Tier Awake

Render free tier sleeps after 15 minutes of inactivity. Prevent this with UptimeRobot:

1. Create a free account at [uptimerobot.com](https://uptimerobot.com)
2. Add a new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://medplatform-api.onrender.com/health`
   - **Interval**: 5 minutes

---

## Step 6 — Create Your First Users

1. Navigate to `/register` in your deployed app and create:

   - `patient@test.com`
   - `doctor@test.com`
   - `admin@test.com`

2. Log in as admin → **Users** page → assign roles:

   - `doctor@test.com` → `DOCTOR`
   - `admin@test.com` → `ADMIN`

3. In Supabase → **Table Editor → `doctor_patient_assignments`** → insert a row to link doctor to patient

---

## Local Development

```bash
# Backend
cd backend
cp .env.example .env        # fill in your Supabase keys
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
cp .env.example .env.local  # fill in your keys
npm install
npm run dev
```
