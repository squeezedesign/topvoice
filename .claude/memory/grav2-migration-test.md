---
name: grav2-migration-test
description: "Grav 2.2.4 migration done on local and prod (2026-10-02): Grav 2 quirks to remember, leftovers to clean"
metadata:
  node_type: memory
  type: project
  originSessionId: 34447712-bad9-40ab-90b3-194bfd3a1fb3
  modified: 2026-10-02T08:09:36.906Z
---

Local and production were migrated from Grav 1.7.53 to Grav 2.2.4 with the
migrate-grav wizard on 2026-10-02 (local rehearsal first, then prod). Admin is
now Admin Next (admin2 + api); Catalan comes from the repo's admin2-ca plugin.

Grav 2 behaviours that bit us:
- On prod, Grav 2 writes config saves, security.yaml and security-private.php
  to user/env/www.topvoicetgn.com/config/ (first config folder), not
  user/config/. The env site.yaml now overrides user/config/site.yaml. Secrets
  and site.yaml there are gitignored; env system.yaml is still tracked, so a
  System save from the admin will dirty the prod tree. See [[prod-env-config]].
- Admin Next title templates only support {{ object.x }} / {{ object.x ?? 'y' }}.
- The language picker lists only admin2/languages/*.yaml; admin2-ca drops an
  empty ca.yaml there on each request.
- Dashboard stats need api.system.read (also exposes logs/system info).
- Admin Next bugs not ours: avatar vanishes on light/dark toggle; "Displaying
  … records" and "Save" are hard-coded English. Raquel chose not to report them.
- Login "server configuration" panel is hidden by CSS that topvoice-hooks
  injects into the Admin Next shell (no official hook; may reappear on updates).

Wizard notes for any future run: it keeps .git but moves every other root
entry aside (robots.txt is now tracked; .gitignore comes back with git
checkout). Its nginx staging block uses `^~`, which skips the security rules —
we used a hardened copy with auth_basic.

Left over as of 2026-10-02: migrate-grav plugin still installed locally;
backups in /Volumes/X10Pro/Sites (topvoice-grav-pre-grav2-2026-10-02.tgz,
topvoice-grav-idea-backup) and /root/topvoice-pre-grav2-*.tgz plus
backup/migration-backup-*.zip on prod, to delete after a few quiet days.
Prod admin branding and account roles were set by Raquel on 2026-10-02. Prod commands run as www-data, see
[[server-file-ownership]].
