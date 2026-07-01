# API Reference & Developer Workflow

---

## API Reference

**Base URL**: `https://medplatform-api.onrender.com`  
**Auth**: All endpoints (except `/health`) require:

```
Authorization: Bearer <supabase_jwt>
```

### Endpoints

| Method | Endpoint                    | Role    | Description                        |
| ------ | --------------------------- | ------- | ---------------------------------- |
| GET    | `/health`                   | Anyone  | Health check                       |
| POST   | `/vitals/submit`            | PATIENT | Log a vital reading                |
| GET    | `/vitals/my`                | PATIENT | Get own vitals history             |
| GET    | `/records/my`               | PATIENT | Read own records (read-only)       |
| POST   | `/records/append`           | DOCTOR  | Append clinical note or diagnosis  |
| GET    | `/records/patient/{id}`     | DOCTOR  | Read an assigned patient's records |
| POST   | `/appointments/`            | PATIENT | Book an appointment                |
| GET    | `/appointments/my`          | ALL     | View own appointments or schedule  |
| PATCH  | `/appointments/{id}/cancel` | PATIENT | Cancel an appointment              |
| GET    | `/appointments/doctors`     | ALL     | List available doctors             |
| GET    | `/admin/audit-logs`         | ADMIN   | Paginated compliance audit trail   |
| GET    | `/admin/users`              | ADMIN   | List all users                     |
| PATCH  | `/admin/users/{id}/role`    | ADMIN   | Assign a user role                 |
| POST   | `/admin/assignments`        | ADMIN   | Assign a doctor to a patient       |

Interactive docs available at `/docs` (Swagger UI) and `/redoc`.

---

## Developer Git Workflow

Every change follows this pattern:

```bash
# 1. Start from an up-to-date main
git checkout main
git pull origin main

# 2. Create a branch
git checkout -b feat/your-feature-name
# Prefix guide:
#   feat/   → new feature
#   fix/    → bug fix
#   docs/   → documentation only
#   chore/  → config or tooling changes

# 3. Make your changes

# 4. Review what changed
git status          # which files changed
git diff            # line-by-line diff

# 5. Commit
git add .
git commit -m "feat: describe what you added"

# 6. Push and open a pull request
git push origin feat/your-feature-name
# GitHub → Compare & pull request
# CI runs automatically (lint + type-check + build)
# When checks pass ✅ → Merge
# Vercel and Render auto-deploy on merge to main
```

### Useful Git Commands

```bash
# View history
git log --oneline          # all commits, compact
git log --oneline -10      # last 10 commits
git log --oneline --graph  # visual branch graph

# Undo mistakes
git restore filename.ts    # discard unsaved changes to a file
git reset HEAD~1           # undo last commit, keep the changes staged
```

---

## Project File Map

```
medplatform/
├── .github/
│   └── workflows/ci.yml              ← Lint + build on every push
├── supabase/
│   └── migrations/001_schema.sql     ← Full DB schema
├── backend/
│   └── app/
│       ├── core/
│       │   ├── config.py             ← Reads env vars
│       │   ├── supabase_client.py    ← DB connection (service_role)
│       │   └── audit.py              ← Compliance audit log writer
│       ├── middleware/auth.py        ← JWT decode + role guards
│       ├── models/schemas.py         ← Pydantic v2 validation
│       ├── routers/
│       │   ├── vitals.py             ← POST /vitals/submit
│       │   ├── records.py            ← POST /records/append
│       │   ├── appointments.py       ← Appointment endpoints
│       │   └── admin.py              ← Admin-only endpoints
│       └── main.py                   ← FastAPI app entry + CORS
└── frontend/
    └── app/
        ├── (auth)/login/page.tsx     ← Login screen
        ├── dashboard/
        │   ├── patient/              ← Vitals, records, appointments
        │   ├── doctor/               ← Patient list, clinical notes
        │   └── admin/                ← User management, audit log
        └── layout.tsx                ← Root layout + AuthProvider
```

---

## Compliance Notes

- All audit log entries are written by `backend/app/core/audit.py` on every sensitive action
- `SUPABASE_SERVICE_KEY` must never be exposed to the browser — it bypasses row-level security
- Patient records are read-only from the patient's own view; only doctors can append notes
- Role changes require ADMIN authentication and are audit-logged automatically
