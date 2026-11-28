# reeload-client

Frontend for **Reeload**: the office web console (Admin, Sales, Operations, Accounts) and the reelmaker phone app, in one Next.js app.

Backend (NestJS API on Postgres): [`reeload-server`](https://github.com/wereeload-source/reeload-server). This app never talks to the database; every read and write goes through the API, which decides what each role may do.

## Stack

Next.js 16 (App Router, React 19) · [HeroUI v3](https://heroui.com) components · [Lucide](https://lucide.dev) icons · Tailwind CSS 4 · Vitest + Testing Library · direct-to-R2 resumable uploads · fonts Geist and Funnel Display.

## Getting started

```bash
pnpm install
cp .env.example .env.local     # API_URL = the reeload-server API (http://localhost:4000)
pnpm dev                       # http://localhost:3000
```

Start the API first (see reeload-server's README), then sign in with a seeded account such as `admin@reeload.test` or `reelmaker@reeload.test` (password `Reeload#2025`, local development only). Open the reelmaker app on a phone or a narrow window.

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Develop, build for production, run the build |
| `pnpm lint` / `pnpm typecheck` | ESLint (Next rules) / TypeScript |
| `pnpm test` | Unit and component tests (Vitest, jsdom, Testing Library) |

## Screens

| Path | Who | What |
| --- | --- | --- |
| `/login` | everyone | email + password |
| `/dashboard` | Admin | today, unassigned, money, jobs by stage, price changes to approve, sales calls, activity |
| `/jobs`, `/jobs/new`, `/jobs/[id]` | Admin, Sales, Ops | list and search; new job (confirm only with advance + consent); job page with advance, confirm, reschedule, price change, release, send back, extra time, check-in release, files, client links |
| `/assign` | Admin, Ops | unassigned queue, free / booked / on-leave reelmakers, assign, leave |
| `/calendar` | Admin, Sales, Ops | two weeks at a time |
| `/review` | Admin, Ops | check-ins waiting, work to check with due dates, extra time waiting |
| `/payments` | Admin, Sales, Accounts | ledger, record payment (Admin, Accounts), CSV export |
| `/contacts` | Admin, Sales | call log by day |
| `/team` | Admin, Ops | reelmaker hours per month |
| `/users`, `/settings` | Admin | create, disable, reset password; retention, links, deadlines |
| `/m`, `/m/shoots/[id]`, `/m/hours` | Reelmaker | requests (accept / decline), **Reached → WhatsApp code → two live photos → upload from Photos** (resumable), hours |
| `/d/[token]` | client, no login | download page for a 7-day link |

The menu per role is in `src/lib/nav.ts`. It only hides what a role cannot use: the API enforces the real permissions.

## Layout

```
src/
  proxy.ts                     renews the 15-minute access token before pages run; sends signed-out visitors to /login
  app/
    (console)/                 office console: sidebar layout + one folder per page
    m/                         reelmaker phone app
    d/[token]/                 public download page
    login/                     sign-in page and sign-in / sign-out server actions
    api/proxy/[...path]/       browser → API bridge that adds the token from the httpOnly cookie
  components/                  shared UI on HeroUI: fields, FormDialog, ActionButton, chips, panels
  lib/
    session.ts                 server-side API calls (pages, server actions); requireProfile / requirePage
    api-client.ts              browser calls through /api/proxy
    token.ts                   cookie names, expiry check, single-flight refresh, safe redirects
    uploader.ts                multipart upload to R2; resumes by asking the API which parts arrived
    types.ts, nav.ts, format.ts, job-form.ts
  test/setup.ts                Testing Library + a recorded Next router
```

## Security

- Sign-in tokens live only in **httpOnly, SameSite=Lax** cookies (`Secure` in production); page scripts never see them.
- `/api/proxy` forwards to `API_URL` only, refuses odd paths, cross-site writes and bodies over 1 MB, and never passes upstream cookies back.
- After sign-in the app only redirects to its own paths (`safeNext`), so a crafted `?next=` link cannot send people elsewhere.
- Client download pages are `noindex` and send no Referer.
- Passwords are typed into the form and sent to the API, which hashes them. This app never stores them.

## MCP

`.mcp.json` registers the HeroUI MCP server (`@heroui/react-mcp`), so Claude Code and other MCP clients can look up HeroUI v3 components while working here. Restart Claude Code in this folder and run `/mcp` to confirm it is connected.
