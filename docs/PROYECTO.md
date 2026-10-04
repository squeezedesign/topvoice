# Web de Top Voice · documentación del proyecto

Última actualización: 2 de octubre de 2026.

Web del cor modern Top Voice de Tarragona, en https://www.topvoicetgn.com.
Desarrollo y mantenimiento: Squeeze Design. Titular legal de la web: Rambla
Music 2016, S.L. (datos completos en la página de aviso legal).

## 1. Qué es

Una web de una sola página (la home) con secciones, más las páginas legales y
la página de error. Está hecha con **Grav 2.2**, un CMS sin base de datos: el
contenido son ficheros Markdown y YAML.

- **Idiomas:** catalán (por defecto, en `/`) y castellano (en `/es`).
- **Tema:** `topvoice`, hecho a medida a partir del HTML estático original.
- **Admin:** Admin Next, en `/admin`, traducido al catalán con el plugin
  propio `admin2-ca`.

## 2. Estructura del contenido

| Página | Carpeta | Notas |
|---|---|---|
| Home | `user/pages/01.home/` | Página modular con seis secciones |
| Mantenimiento | `user/pages/02.maintenance/` | La usa el plugin de mantenimiento |
| Política de cookies | `user/pages/03.politica-cookies/` | Plantilla `legal`, noindex |
| Aviso legal y privacidad | `user/pages/04.politica-privacitat/` | Plantilla `legal`, noindex |
| Error (404) | `user/pages/error/` | Bilingüe, `http_response_code: 404` |

Secciones de la home, en orden: `_01.hero` (portada y próximos conciertos),
`_02.about` (quiénes somos), `_03.video`, `_04.oferim` (qué ofrecemos),
`_05.gallery` y `_06.contact` (formulario y pie). Cada sección tiene su
fichero `.ca.md` y `.es.md`, y su plantilla en
`user/themes/topvoice/templates/modular/`.

### Conciertos

Los conciertos no son páginas, sino objetos Flex (`concerts`), con estos
campos: activo, fecha, hora, lugar, espacio, contexto (catalán y castellano),
formato y si se muestra el formato. Se gestionan en el admin, en **Concerts**,
y se guardan en `user/data/flex-objects/concerts.json`. La home muestra solo
los conciertos activos con fecha de hoy en adelante. El blueprint está en
`user/blueprints/flex-objects/concerts.yaml`.

### Datos del sitio

Redes sociales, email y teléfonos de contacto se editan en el admin, en la
configuración del sitio (campos añadidos por `user/blueprints/config/site.yaml`).
Los textos fijos del tema (menú, pie, formulario, avisos) están en
`user/languages/ca.yaml` y `es.yaml`.

## 3. El tema

`user/themes/topvoice/`:

- `templates/partials/base.html.twig`: estructura común, carga de CSS y JS.
- `templates/partials/gtm_head.html.twig`: Google Tag Manager con Consent Mode
  v2 (todo denegado por defecto).
- `templates/partials/cookieconsent.html.twig`: banner de cookies
  (vanilla-cookieconsent 3.0.0, textos en catalán y castellano). Solo hay una
  categoría opcional, analíticas (Google Analytics vía GTM `GTM-5D6CW423`).
- `templates/legal.html.twig`: plantilla de las páginas legales, sin menú ni
  scripts del tema.
- `templates/forms/email/contact.html.twig`: plantilla del correo del
  formulario.
- `js/scripts.js`: animaciones (GSAP), galería (Slick), vídeo (abre
  youtube-nocookie al hacer clic) y envío del formulario por AJAX.
- `topvoice.php`: añade el filtro Twig `theme_asset`, que pone `?v=<fecha>` a
  los CSS y JS para que los navegadores no usen versiones antiguas.

## 4. Formulario de contacto

Está definido en las páginas de la sección `_06.contact`. Protecciones contra
el spam, sin cookies ni servicios externos: un campo trampa (honeypot) y el
captcha invisible Cap, incluido en el plugin Form. Hay que aceptar la política
de privacidad para enviar.

El correo sale por el SMTP de Gmail (`topvoicetgn@gmail.com`) con una
**contraseña de aplicación**. Si se cambia la contraseña de esa cuenta de
Gmail o se desactiva la verificación en dos pasos, la contraseña de aplicación
deja de funcionar y el formulario no envía nada. Solución: crear una nueva en
https://myaccount.google.com/apppasswords y pegarla, sin espacios, en el admin
(Plugins → Email). Los fallos de envío quedan en `logs/grav.log`.

## 5. Qué está en git y qué no

Repositorio: GitHub `squeezedesign/topvoice`, rama `main`.

**En git:** el tema, los plugins propios (`topvoice-hooks`, `admin2-ca`), los
idiomas, los blueprints, `user/assets/`, `robots.txt`, el `.gitignore` y la
configuración propia de producción
(`user/env/www.topvoicetgn.com/config/system.yaml`).

**Fuera de git, a propósito:** el núcleo de Grav, las páginas (`user/pages`),
la configuración (`user/config`), las cuentas, los datos (conciertos), el resto
de plugins, las imágenes subidas y los logos del admin (`user/media`). Cada
servidor tiene los suyos:

- Las **páginas** se suben a mano por SFTP desde local.
- La **configuración, las cuentas y los conciertos** se gestionan desde el
  admin de cada servidor.

## 6. Entornos

### Local

Hay dos copias locales independientes, cada una con sus páginas,
configuración y cuentas:

- **Docker**: carpeta `~/Sites/topvoicetgn`, en `http://topvoicetgn.test`
  (Colima + Traefik, nginx + PHP 8.3-FPM). Se levanta con
  `docker compose up -d` en la carpeta del proyecto, con Traefik ya
  arrancado (`docker compose -f ~/Sites/traefik/docker-compose.yml up -d`).
  La configuración está en `docker-compose.yml` y `docker/`. Los comandos de
  Grav se lanzan dentro del contenedor:
  `docker compose exec -u www-data php php bin/grav clearcache`.
- **MAMP PRO**, en otra máquina: carpeta `/Volumes/X10Pro/Sites/topvoice-grav`
  (disco externo), servida como
  `https://topvoicetgn-grav.test` (Apache, PHP 8.3). Tiene MailHog en
  `http://localhost:8025` para probar correos.
- En los dos, la configuración de correo usa el SMTP real de Gmail: cámbiala
  antes de probar envíos.

### Producción

- Servidor `ubuntu-blackpony`, carpeta `/home/topvoicetgn/www` (clon del
  repositorio). nginx + PHP-FPM 8.3. Logs de nginx en `/home/topvoicetgn/logs/`.
- Se entra por SSH como root, pero la web corre como **www-data**: los
  comandos de Grav van siempre con `sudo -u www-data`.
- Grav lee primero la configuración de
  `user/env/www.topvoicetgn.com/config/` y después la de `user/config/`. Lo que
  se guarda desde el admin de producción va a la primera.

**Desplegar cambios del tema o de los plugins propios:**
```
cd /home/topvoicetgn/www && git pull
chown -R www-data:www-data /home/topvoicetgn/www
sudo -u www-data php bin/grav clearcache
```

**Si `git pull` da conflicto** con `user/env/www.topvoicetgn.com/config/system.yaml`,
es porque se cambió la configuración de Sistema desde el admin de producción:
hay que llevar ese cambio a git antes.

## 7. Seguridad

- nginx no usa `.htaccess`: las reglas de bloqueo están en
  `/etc/nginx/sites-available/topvoicetgn`, en el bloque `## Begin - Security`.
  Bloquean ficheros ocultos y `.git`, carpetas internas (`tmp`, `bin`, `cache`,
  `logs`, `backup`), las carpetas privadas de `user/`, los `.md` y los ficheros
  del núcleo.
- En septiembre de 2026, antes de añadir esas reglas, el repositorio `.git`
  estuvo accesible y varios escáneres lo descargaron. No contenía contraseñas;
  el salt de Grav se regeneró. **El historial de git se considera público:
  nunca se deben commitear secretos.**
- Las páginas legales llevan `noindex, nofollow`.

## 8. Admin y permisos

- `squeeze`: superadmin (permiso `api.super`), para mantenimiento.
- `topvoice`: cuenta de la clienta, en el grupo **autor** (páginas,
  conciertos, multimedia; sin configuración, plugins ni temas). Puede editar
  su propio perfil.
- Las estadísticas del tauler necesitan el permiso Sistema → Lectura.
- **Menú del admin:** «Multimèdia» y «Eines» aparecen con los mismos
  permisos que necesita la clienta (imágenes de las páginas y estadísticas).
  Para ocultárselos, el plugin `topvoice-hooks` añade dos permisos propios en
  «Top Voice: menú de l'admin»: «Mostra Multimèdia al menú» y «Mostra Eines
  al menú», además de «Permet personalitzar el tauler», que oculta el botón
  Personalitza. Solo ocultan los enlaces, no quitan ningún permiso. El grupo autor
  los tiene desactivados. Después de cambiarlos hay que cerrar sesión y
  volver a entrar.
- Ver, hacer o descargar copias de seguridad requiere Sistema → Còpies de
  seguretat. No se da al grupo autor: las copias contienen las cuentas y la
  configuración con contraseñas.
- El logo y el favicon del admin se configuran en Preferències → Valors
  predeterminats del lloc → Marca (ficheros en `user/media/admin-next/`).
- El editor de páginas es Markdown. Si hiciera falta un editor visual, la
  opción compatible es Editor Pro (de pago).

## 9. Historial relevante

- **Junio 2026:** paso de HTML estático a Grav 1.7 con tema propio.
- **Septiembre 2026:** antispam del formulario, banner de cookies con GTM,
  política de cookies y de privacidad, página 404 bilingüe, reglas de
  seguridad de nginx tras la exposición de `.git`.
- **2 de octubre de 2026:** migración a Grav 2.2.4 con el asistente oficial
  (`migrate-grav`), ensayada antes en local. El admin pasó a Admin Next.

## 10. Pendiente

- Borrar, cuando todo lleve unos días estable, las copias de la migración:
  en local `topvoice-grav-pre-grav2-2026-10-02.tgz` y
  `topvoice-grav-idea-backup`; en producción `/root/topvoice-pre-grav2-*.tgz`
  y `backup/migration-backup-*.zip`. Desinstalar `migrate-grav` en local.
