# thewholedonuts-beep

Unified hub for the entire +U / Whole Donuts / The Nurtured Chef ecosystem.

## Public entry point

**[wenevergonnaclose.com](https://wenevergonnaclose.com/)** — the single public
landing page for the +U experience and its Whole Donuts (AWD) and The Nurtured
Chef (TNC) destinations.

## GitHub Pages setup

Publish from the `main` branch root. The `CNAME` file binds the site to
`wenevergonnaclose.com`.

### Porkbun DNS records

| Type | Host | Answer | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | 600 |
| A | @ | 185.199.109.153 | 600 |
| A | @ | 185.199.110.153 | 600 |
| A | @ | 185.199.111.153 | 600 |
| CNAME | www | thewholedonuts-beep.github.io | 600 |

Forward all other brand domains in Porkbun (preserving path + query string):

| Source | Forward to |
|---|---|
| `wholedonuts.org`, `wholedonuts.app`, `wholedonuts.buzz` | `https://wenevergonnaclose.com/#awd` |
| `thenurturedchef.com`, `thenurturedchef.foundation`, `thenutur3dchef.com` | `https://wenevergonnaclose.com/#tnc` |

## Files

| File | Purpose |
|---|---|
| `index.html` | Full +U landing page (AWD + TNC branches) |
| `styles.css` | Site styles |
| `app.js` | Interactive +U experience logic |
| `auth.js` | Optional Supabase member sign-in |
| `auth-config.js` | Supabase project credentials (fill before launch) |
| `CNAME` | Custom domain binding |

## Consolidated from

This repository consolidates the content previously spread across:
- `thewholedonuts-beep/WHNutz` (public site — now merged here)
- `thewholedonuts-beep/Whole-Donuts` (old template — retired)
- `thewholedonuts-beep/wholedonuts-universe` (Go backend / operational config)

## Local preview

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`.
