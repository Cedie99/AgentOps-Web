# AgentOps-Web — Team Setup Guide

Migrates an empty Supabase project to the full production database (schema + RLS + triggers + buckets + all historical data).

## Prerequisites

- Node.js 18+
- A **new** Supabase project (free tier)
- Git access to this repo

---

## Quick Start

```bash
git clone <repo-url> && cd AgentOps-Web
npm install
```

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

> Use **Transaction Pooler** (port 6543). Direct connection (port 5432) may be IPv6-only and unreachable.

```bash
npm run db:setup    # ~30 sec: migrate → custom SQL → import data
npm run dev         # http://localhost:3000
```

---

## Step-by-Step

### 1. Get Supabase Credentials

In the [Supabase Dashboard](https://supabase.com) → **Project Settings → Database**:

- **Connection string (Transaction Pooler)**: copy from the **Connection string** section, select **Transaction** pooler mode, port 6543
- **Project ref**: the subdomain in your project URL (e.g. `abcxyz` from `https://abcxyz.supabase.co`)

In **Project Settings → API**:

- **anon public key**
- **service_role key**

### 2. Create `.env`

```env
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJh..."
SUPABASE_SERVICE_ROLE_KEY="eyJh..."
```

### 3. Run Setup

```bash
npm run db:setup
```

This does **three things** in order:

| Step | What | Source |
|---|---|---|
| 1. Migrate | Creates all tables | `prisma/migrations/` |
| 2. Custom SQL | Enables RLS, creates policies, storage buckets, triggers | `scripts/sql/` |
| 3. Import | Loads all historical records | `prisma/seed-data/` |

Expected output:
```
=== Step 1: Applying Prisma migrations ===
Prisma schema loaded from prisma/schema.prisma
[... migration applied ...]

=== Step 2: Running custom SQL scripts ===
  Running 001_check_out_time.sql... OK
  Running 002_collector_daily_collections.sql... OK
  ... (7 scripts)

=== Step 3: Importing seed data ===
  OK users
  OK surveys
  ... (14 tables)

=== Setup complete! ===
```

If a step fails, fix the issue and re-run `npm run db:setup` — it's idempotent (safe to run multiple times).

### 4. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Login

Imported users exist in the database but **don't have Supabase Auth passwords**. You need to create auth entries:

**Option A — Invite via Dashboard (one-by-one):**
1. Supabase Dashboard → **Authentication → Users → Invite user**
2. Enter email → they get a magic link to set password

**Option B — Batch create with script:**
```bash
npx tsx scripts/create-auth-users.ts
```

This creates auth entries for the 6 main accounts with the password `admin123`.

### Main Accounts

| Email | Role |
|---|---|
| `superadmin@agentops.com` | SUPER_ADMIN |
| `admin@agentops.com` | ADMIN |
| `surveyor@agentops.com` | SURVEYOR |
| `sales@agentops.com` | SALES |
| `delivery@agentops.com` | DELIVERY |
| `collector@agentops.com` | COLLECTOR |

---

## Useful Commands

| Command | What it does |
|---|---|
| `npm run db:setup` | Full setup (migrate + custom SQL + import) |
| `npm run db:import` | Import data only (re-runs after clearing) |
| `npm run db:seed` | Run sample seeder (not needed after `db:setup`) |
| `npm run build` | Production build |

---

## Troubleshooting

### "The server does not support SSL connections"
Use the **Transaction Pooler** connection string (port 6543) with `DATABASE_URL`. The Pooler handles SSL properly.

### Migration fails — "relation already exists"
```bash
npx prisma migrate reset  # drops all tables
npm run db:setup           # re-runs everything
```

### Custom SQL fails — "relation does not exist"
The migration may have failed or wasn't run. Make sure Step 1 succeeds before the SQL scripts run.

### Login says "Invalid login credentials"
Run `npx tsx scripts/create-auth-users.ts` to create Supabase Auth entries for the imported users.

---

## How It Works

```
You                     Supabase                     Database
 │                         │                            │
 ├─ npm run db:setup ──────┤                            │
 │                         │                            │
 │  Step 1: prisma migrate │                            │
 │  ──────────────────────►│─── CREATE TABLES ────────►  │
 │                         │                            │
 │  Step 2: custom SQL     │                            │
 │  ──────────────────────►│─── RLS / TRIGGERS ───────►  │
 │                         │    / BUCKETS                │
 │  Step 3: import data    │                            │
 │  ──────────────────────►│─── INSERT ROWS ───────────► │
 │                         │                            │
 ├─ npm run dev ───────────┤                            │
 │                         │                            │
```

## File Layout

```
prisma/
  schema.prisma          # All database models
  seed-data/             # Historical data (SQL exports) ← committed
  migrations/            # Prisma migration files
scripts/
  db-setup.ts            # 🚀 Master setup (run this)
  import-data.ts         # Data import only
  check-data.ts          # Verify row counts
  create-auth-users.ts   # Create Supabase Auth entries
  sql/                   # Custom SQL scripts (RLS, buckets, triggers)
SETUP.md                 # This file
```
