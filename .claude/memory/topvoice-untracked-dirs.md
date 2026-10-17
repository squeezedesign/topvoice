---
name: topvoice-untracked-dirs
description: "Which parts of the topvoice-grav repo are deliberately gitignored, and what that means when changing content or config"
metadata: 
  node_type: memory
  type: project
  originSessionId: 927ecc16-2dab-4136-b4e0-5881d24eb0fd
  modified: 2026-09-13T10:48:23.907Z
---

`user/pages/*`, `user/config/`, `user/plugins/*` (except `topvoice-hooks`),
`user/accounts/`, `user/data/` and `user/images/` are gitignored on purpose —
they are per-server and managed from the Grav admin, not from the repo.

**How to apply:** before reporting a change as shipped, check with
`git check-ignore <path>` whether it is even trackable. Edits to page
frontmatter (form definitions, section copy) and to plugin config look done
locally but will never reach production through a commit — say so explicitly
and name what has to be replicated from admin. Only the theme
(`user/themes/topvoice/`) and the custom `topvoice-hooks` plugin travel via
git. This bit [[contact-form-antispam]], whose form fields are page-side.
