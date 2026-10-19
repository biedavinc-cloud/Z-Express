# AGENTS.md

## Project Context

Z. Express is a multi-tenant logistics platform (React + Vite frontend, Supabase backend), built and maintained by liafrik.com. Treat it as user-owned application code, keep changes focused on the request, and preserve existing conventions.

Start with `README.md` for setup, environment variables and deployment.

## Key Files

- `src/`: frontend application.
- `src/api/client.js`: the only module that talks to the backend (entities, functions, auth, files).
- `supabase/entities/*.jsonc`: data model and access rules (source of truth).
- `scripts/gen-schema.mjs`: turns the entity files into `supabase/migrations/0001_init.sql`. Re-run `npm run gen:schema` after editing an entity or `supabase/migrations/static/core.sql`.
- `supabase/functions/`: edge functions; `_shared/platform.ts` holds auth, record access and CORS.
- `.env.local`: local-only values; never commit secrets.

## Working Notes

- Run `npm run lint` and `npm run build` before finishing a change.
- Prices are always recomputed server-side (`supabase/functions/_shared/pricing.ts`); never trust an amount sent by the browser.
