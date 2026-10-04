# Top Voice · web (Grav 2)

Web del cor Top Voice de Tarragona: https://www.topvoicetgn.com. Grav 2.2 con
Admin Next, tema propio `topvoice`, bilingüe catalán (por defecto, sin
prefijo) y castellano (`/es`). La documentación completa para personas está en
[docs/PROYECTO.md](docs/PROYECTO.md); este fichero recoge lo que una sesión de
Claude necesita saber antes de tocar nada.

Responde en castellano. Raquel (Squeeze Design / egluu) mantiene la web; la
clienta es Top Voice y entra al admin con la cuenta `topvoice`.

## Qué está en git y qué no

Solo viajan por git el tema (`user/themes/topvoice/`), los plugins propios
(`user/plugins/topvoice-hooks/`, `user/plugins/admin2-ca/`), los idiomas del
sitio (`user/languages/`), los blueprints (`user/blueprints/`), los logos de
`user/assets/`, `robots.txt` y la configuración de producción
`user/env/www.topvoicetgn.com/config/system.yaml`.

Todo lo demás de `user/` (páginas, `config/`, `accounts/`, `data/` con los
conciertos, el resto de plugins, `media/`) es **por servidor** y está en el
`.gitignore` a propósito. Las páginas se suben a mano por SFTP; la
configuración, las cuentas y los conciertos se gestionan desde el admin.

**Antes de dar un cambio por desplegado**, comprueba con
`git check-ignore -v <ruta>` si se puede commitear. Si no, dilo y explica qué
hay que replicar a mano en producción (SFTP o admin).

Haz commit o push solo cuando Raquel lo pida. Los commits llevan
`Co-Authored-By` según indique la sesión.

## Producción

- Servidor `ubuntu-blackpony`, raíz web `/home/topvoicetgn/www` (es un clon
  de git, el remoto es GitHub `squeezedesign/topvoice`). nginx + PHP-FPM 8.3.
  Logs de nginx en `/home/topvoicetgn/logs/`.
- Raquel entra por SSH como **root**, pero PHP corre como **www-data**. Nunca
  ejecutes `php bin/...` como root ahí: usa `sudo -u www-data php bin/...`.
  Tras un `git pull` como root, devuelve la propiedad:
  `chown -R www-data:www-data /home/topvoicetgn/www`.
- Tú no tienes acceso SSH: dale los comandos a Raquel, **uno por línea y
  cortos** (las órdenes largas con `\` o tuberías se rompen al pegarlas).
  Comprueba el resultado desde fuera con `curl`.
- Despliegue habitual: `cd /home/topvoicetgn/www && git pull && chown -R
  www-data:www-data . && sudo -u www-data php bin/grav clearcache`.

### Configuración por entorno (importante)

En producción Grav lee primero `user/env/www.topvoicetgn.com/config/` y
después `user/config/`. Consecuencias:

- **Grav 2 guarda ahí** todo lo que se cambia desde el admin, además de
  `security.yaml` (salt) y `security-private.php` (clave de nonces). Esos dos
  son secretos y están ignorados; `site.yaml` de esa carpeta también.
- `system.yaml` de esa carpeta **sí está en git** (errores ocultos, caché,
  `pages.never_cache_twig: true`). Si se guarda la configuración de Sistema
  desde el admin de producción, ese fichero cambia en el servidor y hay que
  traerlo a git o el siguiente `pull` dará conflicto.
- Al buscar un valor en el servidor, mira primero la carpeta del entorno: lo
  de `user/config/` puede estar desfasado. La CLI también parece leer el
  entorno, pero no está confirmado; no des por buena una prueba por CLI como
  prueba de que la web funciona.
- En local no hay carpeta de entorno (los hosts son `topvoicetgn.test` y
  `topvoicetgn-grav.test`), así que se usa `user/config/`. Si aparece una
  `user/env/topvoicetgn*.test/`, algo la ha creado: avisa antes de seguir.

### Seguridad (nginx)

nginx no lee `.htaccess`. Las reglas de seguridad están en
`/etc/nginx/sites-available/topvoicetgn` (enlazado desde `sites-enabled`),
dentro de `## Begin - Security`: ficheros ocultos, `.git`, `tmp`, `bin`,
`cache`, `logs`, `backup`, `user/config|env|accounts|data`, `.md` y ficheros
del núcleo devuelven 403. El entorno Docker local también viaja por git
(`docker/`, `docker-compose.yml`) y debe dar 403 con esta regla:
`location ~ ^/(docker/|docker-compose\.yml|composer\.phar|composer-setup\.php) { return 403; }`.
En septiembre de 2026 el `.git` estuvo expuesto y lo
descargaron escáneres: el historial se considera público, así que **nunca
commitees secretos**. Tras tocar nginx, comprueba desde fuera que lo privado
da 403.

## Local

Hay dos entornos locales. Mira la ruta de trabajo de la sesión para saber en
cuál estás; son copias distintas, con sus propias páginas, configuración y
cuentas.

- **Docker** (`~/Sites/topvoicetgn`): Colima + Traefik, nginx + PHP 8.3-FPM,
  en `http://topvoicetgn.test` (DNS `*.test` por dnsmasq, sin HTTPS).
  `docker-compose.yml` y `docker/` (Dockerfile y `nginx.conf`) están en la
  raíz. El contenedor PHP ejecuta `composer install` al arrancar. Los comandos
  de Grav van dentro del contenedor y como www-data:
  `docker compose exec -u www-data php php bin/grav clearcache`
  `docker/nginx.conf` se monta como fichero suelto: tras editarlo, haz
  `docker compose restart nginx` (un `reload` lee la copia vieja, cortada).
- **MAMP PRO** (`/Volumes/X10Pro/Sites/topvoice-grav`): Apache, PHP 8.3, vhost
  `topvoicetgn-grav.test`, que no está en `/etc/hosts`:
  `curl -sk --resolve topvoicetgn-grav.test:443:127.0.0.1 https://topvoicetgn-grav.test/`
  Aquí `php bin/grav clearcache` se lanza directamente.
- El correo local está configurado con el **SMTP real de Gmail**: no envíes
  el formulario de contacto ni pidas recuperaciones de contraseña. En MAMP hay
  MailHog en `localhost:1025` (web en `:8025`) para desviarlo antes; en Docker
  no hay MailHog.
- El modo mantenimiento (`user/config/plugins/maintenance.yaml`) lo gestiona
  Raquel; no lo cambies por tu cuenta.
- Limpia la caché después de tocar frontmatter o blueprints.
- Para revisar la web en un navegador, usa Playwright (navegador aparte), no
  el Chrome de Raquel. Sus capturas van a `.playwright-mcp/`: bórrala al
  acabar.

## Cosas que ya han mordido

- **Conciertos** (Flex Object `concerts`, datos en
  `user/data/flex-objects/concerts.json`): la home filtra por la fecha de hoy
  dentro de un módulo; con la caché de contenido activada la fecha se
  congelaba. Por eso `pages.never_cache_twig: true` en producción.
  Además, `pages.cache_control: no-cache` y `expires: 0`: el valor por
  defecto de Grav mandaba `max-age` de 7 días y el navegador no volvía a pedir
  la página.
  `topvoice-hooks` vacía la caché al guardar o borrar un objeto Flex.
- **Formulario de contacto**: honeypot + captcha Cap (Form ≥ 9.1.5), envío por
  AJAX propio en `scripts.js`. Los campos están en las páginas
  `user/pages/01.home/_06.contact/contact.{ca,es}.md` (no en git). El admin no
  puede guardar esa página en modo experto (la carpeta `_06.contact` no pasa
  la validación del nombre): no cambies ese campo.
- **Correo**: Gmail SMTP con contraseña de aplicación. Si Raquel cambia la
  contraseña de la cuenta de Gmail o desactiva el 2FA, la contraseña de
  aplicación deja de valer. Los fallos se registran en `logs/grav.log`
  (`plugin-email: could not send…`). Deja el `debug` del plugin desactivado.
- `base.html.twig` imprime `assets.js('bottom')|raw` para que los scripts de
  los plugins (Cap) carguen; el `|raw` es necesario. No añadas `assets.css()`.
- El tema enlaza su CSS/JS con el filtro `theme_asset` (`topvoice.php`), que
  añade `?v=<mtime>` para evitar cachés del navegador.
- La página de error usa `http_response_code: 404` en su cabecera (no `code`).
- Cookies: vanilla-cookieconsent 3 con Google Consent Mode v2 y GTM
  `GTM-5D6CW423` (`partials/gtm_head` y `partials/cookieconsent`). El vídeo usa
  youtube-nocookie.

## Admin Next (Grav 2)

- Plantillas de título en blueprints: solo `{{ object.x }}` y
  `{{ object.x ?? 'y' }}`; nada de etiquetas Twig.
- Catalán del admin: plugin `admin2-ca`. El selector de idioma solo lista
  `admin2/languages/*.yaml`, así que el plugin deja ahí un `ca.yaml` vacío.
  Si se añaden textos nuevos al admin, faltarán en catalán hasta traducirlos.
- `topvoice-hooks` oculta con CSS el panel "Configuració del servidor" del
  login (Admin Next no ofrece otra forma).
- `topvoice-hooks` también registra `api.topvoice.menu_media`,
  `api.topvoice.menu_tools` y `api.topvoice.dashboard_customize`
  (`permissions.yaml`): solo deciden si se ven
  «Multimèdia» y «Eines» en el menú y el botón «Personalitza» del tauler
  (buscado por su texto). Un script inyectado en el admin lee los
  permisos del usuario en `localStorage` (`grav_admin_auth::/admin`, solo
  incluye `api.*`), oculta los enlaces y redirige al tauler si se escribe la
  URL. Los permisos reales no cambian: las imágenes de las páginas necesitan
  `api.media.*` y las estadísticas del tauler `api.system.read`, que son los
  mismos que muestran esos enlaces. Tras cambiar permisos hay que cerrar
  sesión y volver a entrar.
- Permisos: la clienta está en el grupo `autor`; ser superadmin es el
  permiso `api.super`, no un grupo. Las estadísticas del tauler requieren
  `api.system.read`. Ver la lista de copias exige `api.system.backup`, que
  también permite descargarlas (contienen cuentas y secretos): no se lo des
  al grupo `autor`.
- No abras el admin en el Chrome de Raquel mientras trabaja: la pantalla de
  login reescribe el `localStorage` compartido y le vacía los permisos del
  menú hasta que vuelve a iniciar sesión.
- Admin Next tiene fallos propios (avatar al cambiar de tema, textos en inglés
  fijos en el código); Raquel ha decidido no reportarlos.
