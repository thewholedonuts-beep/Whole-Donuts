# Canonical repository architecture

| Area | Purpose |
|---|---|
| `apps/landing/` | wenevergonnaclose.com gateway — stick figure homepage, "+U"/BEPZITIV animation, and dual-ecosystem split-screen routing. |
| `apps/public-site/` | Static public site and GitHub Pages artifact, including `CNAME`, World, templates, Supabase migrations, and public auth/storefront configuration. |
| `apps/web/` | Main landing page (index.html + styles + script) for wenevergonnaclose.com. |
| `apps/merch/api/` | Express API for sponsor merchandise operations and integration webhooks. |
| `apps/merch/web/` | Next.js merch dashboard. |
| `apps/universe/` | Go ecosystem tools: domain orchestrator, funnel CLI, analytics dashboard, network and scaling orchestrators, domain config packages, and deployment workflows. |
| `backend/router/` | Domain-based routing engine — maps all 9 active domains to their respective services via `config/domains.yaml`. |
| `data/postgres/migrations/` | Forward-only PostgreSQL migrations for the merch API. |
| `infra/docker/` | Container build configuration and nginx config. |
| `tools/domain-funnels/` | Offline validation of inactive, sanitized configuration examples only. |
| `Dockerfile` | Multi-stage production container (public-site, merch-api, Go tools). |
| `docker-compose.yml` | Local development environment. |
| `.env.example` | Environment variable template. |
| `docs/DEPLOYMENT.md` | Production deployment guide. |
| `docs/API.md` | API reference. |

## Ecosystem overview

```
wenevergonnaclose.com  (landing gateway)
├── LEFT  — Whole Donuts ecosystem
│   wholedonuts.{org,app,me,pro,buzz}  → service: wholedonuts
│   wholedonuts.store                  → service: merch
└── RIGHT — Nurtured Chef ecosystem
    thenurturedchef.{com,foundation}   → service: nurturedchef
    thenutur3dchef.com                 → service: merch
```

Domain → service mappings live in `backend/router/config/domains.yaml`.
The landing `public/gateway.js` also contains a client-side fast-path redirect
for the same 9 domains.

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

The Whole-Donuts landing page source came from
[`thewholedonuts-beep/Whole-Donuts`](https://github.com/thewholedonuts-beep/Whole-Donuts)
— only the root-level landing page files (index.html, styles.css, script.js) were
imported to `apps/web/`; nested submodule copies were deliberately excluded.
