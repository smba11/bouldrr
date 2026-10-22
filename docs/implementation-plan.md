# Bouldrr v2 implementation

## Audit (2026-10-20)

Next.js 16.3.6 / React 19, Supabase SSR and private Storage, Google Maps script loader. Existing routes cover auth, dashboard, project creation, overview, property, feasibility, regulations, tasks, documents, costs, timeline, copilot and settings. Preserve cost and milestone CRUD.

Baseline typecheck and production build pass. npm install succeeds; dependency audit reports vulnerabilities to review. Lint is unusually slow and still under investigation. App starts successfully on localhost:3000.

Problems found:

- Signup ignores the confirmation-required session state; confirmation accepts arbitrary redirects and ignores exchange errors.
- Project/property/task writes are separate and can leave partial projects.
- Global example regulations appear as property guidance; feasibility overstates readiness based on checklist completion.
- Layout retrieves all project relations, including full message histories, on every navigation and serializes the workspace to the sidebar.
- Mutations swallow database and upload errors. Document paths are accepted from the browser on delete.
- Maps has no Places autocomplete, timeout/retry, modes, design geometry or layer architecture.
- Generic design, dense task cards, small controls and no command palette/activity.
- A tracked .env.production contains public Supabase settings. Remove it from tracking and use ignored local configuration; no private secrets were found or printed.

## Execution

1. Correct SSR auth, error handling, atomic project creation and data ownership. Add additive migrations, GeoJSON site designs/features, provenance, activity and task dependencies.
2. Build a stone/forest Bouldrr identity, SVG mark, design primitives, landing product illustration, project shell and command palette.
3. Replace creation with address → location → intent → goal → persisted workspace. Lazy-load Maps/Places, provide manual fallback.
4. Build property/map analysis and conceptual site drawing/editing, source-aware regulations, next actions, compact tasks and private documents.
5. Run lint/typecheck/build, browser workflow and viewport tests, database/RLS checks. Commit, push to GitHub and verify Vercel production when credentials/services permit.

## Trust rules

No invented parcel, zoning, permit, setback or regulatory findings. User drawings remain conceptual. Missing layers are explicitly unavailable. No OpenAI credential is required or provisioned.
