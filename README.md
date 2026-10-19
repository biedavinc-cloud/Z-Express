# Z. Express

Multi-tenant logistics platform for African carriers, agencies and merchants: shipment tracking, rate quotes, dispatch, hub scanning, COD ledger, merchant API and webhooks.

Built and maintained by **[liafrik.com](https://liafrik.com)**.

## Stack

- React 18 + Vite, Tailwind, Radix UI
- Supabase: Postgres (row-level security), Auth, Storage, Edge Functions

## Prerequisites

1. Node.js 20+ and `npm install`
2. A [Supabase](https://supabase.com) project
3. The [Supabase CLI](https://supabase.com/docs/guides/cli) for migrations and functions

## Setup

1. **Environment** — copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. **Database** — apply `supabase/migrations/0001_init.sql` (`supabase db push`, or paste it in the SQL editor). It creates the tables, the access rules and the file buckets.
3. **First administrator** — create an account in the app, then run in the SQL editor:
   `select public.promote_admin('you@example.com');`
4. **Auth** — in *Authentication → Providers*, keep Email on with "Confirm email". In *Email Templates → Confirm signup*, make sure the message contains the 6-digit code `{{ .Token }}`. Set the Site URL to `https://express.zanldo.com` and add `https://express.zanldo.com/login` and `https://express.zanldo.com/reset-password` to the redirect URLs. Enable Google if you want Google sign-in.
5. **Functions** — `supabase link --project-ref xoqhibsuyrvfjbmmvsma`, `supabase functions deploy`, then `supabase secrets set APP_URL=https://express.zanldo.com` (see `.env.example` for the optional payment and assistant keys).
6. **Images** — the marketing images are served from `public/images/`.

## Run locally

```bash
npm run dev
```

Open `http://localhost:5173`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build in `dist/` |
| `npm run lint` | ESLint |
| `npm run gen:schema` | Regenerate the SQL migration from `supabase/entities` |

## Data model and security

Every record lives in one `records` table and is protected by row-level security generated from the rules in `supabase/entities/*.jsonc`: an agency only sees its own data, merchants only their shipments, platform admins everything. Roles are stored in `profiles` and cannot be changed by the user. Private files (proof of delivery, company documents) are served through short-lived signed links.

## Payments

Subscriptions are priced on the server. Online checkout is optional and provider-agnostic: configure `PAYMENT_PROVIDER_URL` / `PAYMENT_PROVIDER_KEY` and point your provider's webhook at the `payments-webhook` function (HMAC-SHA256 signature in `x-signature`, secret `PAYMENTS_WEBHOOK_SECRET`). Without them, checkout reports that online payments are not set up.

## Support

liafrik.com
