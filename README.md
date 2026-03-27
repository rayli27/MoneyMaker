# 💸 MoneyMaker

> Your all-in-one personal finance command center — built to track, categorize, optimize, and grow your money.

---

## Vision

MoneyMaker is a personal finance platform that starts as a smart transaction tracker and evolves into a full financial optimizer. The long-term goal: one app that knows your spending, tells you which credit cards to open and when, how to churn points for maximum value, and eventually guides your investments and tax strategy.

**Phase 1** → Track & categorize transactions automatically via Plaid  
**Phase 2** → Spending intelligence: trends, budgets, category breakdowns  
**Phase 3** → Credit card optimization: best card per purchase, churning strategy  
**Phase 4** → Investment & tax guidance (future)

---

## Current Status — Week 1 (MVP Foundation)

### ✅ Done

- **Project scaffolded** — Next.js 16 (App Router) + TypeScript
- **Authentication** — Clerk integrated with middleware protecting all routes
- **Database** — Prisma ORM connected to Supabase Postgres, migrations ready
- **Plaid SDK installed** — `plaid` + `react-plaid-link` packages wired up
- **Tailwind CSS v4** — styling configured
- **Agent conventions** — `CLAUDE.md` + `AGENTS.md` set for AI-assisted development

### 🔄 In Progress / Up Next

| Priority | Feature | Description |
|----------|---------|-------------|
| 1 | **Plaid Link UI** | Connect bank accounts via Plaid Link modal |
| 2 | **`/api/plaid/sync` endpoint** | Incremental transaction sync with anti-duplicate guard |
| 3 | **Spending Intelligence UI** | Monthly spend by category with trends |
| 4 | **Credit Card Optimizer** | Best-card-per-purchase calc using stored reward rules |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Auth | [Clerk](https://clerk.com) |
| Database | [Supabase](https://supabase.com) Postgres |
| ORM | [Prisma 7](https://prisma.io) |
| Bank Sync | [Plaid](https://plaid.com) |
| Styling | Tailwind CSS v4 |
| AI | Claude API (Anthropic) — for categorization & insights |

---

## Project Structure

```
moneymaker-app/
├── app/                  # Next.js App Router pages & API routes
├── lib/                  # Shared utilities, Prisma client, Plaid client
├── prisma/               # Schema & migrations
│   └── schema.prisma
├── public/               # Static assets
├── middleware.ts          # Clerk auth middleware
├── CLAUDE.md             # AI agent instructions (points to AGENTS.md)
├── AGENTS.md             # Coding conventions for AI-assisted dev
└── .env                  # Local env vars (never commit)
```

---

## Getting Started (Local Dev)

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Clerk](https://clerk.com) account
- A [Plaid](https://plaid.com) account (Sandbox is free)

### 1. Clone & Install

```bash
git clone https://github.com/rayli27/MoneyMaker.git
cd MoneyMaker
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Supabase
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres?schema=public&sslmode=require

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Plaid
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox   # sandbox | development | production

# Anthropic (AI features)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Database Setup

If using Supabase, enable the UUID extension first:
```sql
-- Run in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Then run migrations:
```bash
npx prisma migrate dev
```

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Roadmap

### 🗓 Week 1 — Data Pipeline
- [ ] Plaid Link UI (bank account connection flow)
- [ ] `/api/plaid/sync` — incremental sync, deduplication
- [ ] Transaction storage in Postgres via Prisma
- [ ] Non-blocking background sync on app load

### 🗓 Week 2 — Spending Intelligence
- [ ] Dashboard: monthly spend totals + category breakdown
- [ ] AI-powered auto-categorization via Claude API
- [ ] Trend charts (spend over time per category)
- [ ] Budget setting + over-budget alerts

### 🗓 Week 3 — Credit Card Optimizer
- [ ] Credit card data model (cards, reward rates by category)
- [ ] Best-card-per-purchase recommendation engine
- [ ] Credit card churning tracker (when to open, sign-up bonus tracking)
- [ ] Points/miles valuation calculator

### 🗓 Future Phases
- [ ] Investment tracking & portfolio overview
- [ ] Tax optimization hints (capital gains, deductions)
- [ ] Net worth dashboard
- [ ] Multi-user / family plan support

---

## AI Features (Claude API)

MoneyMaker uses the Claude API for intelligent financial features:

- **Transaction categorization** — Claude reads raw merchant names and assigns categories (groceries, dining, travel, etc.) far more accurately than keyword matching
- **Spending insights** — Natural language summaries of your month ("You spent 40% more on dining than last month")
- **Card recommendations** — Given a transaction, Claude identifies the optimal card from your wallet to maximize rewards
- **Future: financial Q&A** — Ask "what's my biggest spending category this year?" in plain English

---

## Contributing

This is a personal project in early development. If you're interested in collaborating, open an issue or reach out.

---

## License

Private — all rights reserved.
