# reeload-client

Frontend for **ReelOps**: the office web console (Admin, Sales, Operations, Accounts) and the reelmaker phone app, in one Next.js app. Styled after the approved mockup.

Backend (database, permissions, Edge Functions): [`reeload-server`](https://github.com/wereeload-source/reeload-server).

## Stack

Next.js 16 (App Router, React 19) · Tailwind CSS 4 · Supabase (`@supabase/ssr`) · direct-to-R2 resumable uploads · fonts Geist and Funnel Display.

## Screens

| Path | Who | What |
| --- | --- | --- |
| `/login` | everyone | email + password |
| `/dashboard` | Admin | today's shoots, unassigned, collected/outstanding, jobs by stage, approvals, hours, sales calls, audit log |
| `/jobs`, `/jobs/new` | Admin, Sales, Accounts | job list with filters; new job with advance + consent (confirm only with an advance) |
| `/assign` | Admin, Ops | unassigned queue with 48-hour flags, free / overlapping / on-leave reelmakers, assign |
| `/calendar` | office | next two weeks by day |
| `/review` | Admin, Ops | files per job, overdue flags, release work, create 7-day client link |
| `/payments` | Admin, Accounts | ledger: total, advance, received, balance; record payment |
| `/contacts` | Admin, Sales | today's call log and counts |
| `/team`, `/users`, `/settings` | Admin (team: Ops, Accounts) | reelmaker hours, enable/disable users, retention |
| `/m` | Reelmaker | my shoots, accept/decline requests |
| `/m/shoots/[id]` | Reelmaker | brief, map, **Reached → WhatsApp OTP → two live photos → upload from Photos** (resumable) |
| `/m/hours` | Reelmaker | own hours this month |
| `/d/[token]` | client, no login | download page for a 7-day link |

Which pages each role sees is in `src/lib/types.ts` (`ROLE_NAV`). The database enforces the real permissions; the nav only hides what a role can't use.

## Getting started

```bash
npm install
cp .env.example .env.local     # Supabase URL + anon key (from `supabase start` in reeload-server)
npm run dev                    # http://localhost:3000
```

Sign in with a seed user from reeload-server, e.g. `kavya@reelops.local` / `reelops123` (Admin) or `arjun@reelops.local` (Reelmaker; open on a phone or narrow window).

## Layout

```
src/
  proxy.ts                    refreshes the Supabase session, sends signed-out users to /login
  app/(console)/              office console: sidebar layout + one folder per page
  app/m/                      reelmaker phone app
  app/d/[token]/              public download page
  lib/supabase/               browser + server clients
  lib/uploader.ts             multipart upload to R2 via presigned parts; resumes by asking the server which parts arrived
  lib/functions.ts            calls Supabase Edge Functions
  components/                 chips, avatars, KPI tiles, page bar
```

## Notes

- **Uploads:** the spec named Uppy; Uppy 6's S3 plugin signs every S3 call in the browser and keeps resume state only on the device. `lib/uploader.ts` keeps the multipart ID on the server instead, so a reelmaker who closes the page can pick the same file again and continue. It also keeps the screen awake while uploading.
- **Live photos** use `getUserMedia` (front camera, then back). The file picker for uploads has no `capture` attribute, so phones offer Photos / gallery.
- **Still to build:** day timeline calendar (one lane per reelmaker), extra-time entry, leave management, invite users, receipts, in-app notifications list.
