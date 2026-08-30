# +U — unified web entry

This directory is the GitHub Pages artifact for **wenevergonnaclose.com**.

## Experience map

- **+U entry:** https://wenevergonnaclose.com/
- **+U Movement brochure companion:** public-facing brochure guidance now lives on the landing page so the print flow and site flow stay aligned
- **TNC — The Nurtured Chef:** https://wenevergonnaclose.com/#tnc
- **AWD — Whole Donuts:** https://wenevergonnaclose.com/#awd

The persistent side rail keeps TNC and AWD available throughout the entry experience. Each branch also exposes a fixed branch-specific experience link in the footer when its section is active.

## Public behavior

- The landing page includes Movement brochure structure, print guidance, and public contact information so the brochure can point directly back to the site.
- The `?u=` query parameter restores a previously issued +U pass into the local browser storage for returning visits.
- QR images are rendered through a third-party QR image service only when a visitor explicitly requests one from the page.
- The Made by +U, 4 ALL Goods Window is browse-only until a live storefront is explicitly configured. Cash App support is voluntary and separate from merchandise purchases.

## Storefront handoff

`storefront-config.js` is public, contains no credentials, and ships with an empty `storefrontUrl`. Keep it empty until the separate Shopify + Printful storefront is deployed and verified. Then set it to that storefront's full `https://` URL. The page validates the URL before adding the external **Shop Made by +U, 4 ALL** link; empty, malformed, `http`, or credential-bearing URLs leave the Goods Window browse-only.

## GitHub Pages

The repository workflow uploads this directory after a `main`-branch change. Its
`CNAME` file is intentionally inside the artifact. Enable GitHub Pages and complete
the custom-domain cutover only after reviewing [the external setup guide](../../docs/CUTOVER.md).
