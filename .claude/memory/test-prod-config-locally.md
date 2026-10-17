---
name: test-prod-config-locally
description: "How to make the local Docker Grav read the production env folder (Host header trick), and the file it leaves behind"
metadata:
  node_type: memory
  type: reference
  originSessionId: 91b66f5d-bd5a-4d16-b743-5cbe0607f900
  modified: 2026-10-04T19:31:52.097Z
---

Grav picks `user/env/<host>/config/` from the request host, so the tracked
production `system.yaml` can be tested locally by hitting the Docker nginx
directly with the production host (Traefik only routes `topvoicetgn.test`):

```
docker compose exec -T nginx sh -c 'wget -S -O /dev/null --header="Host: www.topvoicetgn.com" http://127.0.0.1/ 2>&1'
```

Use `127.0.0.1`, not `localhost` (IPv6, connection refused).

Side effect: Grav 2 writes `security-private.php` (nonce key) into
`user/env/www.topvoicetgn.com/config/` on the first request. It is gitignored,
but delete it afterwards so the folder only holds `system.yaml`. See
[[prod-env-config]].

Found while doing it on 2026-10-04: every page carries the contact form's
nonce and `__unique_form_id__`, so the HTML differs per request. The ETag
never matches (no 304s), and a before/after comparison must strip lines with
`__unique_form_id__|form-nonce|form_nonce` first.
