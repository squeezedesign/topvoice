---
name: concerts-stale-cache
description: Why past concerts stayed on the home page, and the one setting that fixes it
metadata:
  type: project
---

Past concerts used to stay in the home page's featured block forever, so they
had to be deactivated by hand. **The template was never at fault** —
`concerts.html.twig:11` filters correctly with `c.date >= today` and the
`Y-m-d` strings compare fine.

It was the page content cache. For a modular page `Page.php:771` sets
`$process_twig = shouldProcess('twig') || modularTwig()`, so
`modular/hero.html.twig` is rendered inside `Page::content()` and, with
`pages.never_cache_twig: false`, stored by `cachePageContent()`. The
`"now"|date("Y-m-d")` is therefore frozen at the moment the cache was written.
The cache key is `id()` = the page's modified time + language, so neither the
current date nor the Flex concerts data invalidates it. Deactivating a concert
appeared to work only because `topvoice-hooks` wipes the whole cache on Flex
save/delete.

**Fix, applied in production 2026-09-23: admin -> Configuration -> System ->
tab "Contingut" (Content, the first tab) -> "Mai cachejar Twig"
(`pages.never_cache_twig`) -> Yes.** It is NOT under a "Pages" section (there
isn't one) and NOT the "Cache de Twig" toggle in the "Plantilles de Twig" tab
— that one is `twig.cache`, compiled templates, leave it alone. Grav's own
default for never_cache_twig is `true`; this install had overridden it.

Verified locally by warming the cache with a future-dated concert, editing its
date to the past directly in `user/data/flex-objects/concerts.json` (bypassing
the admin so no cache clear fires) and re-rendering: it stayed visible with the
old date. With the setting on, it vanished immediately and a future date
reappeared immediately. Measured cost: ~0.29s per request either way, no
difference. The contact module already ran this way, since the Form plugin
forces `never_cache_twig` on modules with forms and their parents.

**It now travels with git**: commit d70b187 puts `pages.never_cache_twig: true`
into `user/env/www.topvoicetgn.com/config/system.yaml`, which is the one config
file that *is* versioned — see [[prod-env-config]]. Local keeps it `false` in
`user/config/`, which is right: local wants no caching anyway, and that env
folder is inert locally because the hostname there is `topvoicetgn-grav.test`.

**Second layer, fixed 2026-10-04 (commit 70260ca):** the browser cache.
Grav's default `pages.expires: 604800` with an empty `cache_control` sent
`Cache-Control: max-age=604800` on every page, so a returning visitor's
browser could show a week-old home without asking the server. The prod env
`system.yaml` now sets `expires: 0` and `cache_control: no-cache`. If stale
concerts are reported again, check the response headers before the server
cache.
