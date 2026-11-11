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

**Prefer the admin over SFTP for small page changes.** Local content is not a
copy of production: local `/actuacions` has sample performances while
production has the real ones, and page texts may differ too. Uploading a
local `.md` would overwrite production's texts. For a header tweak (e.g. the
`noindex` toggle «Amagar dels cercadors», or a format card's link) tell
Raquel which admin field to change rather than which file to upload. Flex
data (`user/data/flex-objects/`) is separate from the page `.md`, so page
files never carry the performances themselves.

**Page settings are per language.** Each language is its own `.md`, so an
admin change has to be saved in catalan *and* in spanish. On 2026-11-11 the
`noindex` was removed in `/es/actuacions` but not yet in `/actuacions`. After
such a change, curl both URLs in production, not just one.
