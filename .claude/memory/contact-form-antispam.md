---
name: contact-form-antispam
description: Anti-spam on the Top Voice contact form (honeypot + Cap) — live in production, only a real test send left
metadata:
  type: project
---

The contact form has two anti-spam layers, both cookie-free and with no third
party: a `website` field of `type: honeypot`, and Cap (self-hosted
proof-of-work captcha, invisible mode) shipped inside Form plugin 9.1.5.

**Live in production as of 2026-09-23.** Theme side is commit 3d9398a on
origin/main; the form fields were deployed by uploading the two
`user/pages/01.home/_06.contact/contact.{ca,es}.md` over SFTP. Verified on
www.topvoicetgn.com in both languages: honeypot and cap-token render, both Cap
scripts load unescaped, the vendored WASM is used (no jsDelivr/Google/
Cloudflare), and `/forms-cap/` still rejects bogus tokens.

**Only thing left: one real submission from the browser** to confirm mail
arrives. Never POST the form from the shell — SMTP is live and it would send
to the client's inbox. Console logs under `[cap]` if Cap misbehaves.

**The form fields are not in git** — `.gitignore:30` excludes `user/pages/*`,
see [[topvoice-untracked-dirs]]. SFTP was the right call: production content
had not diverged from local. **Admin Expert mode cannot save these pages** —
the folder is `_06.contact` and `modular_raw.yaml` validates the "Nom de
fitxer" field with a slug rule that rejects the dot, so saving fails with
"Form validation failed". Never edit that field to get past it; the admin
would rename the folder and break the modular ordering. If the fields ever
need to travel with git instead, Grav fires `onFormPageHeaderProcessed`
(PageFormTrait.php:32) precisely so a plugin can inject fields into a page's
form — `topvoice-hooks` is tracked and would be the place.

**Why `assets.js('bottom')|raw`** in `base.html.twig`: the theme hardcodes its
`<script>` tags and never used Grav's Assets pipeline, so plugin `addJs()`
calls were dropped silently. The `|raw` is load-bearing — without it Twig
autoescaping emits literal `&lt;script&gt;`. Only the bottom group is printed;
`assets.css()` would inject form-styles.css and restyle the contact form.

Cap needs Form 9.1.5+ and PHP >= 8.1. Health check, safe any time:
`curl -s -X POST https://www.topvoicetgn.com/forms-cap/challenge` must return
JSON. Note the canonical host is **www** — without it nginx 301s, and `curl -L`
would silently downgrade the POST to GET and report a false 405.
