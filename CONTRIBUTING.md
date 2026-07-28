# Contributing to Docket

Thanks for considering a contribution. Docket started as a personal tool for
running a freelance dev business, so the priority is staying small, fast, and
easy to self-host — keep that in mind when proposing changes.

## Getting set up

```bash
git clone https://github.com/richaferry/docket.git
cd docket
npm install
npm run dev
```

The database (`data/app.db`) is created and migrated automatically on first
run — no manual setup needed. If you change `src/db/schema.ts`, generate a new
migration with:

```bash
npm run db:generate
```

## Before opening a PR

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three should pass cleanly. There's no test suite yet — if you're adding
non-trivial logic (invoice totals, status transitions, auth), consider adding
one, or at least describe how you verified it manually in the PR description.

## Code style

- TypeScript everywhere, Server Actions for mutations (see `src/actions/`)
  rather than new API routes, unless you need a raw HTTP response (e.g. PDF
  downloads use route handlers — see `src/app/(app)/invoices/[id]/pdf/route.ts`)
- Tailwind CSS using the existing design tokens in `src/app/globals.css`
  (`bg-paper`, `text-ink`, `text-accent`, etc.) rather than one-off hex values
- Keep components small and colocated with their route when they're only used
  there; only promote to `src/components/` when shared

## Reporting bugs / requesting features

Open a [GitHub issue](https://github.com/richaferry/docket/issues) — use the
provided templates where they fit. For security issues, see
[SECURITY.md](SECURITY.md) instead of filing a public issue.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it
before participating.
