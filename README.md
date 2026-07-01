# MedPlatform — Full Stack Medical Records System

> HIPAA · GDPR · Kenya Data Protection Act compliant medical platform built on a fully free stack.

## Overview

MedPlatform is a role-based medical records system that allows patients to log vitals and book appointments, doctors to manage clinical notes, and administrators to oversee users and audit trails — all within a secure, compliance-ready architecture.

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | Vercel (free) |
| Backend API | Python FastAPI | Render (free) |
| Database & Auth | Supabase (PostgreSQL + GoTrue) | Supabase (free) |
| CI/CD | GitHub Actions | GitHub (free) |

## Key Features

- **Role-based access control** — PATIENT, DOCTOR, and ADMIN roles with JWT-enforced guards
- **Compliance audit trail** — every sensitive action is logged for HIPAA/GDPR review
- **Offline vitals sync** — patients can log vitals without internet; data syncs on reconnect
- **Appointment management** — patients book, doctors confirm, all tracked in one place
- **Free-tier deployment** — zero cloud spend using Supabase + Render + Vercel free tiers

## Roles at a Glance

| Role | Can Do |
|------|--------|
| PATIENT | Log vitals, view own records, book appointments |
| DOCTOR | View assigned patients, append clinical notes, manage schedule |
| ADMIN | Manage users, assign roles, view full audit log |

## Repository Structure

```
medplatform/
├── .github/workflows/ci.yml   ← Lint + type-check + build on every push
├── supabase/migrations/       ← Database schema (paste once into Supabase)
├── backend/                   ← FastAPI Python API → deploys to Render
└── frontend/                  ← Next.js 14 app → deploys to Vercel
```

## Quick Links

- **Live API**: `https://medplatform-api.onrender.com/health`
- **Live App**: `https://medplatform.vercel.app`
- **API Docs**: `https://medplatform-api.onrender.com/docs`

---

*Built by [WellNest Innovations](https://github.com/WellNest-Innovations)*
