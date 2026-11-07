---
name: admin-ui-check-by-raquel
description: Claude has no admin login; verify admin changes by API/CLI and let Raquel check the screen with the topvoice account
metadata:
  type: feedback
---

Claude no tiene usuario del admin y no hace falta: no pidas credenciales ni
permisos para entrar. Comprueba el cambio por dentro (CLI de Grav en el
contenedor, reproduciendo lo que hace la API) y deja la comprobación visual a
Raquel, que entra con la cuenta `topvoice` (grupo `autor`, como la clienta).

**Why:** 2026-11-07, fecha del listado de concerts: Raquel lo comprobó ella
con `topvoice` y dijo que ya no hacía falta lo de los permisos y el usuario.
**How to apply:** al acabar un cambio del admin, di qué has verificado por
CLI/API y qué debería ver ella en pantalla; no lo marques como pendiente por
falta de login.

Lección del mismo caso: la API de Flex saca el tipo de una columna del
listado (`describeListFields`) solo de los campos de primer nivel del
formulario. Un campo dentro de un bloque `conditional` sale como `text`;
hay que poner `field.type` (y `field.label`) en la columna del listado.
Ver [[grav2-migration-test]].
