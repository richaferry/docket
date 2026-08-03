# Docket

A self-hosted CRM + invoicing workspace for freelancers and small studios.
Track clients, log activity, create and send invoices, get paid — all in one
place, running on your own machine or server.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Clients** — contact details, status (lead/active/archived), and a running
  activity timeline (notes, calls, meetings, plus auto-logged invoice events)
- **Invoices** — line items, tax and discount, payment terms (Net 7/14/30/45/60,
  due on receipt, or custom) that auto-calculate the due date, multi-currency
  support, draft → sent → overdue → paid lifecycle, PDF export, and a no-login
  shareable link for clients to view and download their invoice
- **Dashboard** — outstanding balance, overdue amount, revenue this month,
  recent activity
- **Settings** — business profile, invoice numbering, default tax rate, and
  payment instructions

## Getting started

```bash
git clone https://github.com/richaferry/docket.git
cd docket
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first run you're sent
to `/setup` to create your admin account and business name.

Data lives in a local SQLite file at `data/app.db`, created and migrated
automatically on startup — nothing to run by hand. It's gitignored; back it up
however you like.

## Running with Docker

The project ships with Docker files for both production and local development.
Requires [Docker](https://docs.docker.com/get-docker/) (or Docker Desktop).

### Development (hot reload)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Open [http://localhost:3000](http://localhost:3000). Your host source is
mounted into the container, so edits hot-reload via `next dev`.

### Production

```bash
cp .env.example .env   # then set PUBLIC_URL to your real URL
docker compose up -d --build
```

### Where your data lives

The SQLite database is stored in a Docker **named volume** (`docket-data`,
mounted at `/app/data`), so it survives container restarts and rebuilds.

Back it up and restore it like any other file:

```bash
# backup
docker compose cp docket:/app/data/app.db ./app.db.backup

# restore
docker compose cp ./app.db.backup docket:/app/data/app.db
```

> For self-hosting, put a reverse proxy (Caddy, nginx, or Cloudflare Tunnel)
> in front of the container for TLS — don't expose the port directly.

## Configuration

Everything workspace-related (business profile, invoice defaults, email
provider) is configured through the Settings page. One exception is the
**Public URL** — where this app is reachable from the internet, used to build
the client-facing invoice link in emails — which is deployment config, not
workspace data, so it's set via an environment variable instead:

```bash
# .env
PUBLIC_URL=https://invoices.yourdomain.com
```

Sending invoices is disabled with a clear error until this is set. Restart
the server after changing it.

## Sending invoices by email

Per-tenant email provider configuration was removed from Settings. Workspaces
that configured SMTP/MailAnvil before that change can still send; others get a
clear "email not configured" error on send (invoices can always be created,
viewed, and downloaded as PDF). A paid per-tenant sending feature — where
customers set their own from-name/from-email and Docket handles the actual
mail server on its own subdomain — is designed but not built yet; see
[`docs/paid-email-sending.md`](docs/paid-email-sending.md).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM + SQLite ·
[`@react-pdf/renderer`](https://react-pdf.org/) · Nodemailer · Server Actions
for all mutations. Containerised with Docker (`Dockerfile`, `Dockerfile.dev`,
`docker-compose.yml`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm start` — production build & serve
- `npm run db:generate` — generate a Drizzle migration after changing `src/db/schema.ts`
- `npm run db:migrate` — apply pending migrations
- `npm run admin:create -- you@docket.app` — create/update a platform superadmin
  (accesses the `/admin` area; prompts for a password)
- `npm run db:studio` — browse the local database

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## License

[MIT](LICENSE)
