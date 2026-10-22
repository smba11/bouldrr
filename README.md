# Bouldrr

Bouldrr is a property-aware workspace for real-estate development: locate a property, define a goal, sketch a conceptual site plan, and work through a source-conscious project checklist.

## Bouldrr v2

- Supabase SSR signup, sign-in, sign-out, persistent sessions, profiles, and protected routes.
- Multiple private projects, created atomically with their property and starter tasks.
- Google Places (New) autocomplete, geocoding, saved address components and coordinates, and lazy-loaded roadmap/satellite/terrain maps when configured.
- Conceptual site design: polygon, rectangle, line, marker, semantic types, selection, movement, resizing, naming, deletion, undo, and persistent GeoJSON.
- A local sketch canvas when Maps is unavailable. Unlocated sketches explicitly use local meters rather than geographic coordinates.
- A deterministic structure/parking configurator; no AI credential is required.
- Task dependencies, seven statuses, priority, deadlines, instructions, documents needed, sources, notes, and progress.
- Private document uploads with real progress, search, image/PDF previews, signed download links, and deletion.
- Project activity, milestone and cost tracking, information gaps, and jurisdiction context.
- Ctrl/Cmd+K search across projects, properties, tasks, documents, and navigation.
- Original SVG identity, responsive drawer navigation, keyboard controls, visible focus, and reduced-motion support.

Regulatory coverage is incomplete by design: missing data is labelled rather than invented. User-drawn boundaries, setbacks and buildable areas are concepts, not official findings or architectural plans. Source geometry can be displayed read-only when supplied through a trusted ingestion process.

## Development

Use Node.js 24 and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

PowerShell users can use `Copy-Item .env.example .env.local`. Environment files are ignored; never commit credentials.

Required:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

For live property search/maps:

```dotenv
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Enable **Maps JavaScript API**, **Places API (New)**, and **Geocoding API** in the Google Cloud project. Apply HTTP referrer restrictions for the local and production origins and restrict the key to the required APIs. Bouldrr requests Maps only on property-related surfaces. If Maps is unavailable, manual address entry, coordinates, projects, tasks, documents, and concept sketches remain usable.

Optional existing Copilot integration:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
```

Without a server-side key, Copilot shows its disconnected state and does not create fake responses. Do not put private provider credentials in a `NEXT_PUBLIC_` variable.

## Database and authentication

Migrations are in `supabase/migrations`. Use the Supabase CLI migration workflow for a new environment:

```sh
supabase db push
```

The original two migrations are the existing MVP baseline. The three v2 migrations were applied to the configured project, with their local versions matching the remote history. Some baseline environments originally used manually applied SQL; reconcile that baseline history before pushing the full directory to an existing database.

V2 adds `site_designs`, `map_features`, and `project_activity`; it reuses existing projects, properties, jurisdictions, regulations, tasks, documents, costs and milestones. RLS restricts project data and Storage to the owner. Workspace creation and design saves use invoker-rights RPC transactions. Design revisions detect concurrent saves. Database constraints reject malformed geometry and cyclic/cross-project task dependencies.

The `project-documents` bucket must be private. New files use `user_id/project_id/random_id-filename`. Signed preview URLs last two minutes. Uploads go directly to signed Storage endpoints, avoiding the Server Action body-size limit.

Configure Supabase Auth Site URL and redirect allowlist for the production origin, local development, and `/auth/confirm`. Both PKCE code exchange and token-hash confirmation are supported. Confirmation-required signups show an email instruction instead of redirecting to a missing session. The currently connected project auto-confirms email signup; email delivery in a confirmation-required environment must be verified separately.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

The opt-in live integration harness writes disposable QA accounts and project data to the configured Supabase project. Run only against an environment where those test records are appropriate:

```sh
node --env-file=.env.local scripts/check-connection.mjs
node --env-file=.env.local scripts/verify-workflow.mjs
```

Credentials and test IDs stay in ignored `.codex-test*` files. Results are written to ignored `codex-logs/`. The harness tests actual signup/profile access, atomic creation/rollback, persistence, dependencies, geometry, conflicts, cross-account RLS, Storage uploads/downloads/deletion, activity, and preserved costs/milestones. Remove disposable QA accounts and their files after verification through your administrative workflow.

## Deployment

This repository's `main` branch is connected to the Vercel **bouldrr** project. The production domain is [bouldrr-theta.vercel.app](https://bouldrr-theta.vercel.app). Apply compatible migrations before releasing code that uses them, run the checks, push the tested commit to `main`, and verify that exact commit reaches READY in Vercel.

Set environment variables in Vercel; public variables used in browser bundles require a rebuild when changed. Do not commit `.env.local` or `.env.production`.

## Explicit limits

- Parcel, zoning, flood, wetlands, utilities, nearby permits, and development-activity feeds are not automatically connected.
- Address city/county/state is preliminary context, not confirmation of regulatory authority.
- No surveyed boundary, required setback, buildable envelope, permit result, or feasibility determination is manufactured.
- Concepts are approximate; source geometry currently supports points, lines, and single-ring polygons. Complex/multipart geometry needs an ingestion/rendering extension.
- Copilot currently uses document metadata, not extracted file contents. Live AI responses require separate configuration.
- Language preference is saved; the interface currently uses English.
- Drawing is desktop-first; the keyboard point-entry and object controls remain available on mobile.

The next major version should connect one jurisdiction end-to-end with authoritative parcel geometry, dated local sources, constraint layers, and a validated permit path before expanding geographic coverage.
