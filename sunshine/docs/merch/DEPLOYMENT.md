# Production deployment guide

## Required topology

Run two public HTTPS services and one private managed PostgreSQL instance:

| Service | Public URL | Command | Probe |
|---|---|---|---|
| Dashboard | `https://<merch-domain>` | `node server.js` from the frontend image | Host HTTP probe |
| API | `https://<api-domain>` | `node src/server.js` from the backend image | `/health` liveness, `/ready` database readiness |
| Metrics job | No public URL | `npm run refresh-sponsor-metrics` | Provider-scheduled hourly execution |
| PostgreSQL | Private only | Managed service | Provider health/backup monitoring |

Build images from the repository root:

```bash
docker build -f apps/merch/api/Dockerfile -t whole-donuts-merch-api .
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://<api-domain>/api -f apps/merch/web/Dockerfile -t whole-donuts-merch-web .
```

The frontend API base URL is public and baked into the frontend build. Every other value below belongs in the API service secret store.

## Production values

| Variable | Value source |
|---|---|
| `DATABASE_URL` | Managed private PostgreSQL TLS connection string |
| `FRONTEND_URLS` | Comma-separated exact dashboard origins, such as `https://<merch-domain>` |
| `JWT_SECRET`, `IP_HASH_SALT`, `OPERATOR_API_KEY` | Three distinct cryptographically random values, each at least 32 characters |
| `JWT_EXPIRES_IN`, `SESSION_COOKIE_MAX_AGE_SECONDS` | Matching short session lifetime, such as `8h` and `28800` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://<api-domain>/api`; frontend build environment only |
| `TRUST_PROXY` | Managed host proxy hop count, normally `1` |
| `DATABASE_SSL_CA` | Provider CA only when required; retain verified TLS by default |
| `MIGRATIONS_DIRECTORY` | Image default; do not override unless the migration files are mounted elsewhere |

Set `NODE_ENV=production`. Production startup fails when its required configuration is missing, insecure TLS is selected without explicit acknowledgement, or origins are not HTTPS.

## Release procedure

1. Create the private managed PostgreSQL instance with encryption, point-in-time recovery, and a dedicated least-privilege application role. Use a distinct migration role where the provider supports it.
2. Configure API runtime secrets and frontend build-time API URL. Do not commit `.env` files or expose API/service tokens in browser variables.
3. Run `npm run migrate` as a one-off release command against the target database. Confirm it completes before starting new application versions.
4. Deploy the API, wait for `/ready`, then deploy the dashboard. Configure the provider scheduler to run the metric refresh command once each hour.
5. Configure custom domains, DNS, and managed TLS. Restrict CORS to the deployed dashboard origin.

## Rollback and operations

Keep the previous service image available. Roll back service images independently when a release fails, but do not roll back database migrations by deleting data. Use forward-only corrective migrations. Review API logs by request ID and alert on readiness failures and scheduled-job failures.

Test a database restore before production launch and at the interval required by Whole Donuts operations. Rotate operator, session, and referral secrets through the provider secret manager; redeploy affected services after each rotation.
