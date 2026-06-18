# MedPlatform — Full Stack Medical Records System

HIPAA · GDPR · Kenya Data Protection Act compliant medical platform.

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | Vercel (free) |
| Backend API | Python FastAPI | Render (free) |
| Database & Auth | Supabase (PostgreSQL + GoTrue) | Supabase (free) |
| CI/CD | GitHub Actions | GitHub (free) |

---

## STEP 1 — Create Your GitHub Repository

```bash
# 1. Go to github.com/new
#    Name: medplatform
#    Visibility: Private (contains medical config)
#    Do NOT tick "Add README" — we already have one
#    Click "Create repository"

# 2. On your computer, open a terminal in the project folder:
git init
git add .
git commit -m "feat: initial full-stack project — database, backend, frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/medplatform.git
git push -u origin main
```

After pushing, GitHub Actions will automatically run at:
https://github.com/YOUR_USERNAME/medplatform/actions

---

## STEP 2 — Set Up Supabase (Database)

1. Go to **https://supabase.com** → New Project
   - Name: `medplatform`
   - Region: pick closest to Kenya (Singapore or Mumbai on free tier)
   - Save your database password

2. Open **SQL Editor** → New Query
   - Paste the full contents of `supabase/migrations/001_schema.sql`
   - Click **Run**
   - You should see: `Success. No rows returned`

3. Collect your keys from **Settings → API**:
   - `Project URL` → your `SUPABASE_URL`
   - `anon` public key → your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → your `SUPABASE_SERVICE_KEY` (**never expose this in the browser**)
   - **Settings → JWT Settings** → `JWT Secret` → your `SUPABASE_JWT_SECRET`

---

## STEP 3 — Deploy the Backend API to Render

1. Go to **https://render.com** → Sign up with GitHub

2. Click **New → Web Service** → Connect your `medplatform` repo

3. Fill in:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

4. Under **Environment** tab, add these variables:

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `SUPABASE_SERVICE_KEY` | your service_role key |
   | `SUPABASE_JWT_SECRET` | your JWT secret |
   | `APP_ENV` | `production` |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (update after step 4) |

5. Click **Create Web Service** → wait ~3 minutes

6. Test: visit `https://medplatform-api.onrender.com/health`
   - You should see: `{"status":"ok","service":"medplatform-api"}`

---

## STEP 4 — Deploy the Frontend to Vercel

1. Go to **https://vercel.com** → New Project → Import your GitHub repo

2. Set **Root Directory** to `frontend`

3. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `NEXT_PUBLIC_API_URL` | `https://medplatform-api.onrender.com` |

4. Click **Deploy** → wait ~2 minutes

5. You get a URL like: `https://medplatform-abc123.vercel.app`

6. Go back to Render → your service → Environment → update `ALLOWED_ORIGINS` to your Vercel URL → Save → Render auto-redeploys

---

## STEP 5 — Keep Render Free Tier Awake

Render free tier sleeps after 15 minutes of no traffic.

1. Go to **https://uptimerobot.com** → free account
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://medplatform-api.onrender.com/health`
   - Interval: 5 minutes
3. Done — your API stays awake 24/7

---

## STEP 6 — Create Your First Users

1. In your deployed app, go to `/register` and create three test accounts:
   - patient@test.com
   - doctor@test.com  
   - admin@test.com

2. Log in as admin, go to **Users** page, and change `doctor@test.com` role to `DOCTOR` and `admin@test.com` to `ADMIN`.

3. Go to Supabase → Table Editor → `doctor_patient_assignments` → Insert row to assign doctor to patient.

---

## Your Git Workflow — How to Track Changes

Every change follows this pattern:

```bash
# 1. Always start from an up-to-date main
git checkout main
git pull origin main

# 2. Create a branch for your change
git checkout -b feat/your-feature-name
# Use these prefixes:
#   feat/   new feature
#   fix/    bug fix
#   docs/   documentation only
#   chore/  config or tooling

# 3. Make your changes to files

# 4. See exactly what changed
git status           # which files changed
git diff             # line-by-line changes

# 5. Stage and commit
git add .
git commit -m "feat: describe what you added"

# 6. Push to GitHub
git push origin feat/your-feature-name

# 7. Go to GitHub → your repo → "Compare & pull request"
#    GitHub Actions CI runs automatically (lint + type-check + build)
#    When checks pass ✅ → click Merge
#    Vercel and Render auto-deploy on merge to main
```

**See your full change history at any time:**
```bash
git log --oneline          # all commits, short format
git log --oneline -10      # last 10 commits
git log --oneline --graph  # visual branch graph
```

**Undo mistakes:**
```bash
git restore filename.ts            # discard unsaved changes to a file
git reset HEAD~1                   # undo last commit, keep the changes
```

---

## Project Structure

```
medplatform/
├── .github/
│   └── workflows/
│       └── ci.yml                        ← Runs on every push: lint + build
│
├── supabase/
│   └── migrations/
│       └── 001_schema.sql                ← Paste once into Supabase SQL Editor
│
├── backend/                              ← FastAPI Python API (deploys to Render)
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py                 ← Reads environment variables
│   │   │   ├── supabase_client.py        ← Database connection (service_role)
│   │   │   └── audit.py                  ← Writes compliance audit log entries
│   │   ├── middleware/
│   │   │   └── auth.py                   ← JWT decode + PATIENT/DOCTOR/ADMIN guards
│   │   ├── models/
│   │   │   └── schemas.py                ← Pydantic v2 request/response validation
│   │   ├── routers/
│   │   │   ├── vitals.py                 ← POST /vitals/submit (PATIENT)
│   │   │   ├── records.py                ← POST /records/append (DOCTOR)
│   │   │   ├── appointments.py           ← Appointment booking & management
│   │   │   └── admin.py                  ← GET /admin/audit-logs (ADMIN)
│   │   └── main.py                       ← FastAPI app entry point + CORS
│   ├── requirements.txt
│   └── .env.example                      ← Copy to .env, fill secrets
│
├── frontend/                             ← Next.js 14 app (deploys to Vercel)
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            ← Login screen
│   │   │   └── register/page.tsx         ← Registration screen
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                ← Auth guard + sidebar wrapper
│   │   │   ├── patient/
│   │   │   │   ├── page.tsx              ← Patient overview dashboard
│   │   │   │   ├── vitals/page.tsx       ← Vitals chart + log form + offline sync
│   │   │   │   ├── records/page.tsx      ← Read-only medical records view
│   │   │   │   └── appointments/page.tsx ← Appointment booking calendar
│   │   │   ├── doctor/
│   │   │   │   ├── page.tsx              ← Doctor overview + today's schedule
│   │   │   │   ├── patients/page.tsx     ← Assigned patients list
│   │   │   │   ├── patients/[patientId]/ ← Patient detail + append clinical notes
│   │   │   │   └── appointments/page.tsx ← Doctor's appointment schedule
│   │   │   └── admin/
│   │   │       ├── page.tsx              ← Admin overview + recent audit events
│   │   │       ├── users/page.tsx        ← User list + role assignment
│   │   │       └── audit/page.tsx        ← Full paginated audit log dashboard
│   │   ├── layout.tsx                    ← Root layout + AuthProvider
│   │   ├── page.tsx                      ← Root redirect by role
│   │   └── globals.css                   ← Tailwind base styles + component classes
│   ├── components/
│   │   ├── layout/Sidebar.tsx            ← Role-aware navigation + online/offline badge
│   │   ├── charts/VitalsChart.tsx        ← Recharts line graph + medical disclaimer
│   │   └── forms/VitalLogForm.tsx        ← Vitals form with offline queue support
│   ├── lib/
│   │   ├── supabase.ts                   ← Supabase browser client
│   │   ├── api.ts                        ← All FastAPI calls with auth token
│   │   ├── auth-context.tsx              ← Auth state + profile React context
│   │   └── offline.ts                    ← IndexedDB offline queue manager
│   ├── types/index.ts                    ← TypeScript types for all data models
│   └── .env.example                      ← Copy to .env.local, fill secrets
│
├── render.yaml                           ← Render reads this to configure deployment
├── vercel.json                           ← Vercel deployment config
├── .gitignore
└── README.md
```

---

## API Endpoints

Base URL: `https://medplatform-api.onrender.com`
All endpoints require: `Authorization: Bearer <supabase_jwt>` header

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/health` | Anyone | Health check |
| POST | `/vitals/submit` | PATIENT | Log a vital reading |
| GET | `/vitals/my` | PATIENT | Get own vitals history |
| GET | `/records/my` | PATIENT | Read own records (read-only) |
| POST | `/records/append` | DOCTOR | Append clinical note/diagnosis |
| GET | `/records/patient/{id}` | DOCTOR | Read assigned patient's records |
| POST | `/appointments/` | PATIENT | Book an appointment |
| GET | `/appointments/my` | ALL | View own appointments/schedule |
| PATCH | `/appointments/{id}/cancel` | PATIENT | Cancel an appointment |
| GET | `/appointments/doctors` | ALL | List available doctors |
| GET | `/admin/audit-logs` | ADMIN | Paginated compliance audit trail |
| GET | `/admin/users` | ADMIN | List all users |
| PATCH | `/admin/users/{id}/role` | ADMIN | Assign user role |
| POST | `/admin/assignments` | ADMIN | Assign doctor to patient |
