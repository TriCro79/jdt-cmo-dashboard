# JDT CMO Dashboard

Single-user web app for Tripp Crosby. The dashboard he uses to check in 
on the JDT (Just Do THIS) marketing agent team.

## Architecture

- **Frontend:** Next.js 16 App Router, TypeScript, Tailwind, deployed on Vercel
- **Backend:** Supabase (project: JDTapp)
- **Auth:** Supabase magic link, single allowed email (tripp@trippcrosby.com)
- **Data:** Polling every 30s, no real-time
- **Routing:** App Router with `app/` at project root (NOT in src/). 
  Path alias `@/*` maps to `./*`.

## File structure

- `app/` — pages and routes
- `app/login/page.tsx` — login page
- `app/auth/callback/route.ts` — magic link handler
- `app/page.tsx` — dashboard home (auth-protected)
- `lib/supabase/` — Supabase client utilities (client, server, middleware)
- `middleware.ts` — at root, runs auth check on every request

## Supabase tables (already created)

- `assignments` — CMO writes, specialists pick up
- `agent_runs` — log of every agent run
- `tripp_requests` — CMO's asks for Tripp's personal channels
- `metrics` — installs, signups, post performance
- `research_queue` — raw items the Researcher collects
- `content_queue` — drafts awaiting Tripp's approval
- `outreach_targets` — people, podcasts, newsletters worth approaching
- `memos` — CMO's weekly memos (also written to vault)

## Agent team (in separate `brain` repo, not this one)

- **CMO** — manages the team, writes weekly memos
- **Researcher** — gathers external info on assignment
- **Ingester** — compiles raw findings into wiki on schedule
- (Content Drafter, Outreach Scout, Analyst, Recruiter — not built yet)

## Dashboard sections to build (in priority order)

1. Memo viewer (latest weekly memo, mark as read) — START HERE
2. Asks for Tripp (action: accept/decline/snooze tripp_requests)
3. Content queue (action: approve/edit/reject drafts)
4. Goal tracker (X / 10 users, phase indicator)
5. Active assignments (read-only table)
6. Recent activity (read-only run log)

## Design notes

- Dark mode. Calm. Not a startup dashboard with charts.
- Mobile + desktop equal weight, responsive layout.
- Section refreshes independently every 30s.

## Don't do

- Don't add real-time subscriptions yet (polling fine for v1)
- Don't add notifications yet
- Don't migrate to src/ directory (causes routing issues)
- Don't break auth — middleware.ts and lib/supabase/middleware.ts are 
  already working