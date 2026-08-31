# apps/landing — Wenevergonnaclose Gateway

Static landing experience for **wenevergonnaclose.com**: the stick figure
welcome, the "+U" / BEPZITIV animation, and the split-screen ecosystem picker.

## User flow

```
1. User arrives at wenevergonnaclose.com
2. Stick figure + logo intro (phase-intro)
3. ENTER button → "+U" BEPZITIV animation (phase-plus-u, ~1.8 s)
4. Split screen appears (phase-split)
   LEFT  → Whole Donuts ecosystem  (wholedonuts.org entry)
   RIGHT → Nurtured Chef ecosystem (thenurturedchef.com entry)
5. Click either side → navigates to the chosen ecosystem
```

## Structure

```
public/
├── index.html            Main landing page (three-phase controller)
├── gateway.js            Phase transitions + ecosystem navigation
├── styles/
│   └── landing.css       All styles (stick figure, +U, split screen, responsive)
└── assets/
    ├── stick-figures.svg  Welcoming stick figure
    └── logo.svg           Wenevergonnaclose wordmark
```

## Local preview

Open `public/index.html` directly in a browser — no build step required.

## Domain routing

`gateway.js` also performs a client-side fast-path redirect when the page is
served from any of the 9 active ecosystem domains (so those domains can point
to the same static host without a backend).  The canonical server-side mapping
lives in `backend/router/config/domains.yaml`.

## Customisation

| What | Where |
|---|---|
| Stick figure drawing | `public/assets/stick-figures.svg` |
| Logo | `public/assets/logo.svg` |
| Animation timings & colours | `public/styles/landing.css` CSS variables |
| "+U" display duration | `PLUS_U_DURATION_MS` in `public/gateway.js` |
| Ecosystem destination URLs | `data-href` attributes in `public/index.html` and `AUTO_ROUTE` in `gateway.js` |
