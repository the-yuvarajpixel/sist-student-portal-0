# SIST Student Portal

React + Vite dashboard with an Express API for attendance, timetable, results, GPA planning, deadlines and notifications. This distribution runs on sample data only. Live ERP and Moodle adapters are not included; live authentication is deliberately disabled rather than accepting unverified tokens.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. To configure a local environment, copy `.env.example` to `.env`. Use `DATA_SOURCE=mock`.

```sh
npm test
npm run typecheck
npm run build
```

## Production

Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set `SESSION_SECRET` in your hosting environment. Use an HTTPS Node.js host that supports a persistent Express process, set `DATA_SOURCE=mock`, then run `npm run build` and `npm start`. Production cookies require HTTPS. For Vercel, import this repository, use the included vercel.json, and set SESSION_SECRET and DATA_SOURCE=mock. The API is a serverless Express handler; in-memory cache and outage simulation are instance-local and may reset. Deployment has not been verified.

The old lockfiles described incompatible projects and were removed. Run `npm install` to generate a new npm lockfile, then commit it. Dependency installation and full browser/build validation require registry access.

The API uses encrypted session cookies and in-memory caching. No real student credentials should be entered. The health endpoint reports that upstream adapters are unavailable.

## Recreated welcome experience

Routes: `/` and `/welcome` show the landing page, `/login` opens the sample sign-in, `/dashboard` opens the authenticated workspace. Demo sessions now require explicit sign-in. The original SISTmate website could not be inspected; this is an independent design, not its original source.
