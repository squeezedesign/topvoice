# Top Voice TGN — Proyecto Web

## Contexto
Web de presentación del coro moderno **Top Voice** de Tarragona.
Una sola página (one-page) en HTML/CSS/JS estático, sin frameworks, sin CMS.

## Servidor
- **Proveedor:** DigitalOcean (droplet Ubuntu)
- **IP:** 157.230.117.30
- **Web server:** Nginx
- **PHP:** 8.3-fpm (disponible pero no se usa de momento)
- **SSL:** Let's Encrypt (Certbot), renovación automática
- **Ruta de la web:** `/home/topvoicetgn/www/`
- **Config Nginx:** `/etc/nginx/sites-available/topvoicetgn`
- **Dominio:** topvoicetgn.com — DNS gestionado desde DigitalOcean Networking
- **Protección temporal:** htpasswd en `/etc/nginx/.htpasswd`

## Estructura de archivos en el servidor
```
/home/topvoicetgn/www/
├── index.html          ← archivo principal
├── images/
│   ├── logo.png        ← logo real (pendiente de subir)
│   ├── foto-grupo.jpg  ← foto sección "Quiénes somos" (pendiente)
│   ├── foto-1.jpg      ← galería (pendiente, 6 fotos)
│   ├── foto-2.jpg
│   ├── foto-3.jpg
│   ├── foto-4.jpg
│   ├── foto-5.jpg
│   └── foto-6.jpg
```

## Stack del proyecto
- HTML5 + CSS3 + JS vanilla — sin dependencias externas
- Iconos: SVGs inline (sin librerías)
- Fuente: Montserrat (Google Fonts)
- Sin base de datos, sin build step, sin node_modules

## Diseño / Identidad visual
- **Paleta:** `--pink: #E8006A` · `--cyan: #00C9B1` · `--dark: #0d0d14`
- **Tipografía:** Montserrat (300 / 700 / 900)
- Estética oscura con gradientes radiales en el hero
- Logo: círculo con micrófono, gradiente magenta→cyan

## Funcionalidades implementadas
- One-page con scroll suave entre secciones
- Navbar transparente → aparece con fondo al hacer scroll (logo aparece con animación)
- Menú hamburger con offcanvas desde la derecha (overlay semitransparente)
- Selector de idioma CA / ES dentro del offcanvas
- Redirect HTTP → HTTPS (Certbot)
- Redirect sin-www → www (Nginx server block)

## Secciones de la web
1. **Hero** — logo animado, título, descripción breve, CTAs
2. **Quiénes somos** — texto + foto del grupo (placeholder)
3. **Vídeo** — embed YouTube/Vimeo (placeholder)
4. **Galería** — 6 fotos (placeholders)
5. **Contacto** — formulario + info (Instagram, email, ubicación)

## Pendiente
- [ ] Subir logo real (`images/logo.png`) y sustituir el SVG del micro en la nav
- [ ] Subir foto del grupo (`images/foto-grupo.jpg`)
- [ ] Subir 6 fotos de galería (`images/foto-1.jpg` … `foto-6.jpg`)
- [ ] Conseguir y añadir vídeo de presentación (YouTube o Vimeo)
- [ ] Escribir texto completo para "Quiénes somos" en CA y ES
- [ ] Conectar el formulario de contacto (Formspree, Netlify Forms, o script PHP)
- [ ] Quitar htpasswd cuando la web esté lista para publicar
- [ ] Añadir registros MX en DigitalOcean si se quiere usar correo de Hostalia

## Comandos útiles en el servidor
```bash
# Recargar Nginx tras cambios de config
nginx -t && systemctl reload nginx

# Ver logs de Nginx
tail -f /var/log/nginx/error.log

# Renovar SSL manualmente (normalmente es automático)
certbot renew --dry-run

# Subir archivos desde local (ejemplo)
scp ./index.html root@157.230.117.30:/home/topvoicetgn/www/
scp -r ./images/ root@157.230.117.30:/home/topvoicetgn/www/
```

## Instagram
[@topvoicetgn](https://www.instagram.com/topvoicetgn/) — debe aparecer siempre visible
