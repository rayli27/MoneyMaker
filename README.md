This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase Postgres (MoneyMaker MVP)

### Set env vars
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` (Supabase Postgres connection string)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Supabase `DATABASE_URL` format example:
`postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres?schema=public&sslmode=require`

### Run DB migrations
```bash
npx prisma migrate dev
```

If migrations complain about missing `gen_random_uuid()`:
- In Supabase SQL editor, run: `create extension if not exists pgcrypto;`

### Week-1 MVP direction (next items)
1. Plaid connect + incremental sync endpoint (`/api/plaid/sync`)
2. Non-blocking sync on app open/refresh (with anti-duplicate guard)
3. Spending Intelligence UI (monthly spend + categories + trends) from stored transactions
4. Credit card optimization (best-card calculation) using stored reward rules
