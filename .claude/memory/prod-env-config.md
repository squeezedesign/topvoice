---
name: prod-env-config
description: Production Grav config lives in user/env/www.topvoicetgn.com/config/, which overrides user/config/ — and the CLI does not see it
metadata:
  type: project
---

Production has a per-environment config directory:
`user/env/www.topvoicetgn.com/config/`. `Setup.php:110` resolves config as
`environment://config` -> `user://config` -> `system://config`, and
`Setup.php:245` puts the environment dir at `user://env/<environment>`. The
environment is the request hostname for web requests and the literal string
`cli` for console commands.

**Consequences, both of which have already caused confusion:**

- Grepping `user/config/system.yaml` shows stale values. On 2026-09-23 it read
  `never_cache_twig: false` while the admin had correctly saved
  `true` into `user/env/www.topvoicetgn.com/config/system.yaml`. Always grep
  `user/env/<host>/config/` first, or both.
- Web and CLI may resolve to different files, so **never treat a green
  `bin/plugin email test-email` as proof the website works** — see
  [[email-sending-fails-silently]]. Grav's default would make CLI use the
  environment `cli` (so `user/config/`), but on this server the CLI clearly
  reads the env dir too: a `test-email` succeeded right after the new SMTP
  password was saved from the admin into the env copy, while
  `user/config/plugins/email.yaml` still held the old revoked one. Something
  (a root `setup.php`, or `GRAV_ENVIRONMENT`) pins the environment — this was
  never confirmed, so check before relying on either direction.

The admin writes to whichever file `config://<name>.yaml` resolves to: the env
copy when one exists, otherwise `user/config/`. So some files are overridden
per environment and others are not — check per file rather than assuming.

**The two layers have drifted and duplicate each other**, which is the actual
problem here rather than the mechanism. As of 2026-09-23
`user/config/plugins/email.yaml` still carried the revoked Gmail app password
while the env copy had the working one. Worth collapsing to a single source of
truth, but diff the two first: some values legitimately differ per environment.

All of this is gitignored, like the rest of `user/config` — see
[[topvoice-untracked-dirs]].

**What is versioned, as of commit d70b187:**
`user/env/<host>/config/system.yaml` is tracked on purpose — it carries what
must differ in production (errors hidden, cache on, never_cache_twig). Its
`plugins/` subdirectory is gitignored, because on the server those files hold
the SMTP and login credentials and no rule had covered them.

The consequence to live with: changing a **System** setting from the
production admin writes into that tracked file, so the change has to be
brought back into git or the repo and the server drift apart silently (git
only complains when an incoming commit touches the same file). Plugin and
content changes from the admin are free — nothing there is tracked.
