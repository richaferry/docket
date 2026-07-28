# Security Policy

## Supported Versions

Docket doesn't yet have tagged releases — the `main` branch is the only
supported version. Security fixes will land there.

## Reporting a Vulnerability

If you find a security issue, **please don't open a public issue for it.**

Instead, use GitHub's private vulnerability reporting for this repo:

1. Go to the [Security tab](https://github.com/richaferry/docket/security)
2. Click **Report a vulnerability**

This opens a private conversation with the maintainer so the issue can be
fixed before it's disclosed publicly.

If private reporting isn't available for some reason, open a regular issue
that simply says you have a security report to make, without details, and
ask for another way to reach the maintainer.

## Scope notes

Docket is a self-hosted, single-admin tool — it has no multi-tenant auth and
assumes whoever can reach the app is the owner. The main things worth a
security report are:

- Anything that lets an unauthenticated request read/write data it shouldn't
  (e.g. bypassing the session check, or the public invoice link at `/i/[id]`
  leaking data beyond that one invoice)
- Credential handling issues (password hashing, session tokens, SMTP
  credentials stored in the database)
- Dependency vulnerabilities in the app's own code paths (not just `npm audit`
  noise in transitive dependencies)
