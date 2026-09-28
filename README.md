# Bouldrr

Bouldrr is a free real-estate development assistant for developers, flippers,
contractors, homeowners, and first-time builders. This repository contains the
MVP foundation: authentication, project creation, property workspace, task
planning, document storage, sourced regulation architecture, and a project
copilot abstraction.

## Current MVP Features

- Supabase Auth sign up, sign in, sign out, and protected app routes.
- Project dashboard and multi-step project creation flow.
- Property workspace with overview, property details, task plan, documents, and copilot.
- Seeded starter task structure across due diligence, zoning, design, financing, permits, construction, inspections, and completion.
- Supabase Storage upload/delete flow for project documents.
- Database design that separates official sources, extracted regulations, and Bouldrr summaries.
- Copilot UI and server-side provider layer. The app runs without `OPENAI_API_KEY` and returns a graceful disabled message until one is added.
- User profile settings with preferred language prepared for English and Spanish.

## Architecture

- `src/app`: Next.js App Router routes.
- `src/components`: reusable UI and feature components.
- `src/lib/supabase`: Supabase SSR browser/server/proxy clients.
- `src/lib/actions`: server actions for auth, projects, documents, and settings.
- `src/lib/data`: server-side data access helpers.
- `src/lib/ai`: provider abstraction for the project copilot.
- `supabase/migrations`: schema, RLS policies, storage bucket policy, and example source/regulation seed.

## Environment Variables

Create `.env.local` from `.env.example`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

Required for the app data path:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional:

- `OPENAI_API_KEY`: enables live copilot responses.
- `OPENAI_MODEL`: defaults to `gpt-5-mini`.
- Map keys are reserved for later Google Maps or Mapbox integration.

## Supabase Setup

1. Create or open the Supabase project used by Vercel.
2. Apply migrations:

```bash
supabase db push
```

3. Confirm the `project-documents` storage bucket exists. The migration creates it as a private bucket.
4. Confirm Auth email settings and redirect URLs include your local and Vercel URLs, including `/auth/confirm`.

## Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment Notes

The repository is ready for Vercel. Configure the Supabase public environment
variables in Vercel. Do not expose Supabase service role keys or `OPENAI_API_KEY`
to the browser. `OPENAI_API_KEY` should remain a server-only environment variable.

## What To Build Next

- Real jurisdiction matching from geocoding plus official source discovery.
- Admin/source ingestion flow for local planning, zoning, building, and permit sources.
- Better document previews and signed download links.
- Task notes, attachments, and jurisdiction-specific task generation.
- Live map integration with Google Maps or Mapbox.
- Production observability and audit logging around AI answers and source extraction.
