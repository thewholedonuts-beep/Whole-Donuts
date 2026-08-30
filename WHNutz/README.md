# +U — unified web entry

This repository is the public deployment root for **wenevergonnaclose.com**.

## Experience map

- **+U entry:** https://wenevergonnaclose.com/
- **+U Movement brochure companion:** public-facing brochure guidance now lives on the landing page so the print flow and site flow stay aligned
- **TNC — The Nurtured Chef:** https://wenevergonnaclose.com/#tnc
- **AWD — Whole Donuts:** https://wenevergonnaclose.com/#awd

The persistent side rail keeps TNC and AWD available throughout the entry experience. Each branch also exposes a fixed branch-specific e-store link in the footer when its section is active.

## Public behavior

- The landing page includes Movement brochure structure, print guidance, and public contact information so the brochure can point directly back to the site.
- The `?u=` query parameter restores a previously issued +U pass into the local browser storage for returning visits.
- QR images are rendered through a third-party QR image service only when a visitor explicitly requests one from the page.

## Repository responsibilities

- `WHNutz` (this public repository): root static site and GitHub Pages deployment.
- `beep/`: preserved funnel definitions, orchestration code, and operational documentation. It is internal tooling, not a public web server.

## GitHub Pages

Publish from the `main` branch repository root after merging this change. The `CNAME` file binds the site to `wenevergonnaclose.com`.

## Porkbun DNS

Use these records for the root deployment:

| Type | Host | Answer | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | 600 |
| A | @ | 185.199.109.153 | 600 |
| A | @ | 185.199.110.153 | 600 |
| A | @ | 185.199.111.153 | 600 |
| CNAME | www | thewholedonuts-beep.github.io | 600 |

No additional brand-domain DNS records are required for the public experience: the branches use `#tnc` and `#awd` routes on the primary domain, which avoids extra certificates and fragmented deployments.

Configure the other domains as URL forwards in Porkbun, preserving any path and query string:

| Source | Forward to |
|---|---|
| `wholedonuts.org`, `wholedonuts.app`, `wholedonuts.buzz` | `https://wenevergonnaclose.com/#awd` |
| `thenurturedchef.com`, `thenurturedchef.foundation`, `thenutur3dchef.com` | `https://wenevergonnaclose.com/#tnc` |

Do not deploy the `192.168.1.x` addresses in the private funnel configuration to public DNS; those are private placeholder addresses.
