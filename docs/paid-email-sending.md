# Idea (not implemented): paid per-tenant email sending

Revisit this before making invoice email a first-class, monetizable feature.

## Current state

- Per-tenant email delivery **settings UI was removed** (Settings → Email
  delivery). The `email_provider`, SMTP, MailAnvil, and `from_*` columns on the
  `settings` table still exist and are still read by `src/lib/mailer.ts`, so a
  tenant that configured a provider before the removal can still send invoices;
  a tenant that never did gets a clear "email not configured" error on send.
- Platform auth email (verify / password reset) ships via the platform sender
  (`src/lib/platform-mailer.ts` + `MAILANVIL_KEY` / `PLATFORM_EMAIL` env), which
  is separate and unaffected.

## Why it was pulled

Configuring your own SMTP server is a developer skill, not a business-owner
skill. In a hosted multi-tenant product it's also a trust and deliverability
problem: tenants could point Docket at their own relays or weasel out of
"sent from Docket" expectations. As a free self-serve feature it doesn't fit.

## The proposed paid feature

A **billable add-on** that removes the mail-server problem for tenants:

- Tenant sets only **from-name** and **from-email** in Settings.
- Sending happens through a **Docket-provisioned subdomain**, e.g.
  `<tenant-id>@send.docket.app`, with SPF + DKIM set up by us for that
  subdomain (wildcard subdomain + wildcard DKIM selector).
- The tenant's chosen "from-email" is what the *recipient sees* as the reply
  address / from line; the actual envelope sender is the Docket subdomain so we
  stay inside our sender reputation.
- Priced per tenant (flat monthly, or metered per email). Requires a payment
  method on file; feature toggles on when billing is active.

### Shape of the implementation

- New tenant fields: `mail_plan_active`, `from_name`, `from_email`, `reply_to`.
- `src/lib/mailer.ts` learns a third provider mode: when a tenant has the paid
  plan active, send via the platform MailAnvil key with `from` derived from
  tenant settings and a locked envelope sender on `send.docket.app`.
- Billing: Stripe (or equivalent) — subscribe per tenant, webhook flips
  `mail_plan_active`, invoicing quota enforced at send time.
- Settings UI: a small card (from-name / from-email + plan status), replacing
  the removed SMTP/MailAnvil form.

### Open questions

- Domain strategy: dedicated `send.docket.app` vs per-tenant
  `<slug>.send.docket.app` subdomains (per-tenant subdomains isolate one
  tenant's bad behavior from hurting everyone).
- Quota model and overage handling.
- Whether the old per-tenant SMTP/MailAnvil columns should eventually be
  dropped from `settings` once nobody depends on them.
- Reply-to handling so client replies reach the tenant's inbox.
