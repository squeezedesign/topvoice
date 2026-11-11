---
name: server-file-ownership
description: Raquel now deploys over SSH as topvoicetgn — no chown, clearcache without sudo; root-owned files were the old trap
metadata:
  type: project
---

**Current way (since November 2026):** Raquel logs into production
(`ubuntu-blackpony`, `/home/topvoicetgn/www`) over SSH as **`topvoicetgn`**,
not as root. From that user she runs `git pull` and
`php bin/grav clearcache` directly: no `chown` afterwards and no
`sudo -u www-data`. Deploy, one command per line:

```
cd /home/topvoicetgn/www
git pull
php bin/grav clearcache
```

**Why:** the site's PHP must be able to write everything in that tree. When
she worked as root, every file root created was later unwritable by the site,
so each deploy needed `chown -R www-data:www-data` and every `bin/` command
`sudo -u www-data`. She told Claude on 2026-11-11 that this is no longer
needed; the exact server setup that makes `topvoicetgn` write correctly was
not recorded.

**How to apply:** give her the three commands above; do not add `chown` or
`sudo -u www-data` any more. If she ever works as root again, the old rule
applies: never `php bin/...` as root, and hand ownership back afterwards.

**What root-owned files broke before** (useful if an old one is still there):

- `user/plugins/shortcode-core` was `root:root`: updating it from the admin
  failed with `rmdir(...): Directory not empty`. (Do not uninstall this
  plugin: `login` depends on `shortcode-core >= 6.0.0`.)
- `logs/email.log` owned by root after running `php bin/plugin email
  test-email` as root; with the email plugin's `debug` on, the site delivered
  mail and died writing the log line — see [[email-sending-fails-silently]].
- `touch(): Utime failed: Permission denied` in `grav.log` from
  `Cache::clearCache()`.

To find leftovers: `stat -c '%U:%G  %n' user/plugins/*/` and the same over
`{cache,logs,backup,tmp,images,assets}`.
