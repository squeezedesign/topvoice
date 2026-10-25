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
`user/assets/`, `robots.txt`, `sitemap.xml` y la configuración de producción
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

El push no sale desde las sesiones de Claude en el Mac de Docker: ssh no
conoce la clave de github.com (`Host key verification failed`) y no hay `gh`.
No añadas la clave por tu cuenta; pide a Raquel que lance
`! git push origin main` en el prompt. Cita los hashes de commit copiados de
`git log`, nunca de memoria.

## Memoria de Claude

La memoria del proyecto está en git, en `.claude/memory/` (`MEMORY.md` es el
índice). En cada máquina, la carpeta de memoria que usa Claude Code es un
enlace simbólico a ella, porque su nombre depende de la ruta del proyecto:

- Docker: `~/.claude/projects/-Users-squeeze-Sites-topvoicetgn/memory`
- MAMP: `~/.claude/projects/-Volumes-X10Pro-Sites-topvoice-grav/memory`

Lo que guardes ahí se publica con el siguiente push, y el historial se
considera público: nada de secretos, contraseñas ni datos personales. nginx
devuelve 403 a `/.claude/` (regla de ficheros ocultos). Al empezar en una
máquina, `git pull` para traer lo que haya aprendido la otra.

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
- Cuando Raquel diga que algo está desplegado, mira antes `git status -sb`:
  si pone `ahead N`, el push no salió y el `git pull` del servidor no trajo
  nada. Después compruébalo desde fuera con `curl`.

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

La caché de los estáticos en el navegador también se pone en nginx: un `map
$request_uri $static_expires` fuera del `server` y una `location` por
extensión con `expires $static_expires`, colocada **después** del bloque de
seguridad para que sus 403 sigan ganando. La versión de referencia está en
`docker/nginx.conf`. Solo llevan un año los ficheros cuyo nombre o `?v=`
cambia con el contenido; los plugins, que no llevan versión, se quedan en un
día.

## Local

Hay dos entornos locales, en máquinas distintas. Mira la ruta de trabajo de
la sesión para saber en cuál estás; son copias distintas, con sus propias
páginas, configuración y cuentas, y desde una no se ve la otra.

- **Docker** (`~/Sites/topvoicetgn`): Colima + Traefik, nginx + PHP 8.3-FPM,
  en `http://topvoicetgn.test` (DNS `*.test` por dnsmasq, sin HTTPS).
  `docker-compose.yml` y `docker/` (Dockerfile y `nginx.conf`) están en la
  raíz. El contenedor PHP ejecuta `composer install` al arrancar. Los comandos
  de Grav van dentro del contenedor y como www-data:
  `docker compose exec -u www-data php php bin/grav clearcache`
  `docker/nginx.conf` se monta como fichero suelto: tras editarlo, haz
  `docker compose restart nginx` (un `reload` lee la copia vieja, cortada).
  Las subidas del admin admiten 64 MB (`client_max_body_size` en
  `docker/nginx.conf` y `docker/php-uploads.ini`, montado en el contenedor
  PHP); los valores por defecto (1 MB y 2 MB) cortaban las fotos.
- **MAMP PRO** (`/Volumes/X10Pro/Sites/topvoice-grav`, disco conectado a otra
  máquina): Apache, PHP 8.3, vhost
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
  La fecha no es obligatoria en el blueprint: con «Data per determinar»
  (`date_tbd`) se oculta y el concierto sale como «Data per determinar», siempre
  como futuro y al final. Sin esa marca, `topvoice-hooks` rechaza guardar sin
  fecha (no se pone `required` porque Grav lo aplicaría con el campo oculto).
  Con «Només mes i any» (`month_only`) se publica el mes y el año; el día del
  admin solo ordena (puede ser aproximado) y el concierto sigue en la agenda
  hasta que acaba ese mes.
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
- SEO: `partials/alternates` saca `canonical`, `hreflang`, `og:url` y
  `og:locale`; `partials/social` el resto de Open Graph, con la imagen
  `images/og-image.jpg` del tema (1200×630). `sitemap.xml` es estático y solo
  lista las dos portadas, porque las páginas legales son `noindex`: si se crea
  una página pública nueva, añádela ahí.
- **Galería de la home** (`_05.gallery`): el orden es `media_order` (botón
  «Reordena» de la lista de fotos y después Desa). Grav lo guarda en el `.md`
  de cada idioma; `topvoice-hooks` lo copia a los demás idiomas al guardar
  una página. El alt y el peu de foto van en el `.meta.yaml` de cada foto
  (panel de la miniatura), uno por foto y no por idioma; la antigua lista
  `gallery_items` del frontmatter ya no se lee. La imagen grande usa
  `cropResize` (con `resize` Grav rellenaba de blanco hasta 16:9).
- La página de error usa `http_response_code: 404` en su cabecera (no `code`).
- Páginas internas con cabecera y menú: `partials/base.html.twig` tiene los
  bloques `body_class`, `background` y `scripts`. `scripts.js` es solo de la
  home (escenas de scroll con GSAP y Slick); el menú, `goTo()` y la barra al
  hacer scroll están en `js/common.js`, que cargan todas. Fuera de la home, los
  enlaces del menú llevan a `/#seccion` y `scripts.js` baja hasta ella al
  cargar. El pie está en `partials/footer.html.twig`.
- Cookies: vanilla-cookieconsent 3 con Google Consent Mode v2 y GTM
  `GTM-5D6CW423` (`partials/gtm_head`, `partials/gtm_body` y
  `partials/cookieconsent`). El `<noscript>` de `gtm_body` va justo después de
  `<body>`: sin él, la verificación de Search Console por GTM falla. El ID se
  pone por servidor desde el admin (configuración del tema, campo `gtm_id`, que
  en producción se guarda en `user/env/<host>/config/themes/`, ignorado en
  git). Por defecto está vacío: sin ID no se cargan GTM ni el banner, y así
  debe quedar en local. El vídeo usa youtube-nocookie.

## Actuacions (`/actuacions`)

Página de conciertos pasados: filtro por formato y, por actuación, fecha,
lugar, marco, descripción y galería (vídeos de YouTube primero, después
fotos, en el visor de la home; en móvil la galería es un slider). Aún sin
enlazar: la página lleva `visible: false` y `noindex: true` y no está en
`sitemap.xml`. Al publicarla, quita el `noindex` y añádela al sitemap.

- **Datos:** directorio Flex propio `actuacions`
  (`user/blueprints/flex-objects/actuacions.yaml`), con su entrada en el menú
  del admin, aparte de los conciertos futuros (`concerts`) y del árbol de
  páginas. Usa `FolderStorage`: cada actuación es una carpeta
  `user/data/flex-objects/actuacions/<id>/` con `item.json` y sus fotos (no
  van en git). Es lo que permite subir fotos a un objeto Flex; `concerts` es un
  único JSON y no puede.
- **Página:** `user/pages/05.actuacions/actuacions.{ca,es}.md` (plantilla
  `actuacions`, blueprint del tema `blueprints/actuacions.yaml`): título,
  etiqueta, título de sección e introducción, por idioma. Va por SFTP.
- **Plantilla y estilos:** `templates/actuacions.html.twig`,
  `js/actuacions.js` y la sección `ACTUACIONS` de `css/style.css`. Fondo de las
  páginas legales (`#site-bg`, sin leopardo); colores en las variables
  `--arch-*` de `body.page-actuacions`. Solo salen las activas con fecha
  anterior a hoy, de la más nueva a la más antigua. Textos traducibles en
  pares `campo`/`campo_es`, como en `concerts`.
- **Fotos:** el campo `gallery` es una lista de filas (`.name`, `.image`,
  `.caption`) y no un `file` múltiple, porque Admin Next solo deja arrastrar
  filas de una lista. Las filas salen plegadas (`collapsed: true`): al
  arrastrar, el panel no se desplaza, así que todas tienen que caber en
  pantalla. Una fila plegada se titula con su primer texto, por eso
  `.name` va primero.
- **Subida múltiple:** el campo `gallery_upload` («Pujar diverses fotos»)
  admite muchas fotos a la vez; al guardar, `topvoice-hooks` las pasa a filas
  de `gallery`, al final y en orden natural de nombre, y vacía el campo.
- **`topvoice-hooks`** hace además tres cosas con las actuaciones:
  - Antes de guardar, rellena `.name` de cada fila con el nombre del fichero.
  - Al guardar, borra de la carpeta las imágenes que ya no están en ninguna
    fila: Admin Next solo quita la referencia. No hay papelera; las fotos no
    se comparten entre actuaciones.
  - Rechaza (409) una subida cuyo nombre ya existe en esa carpeta: desde una
    fila de lista Admin Next no pasa `avoid_overwriting` y sobrescribiría.
- **Limitación de Admin Next:** en una actuación nueva hay que guardar antes
  de subir fotos (la carpeta aún no existe y la subida da 422).
- **En cada servidor** (no va en git), a mano:
  - Registrar el directorio en la configuración del plugin Flex Objects
    (`blueprints://flex-objects/actuacions.yaml`).
  - Dar al grupo `autor` `admin.actuacions` (crear, leer, editar, borrar,
    listar), igual que `admin.concerts`.
  - Subir la página por SFTP.
  - En producción, revisar `client_max_body_size` de nginx y
    `upload_max_filesize`/`post_max_size` de PHP antes de subir fotos.

## Admin Next (Grav 2)

- Plantillas de título en blueprints: solo `{{ object.x }}` y
  `{{ object.x ?? 'y' }}`; nada de etiquetas Twig.
- Campos que dependen de otro: bloque `type: conditional` con
  `condition: "campo != valor"`, que Admin Next evalúa en el navegador (no
  hay `readonly` condicional, solo ocultar). Su API pone a los hijos el prefijo
  del bloque (`date_fields.date`) y los guardaría anidados; `topvoice-hooks`
  lo quita en `onApiBlueprintResolved` para los formularios Flex, así que los
  campos se guardan en la raíz. Lleva también `input@: false`.
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
