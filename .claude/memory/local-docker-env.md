---
name: Entorno Docker local (Colima + Traefik)
description: Setup Docker local en este Mac (Colima en lugar de Docker Desktop); convive con el entorno MAMP
type: project
originSessionId: 744e2315-204b-44f8-b118-66c7a50f5e5f
---
Colima 0.10.3 (VZ, arm64, 2 CPU, 4 GB RAM, 60 GB disco) reemplaza Docker Desktop en este Mac. MAMP PRO sigue en uso: Raquel tiene dos entornos locales (Docker en ~/Sites/topvoicetgn y MAMP en /Volumes/X10Pro/Sites/topvoice-grav, un disco conectado a otra máquina: desde aquí no se ve), ambos documentados en CLAUDE.md.

- Docker CLI: `/opt/homebrew/bin/docker` (brew)
- Docker socket: `/Users/squeeze/.colima/docker.sock`
- Contexto activo: `colima`
- Traefik v3 en `~/Sites/traefik/docker-compose.yml` — red Docker `traefik` (external)
- DNS `*.test` → 127.0.0.1 via dnsmasq (brew) + `/etc/resolver/test`
- Dashboard Traefik: `http://localhost:8080`

**Arranque tras reinicio:**
```
brew services start colima   # o ya configurado para autostart
docker compose -f ~/Sites/traefik/docker-compose.yml up -d
cd ~/Sites/topvoicetgn && docker compose up -d
```

**Proyecto topvoicetgn:**
- `docker-compose.yml` en la raíz del proyecto
- Imagen PHP: `docker/Dockerfile` (php:8.3-fpm-alpine + extensiones Grav)
- Nginx: `docker/nginx.conf` (adaptado de webserver-configs/nginx.conf, fastcgi_pass php:9000)
- URL local: `http://topvoicetgn.test`

**Why:** Docker Desktop fue bloqueado por macOS Sequoia como "software malicioso" (falso positivo).
**How to apply:** Para levantar el entorno local o añadir nuevos proyectos, usar la red `traefik` y labels de Traefik en docker-compose.

**Browser review (2026-10-04):** use the Playwright MCP, not Raquel's Chrome.
It may only write under the project root: screenshots go to
`.playwright-mcp/` (gitignored), not the scratchpad. Delete that folder at the
end. Full-page screenshots show big blank areas because sections fade in on
scroll; scroll through the page with `browser_evaluate` before judging.
