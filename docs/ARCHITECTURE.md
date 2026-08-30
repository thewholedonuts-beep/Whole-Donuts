# Canonical repository architecture

| Area | Purpose |
|---|---|
| `apps/public-site/` | Static public site and GitHub Pages artifact, including `CNAME`, World, templates, Supabase migrations, and public auth/storefront configuration. |
| `apps/merch/api/` | Express API for sponsor merchandise operations and integration webhooks. |
| `apps/merch/web/` | Next.js merch dashboard. |
| `data/postgres/migrations/` | Forward-only PostgreSQL migrations for the merch API. |
| `infra/docker/` | Example service definitions and container build configuration. |
| `tools/domain-funnels/` | Offline validation of inactive, sanitized configuration examples only. |
| `apps/universe/` | Go ecosystem tools: domain orchestrator, funnel CLI, analytics dashboard, network and scaling orchestrators, domain config packages, and deployment workflows. |

## Provenance

The Git ancestry includes both source histories. The public-site source came from
[`thewholedonuts-beep/WHNutz`](https://github.com/thewholedonuts-beep/WHNutz)
at `720bac1` (the merge of storefront handoff PR #9). The merch source came from
[`thewholedonuts-beep/wholedonuts-merch-platform`](https://github.com/thewholedonuts-beep/wholedonuts-merch-platform)
production-readiness PR #2 at `9290cfe`. The universe source was imported from
[`thewholedonuts-beep/wholedonuts-universe`](https://github.com/thewholedonuts-beep/wholedonuts-universe)
main branch via `git read-tree`.

The former `beep/` tree was imported only once, from WHNutz. Its registrar and
deployment clients, credentials template, active configuration, IP values, and
automatic deployment material were deliberately omitted from this public repository.
