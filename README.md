# Docket

A self-hosted CRM + invoicing workspace for freelancers and small studios.
Track clients, log activity, create and send invoices, get paid — all in one
place, running on your own machine or server.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Clients** — contact details, status (lead/active/archived), and a running
  activity timeline (notes, calls, meetings, plus auto-logged invoice events)
- **Invoices** — line items, tax and discount, draft → sent → overdue → paid
  lifecycle, PDF export, and a no-login shareable link for clients to view
  and download their invoice
- **Dashboard** — outstanding balance, overdue amount, revenue this month,
  recent activity
- **Settings** — business profile, invoice numbering, default tax rate,
  payment instructions, and SMTP configured entirely through the UI (no env
  files to hand-edit)

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

## Sending invoices by email

Add SMTP credentials under **Settings → Email delivery** (works with a Gmail
app password, or any SMTP provider). Until that's set, invoices can still be
created, viewed, and downloaded as PDF — sending just returns a clear error
telling you to configure it.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM + SQLite ·
[`@react-pdf/renderer`](https://react-pdf.org/) · Nodemailer · Server Actions
for all mutations.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm start` — production build & serve
- `npm run db:generate` — generate a Drizzle migration after changing `src/db/schema.ts`
- `npm run db:studio` — browse the local database

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## License

[MIT](LICENSE)
