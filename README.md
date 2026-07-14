# Conceptly

Conceptly is a Next.js 16 learning app for the MVP AI Foundations course. It uses original Conceptly branding and mechanics inspired by interactive learning products: short steps, authored wrong-answer feedback, sequential unlocks, XP, streaks, replay, and optional OpenAI coaching.

## Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS
- Better Auth email/password auth with database sessions
- Supabase PostgreSQL through server-only Drizzle/pg connections
- OpenAI Responses API for coaching fallback after repeated wrong attempts

Supabase Auth and browser-side Supabase clients are intentionally not used.

## Default Course

Only one course is seeded by default:

- AI Foundations
- Chapter 1: The Language of AI
- Chapter 2: Markdown and JSON
- 10 ordered steps per chapter, 20 total

The static content validator fails if the two-chapter/20-step shape changes or if authored feedback is missing from wrong-answer branches.

## Environment

Copy `.env.example` to `.env.local` and fill:

```bash
DATABASE_URL=
DATABASE_DIRECT_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

Use the Supabase transaction-pooler URL for `DATABASE_URL` and the direct database URL for `DATABASE_DIRECT_URL`.

## Database

```bash
npm run db:migrate
npm run db:seed
```

The migration creates `conceptly_private`, stores Better Auth and app tables there, and revokes `anon`/`authenticated` access from that schema.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run test
npm run build
```

Current local verification passed for lint, unit tests, production build, and Playwright screenshots of the landing/sign-in pages at desktop and 390px mobile. Full authenticated Playwright flows need live Supabase credentials in `.env.local`.
