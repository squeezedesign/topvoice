---
name: local-vhost-smoke-test
description: "How to fetch rendered pages from the local topvoice Grav vhost, which sits behind maintenance mode"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 927ecc16-2dab-4136-b4e0-5881d24eb0fd
  modified: 2026-09-28T15:03:06.855Z
---

This applies to the **MAMP copy, which runs on another machine** (the X10Pro
disk is attached there). On the Docker Mac use plain
`curl http://topvoicetgn.test/` instead — see [[local-docker-env]].

The MAMP site is the vhost `topvoicetgn-grav.test` (docroot
`/Volumes/X10Pro/Sites/topvoice-grav`), not in `/etc/hosts`, so reach it with:

```
curl -sk --resolve topvoicetgn-grav.test:443:127.0.0.1 https://topvoicetgn-grav.test/
```

On 2026-09-28 Raquel asked to turn maintenance mode OFF locally for good
(`active: false` in `user/config/plugins/maintenance.yaml`), so pages render
with a plain curl. Check the file first: if it is `active: true` again, she
switched it back from admin — then toggle only briefly (back up, toggle,
fetch, restore, verify checksum). It is untracked config she manages from
admin; never change its state on your own.

Run `php bin/grav clearcache` (not `clear-cache`) after editing page
frontmatter — the Form plugin caches form definitions via `saveCachedForms()`.

Endpoints served in `onPluginsInitialized` (such as Cap's `/forms-cap/`)
answer *before* the page pipeline, so they can be tested without touching
maintenance mode at all. Useful for [[contact-form-antispam]].

Email is enabled over SMTP locally: a form submission that passes validation
sends real mail to the client's inbox. Do not POST test submissions.
