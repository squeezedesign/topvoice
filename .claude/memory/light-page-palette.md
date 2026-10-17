---
name: light-page-palette
description: The light (white) colour scheme designed for /actuacions and dropped for the dark one; Raquel wants it kept for a future restyle of the inner pages
metadata:
  node_type: memory
  type: project
  originSessionId: 91b66f5d-bd5a-4d16-b743-5cbe0607f900
  modified: 2026-10-12T18:59:41.275Z
---

On 2026-10-12 Raquel compared /actuacions in a light version and on the legal
pages' dark background, chose the dark one, and asked to **remember the light
combination in case the inner pages change later**. It was never committed, so
this note is the only copy. It was a `body.theme-light` class (the template set
it and emptied the `background` block, i.e. no `#site-bg`).

Colours were set per element on purpose: redefining `--dark`/`--text` on the
body also turns the off-canvas menu and the cookie banner light.

```css
body.theme-light {
    --light-bg: #ffffff;      /* page, inactive filter pills */
    --light-soft: #f5f3f7;    /* date box, thumbnail placeholder */
    --light-line: #e6e1ea;    /* separators, pill borders, footer rule */
    --light-text: #1a1622;    /* titles, month, summary */
    --light-muted: #6b6475;   /* intro, place/context, year, footer text */
    background: var(--light-bg);
    color: var(--light-text);
    position: relative;
}
/* Leopard only at the foot of the page, fading in from white */
body.theme-light::before {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0;
    height: 100vh; z-index: -1; pointer-events: none;
    background: url('../images/leopard-tile.svg') center bottom / 960px repeat;
    opacity: 0.035;
    mask-image: linear-gradient(to bottom, transparent 25%, #000 80%);
}
body.theme-light nav.scrolled { background: rgba(255,255,255,.94); border-bottom-color: #e6e1ea; }
body.theme-light .hamburger span { background: #1a1622; }
body.theme-light .lb-overlay { background: rgba(0,0,0,.96); }  /* viewer veil over white */
```

Element choices that went with it:
- Format tag: outlined pill, `color` and `1.5px` border in `--primary-dark`
  (#46254f), transparent background, 0.66rem bold uppercase, letter-spacing
  0.2em. (On the dark page it is `--primary` instead: #46254f vanishes there.)
- Active filter pill: `--primary` fill, white text; inactive: white fill,
  `--light-line` border, `--light-muted` text, hover border/text `--primary`.
- Day number in `--primary`, section tag `--primary`, divider `--cyan`.
- Mobile slider dots: inactive `rgba(26,22,34,.2)`, active 20px wide `--primary`.
- Before settling on "leopard at the foot", she tried it fixed full-screen
  (too visible at 3.5 %, liked 2.2 %) and fixed with the same bottom fade.

See [[local-docker-env]] for where the page lives.
