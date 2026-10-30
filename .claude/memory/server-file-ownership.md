---
name: server-file-ownership
description: Production runs PHP as www-data while Raquel works as root — anything root leaves behind breaks the admin later
metadata:
  type: project
---

On the production box (`root@ubuntu-blackpony`, `/home/topvoicetgn/www`),
nginx and PHP-FPM 8.5 run their workers as **www-data**, but Raquel works over
SSH as **root**. Every file root creates in that tree is later unwritable and
undeletable by the site itself, and the failures are confusing rather than
obvious.

**Confirmed instances:**

- `user/plugins/shortcode-core` was `root:root 755` while `user/plugins` was
  `www-data:www-data 775`. Updating from the admin failed with
  `rmdir(...): Directory not empty` — GPM deleted what it could, could not
  touch the rest, and the final `rmdir` failed. (Do not uninstall this plugin:
  `login/blueprints.yaml:23` depends on `shortcode-core >= 6.0.0`.)
- `logs/email.log` ended up root-owned after running
  `php bin/plugin email test-email` as root. With the email plugin's `debug`
  on, the site then delivered mail and died writing the log line — see
  [[email-sending-fails-silently]].
- The `touch(): Utime failed: Permission denied` entries in `grav.log` from
  June, raised by `Cache::clearCache()` from the admin, are the same cause.

**The rule:** never run `php bin/...` as root in that tree — use
`sudo -u www-data php bin/...`. And after deploying, hand ownership back:

```
cd /home/topvoicetgn/www && git pull && chown -R www-data:www-data user/
```

To find what is still wrong:
`stat -c '%U:%G  %n' user/plugins/*/ | grep -v '^www-data'` and the same over
`{cache,logs,backup,tmp,images,assets}`.
