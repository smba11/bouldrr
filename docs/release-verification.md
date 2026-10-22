# Bouldrr v2 release verification

## Scope

The user requested a branded, faster, map-first development workspace with persisted authentication, multiple projects, properties, concepts, tasks, documents, progress, activity, honest data provenance, responsive layouts, and a Vercel/GitHub release.

## Implemented

Landing, auth, dashboard, project creation, project navigation, overview, property, site-concept editing, map-analysis foundation, constraints, feasibility, zoning/regulations, tasks, documents, Copilot, and settings were redesigned. Existing cost and timeline functionality was preserved and given mutation feedback.

Reusable components include PageHeader, SectionHeader, PropertyCard styling, MetricCard, TaskRow, SourceBadge, StatusBadge, EmptyState, LoadingSkeleton, MapPanel, InformationPanel, SearchField, command menu, project switcher and drawer navigation. The SVG mark, favicon, app icon, wordmark and branded loading states are original repository-native assets.

## Authentication and persistence evidence

The live Supabase harness passed 19 workflow checks on October 22, 2026, including:

- Signup/sign-in, profile creation, sign-out, fresh sign-in and persisted access to multiple projects.
- Atomic workspace creation and rollback without partial records.
- Saved address/coordinates and task dependencies.
- Task completion, cost CRUD, milestone CRUD and activity records.
- Persisted GeoJSON/configuration, stale-revision rejection and malformed-geometry rollback.
- Cyclic dependency rejection and protection against relabelling user drawings as official.
- Cross-account isolation for project data, drawings, activity and private files.
- Signed upload, private preview/download and document deletion.

Browser verification has independently confirmed signup → dashboard → sign-out → sign-in → property entry → location confirmation → goal → project creation; concept generation, renaming, type changes, movement, resizing, deletion/undo and saves; task completion updating overall progress; Ctrl+K task search; and a private image upload/preview. A PDF upload also reached the persisted document record. Returning two days later preserved the browser session, drawings, documents, task completion and progress. Browser cost and milestone creation both persisted and showed saved feedback. The PDF drawer now offers a private native-app fallback when an inline viewer is unavailable.

The connected Supabase project auto-confirms email signup. The confirmation-required code path is implemented, but actual confirmation-email delivery has not been tested in this shared environment.

## Maps

Implementation includes current Places (New), geocoding, advanced markers, map types, editing overlays, graceful failures and lazy loading. The local environment has no Google Maps key. Manual-address and no-map workflows are verified; live Google API success is unverified until a restricted, billing-enabled key is configured.

## Applied database migrations

- 20261020191737_bouldrr_v2_site_workspace.sql
- 20261020193841_correct_project_storage_policy.sql
- 20261020195429_validate_geometry_and_dependencies.sql

New tables have owner RLS and supporting indexes. Storage checks both user folder and project ownership. RPC functions retain invoker rights. Cross-project task/design references are constrained; dependency changes serialize per project. Source verification status requires a checked date before it can be marked verified.

Supabase's security advisor reported only the existing project-level warning that breached-password protection is disabled. This shared project's unrelated application tables and global authentication settings were not changed.

## Performance changes

- Public landing bypasses session-refresh proxy work.
- Request-scoped user/project query deduplication.
- A small project shell instead of loading every relation for navigation.
- Page-specific parallel relation queries and bounded document/message history.
- Deferred Maps, designer and command-palette bundles; no Maps on the dashboard.
- Geometry validation isolated from the browser model to avoid shipping Zod with the designer.
- One self-hosted font family; removed the unused generator runtime and over 200 transitive packages.
- Production Next.js updated to 16.4.2; production dependency audit is clean.
- Streaming route skeletons and reduced-motion-aware CSS transitions.

These are measured/code-backed structural improvements; no unsupported load-time percentage is claimed.

For the same persisted QA project, the previous production task page returned 416,542 bytes of HTML and the local v2 production build returned 101,075 bytes (76% smaller). This measures response size, not browser load time. The benchmark now requires the actual authenticated project name in every response, so redirects or missing configuration cannot appear as a speed improvement. Production timings will be recorded after configuration is repaired.

## Responsive/accessibility evidence

Property creation and the site designer were checked at 320, 375, 768, 1024 and 1440 pixels. A 320-pixel body overflow was found and corrected; all five designer widths then showed no horizontal page overflow. Form labels, focus styles, native dialog command focus, mobile drawer controls, keyboard concept point placement and reduced-motion CSS are implemented.

Dashboard, task list, documents, costs, Copilot and feasibility were also checked at all five widths without horizontal page overflow. Mobile navigation opened and closed. Profile save feedback and saved cost/milestone records were verified in the browser. PDF documents use a private open/download link; image previews render inside Bouldrr.

## Intentionally incomplete

External geographic/regulatory feeds, automatic legal parcel/setback/buildable-envelope calculations, nationwide authority matching, validated permit results, AI document extraction, live Copilot without a configured provider, and full localization. Unavailable layers and unknown facts are labelled in the product.

## Release status

Production target: https://bouldrr-theta.vercel.app
Working branch: codex/bouldrr-v2
Final local gates passed on October 22, 2026: npm install, lint, typecheck and production build. Production dependency audit: zero vulnerabilities. Git whitespace check passed. Deployment and live Maps results remain pending verification. The user is configuring the Maps key directly in Vercel.

Commit 67c8dc74b2cbedea005d8a33dcf34398525f2239 was pushed to both main and codex/bouldrr-v2. Vercel production deployment dpl_61bcseAgGfKk3iXH3ufDz96NugtR reached READY, but live signup exposed missing Supabase environment variables. The old deployment had obtained public configuration from its tracked .env.production file. The environment-variable connector returned 403 for both inspection and creation; the local CLI is not signed in. The previous working deployment was restored while the user configures the two Supabase public values and Maps key directly in Vercel. A production prebuild guard now prevents publishing without Supabase configuration. The goal remains active; production authentication and live Google Maps must still be verified after the rebuild.
