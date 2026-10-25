<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use Grav\Common\Utils;
use Grav\Events\PermissionsRegisterEvent;
use Grav\Framework\Acl\PermissionsReader;

class TopvoiceHooksPlugin extends Plugin
{
    /**
     * Admin Next's login and setup screens open with a "Server configuration"
     * panel (server URL + environment) meant for driving remote Grav installs.
     * Here the admin only ever talks to this site, so the panel just confuses.
     * The panel is the block right before the form holding #username.
     */
    private const ADMIN_NEXT_CSS = '<style>div:has(+ form #username){display:none!important}</style>';

    /**
     * Hides "Multimèdia" and "Eines" from the sidebar for users without the
     * api.topvoice.menu_* permissions (see permissions.yaml). The real
     * permissions stay untouched: page images need api.media.*, dashboard stats
     * need api.system.read, and those same permissions show these two links.
     *
     * Admin Next logs in with a JWT and no PHP session, so the server cannot
     * tell who is viewing; the SPA keeps the signed-in user's resolved api.*
     * map in localStorage (grav_admin_auth::<basePath>), so decide there.
     * Superadmins get every api.* permission in that map. Typing the URL sends
     * the user back to the dashboard; the API itself still answers, as before.
     */
    private const ADMIN_NEXT_MENU_JS = <<<'JS'
<script>
(function () {
  var cfg = window.__GRAV_CONFIG__ || {};
  var base = cfg.basePath || '/admin';
  var rules = [
    { perm: 'api.topvoice.menu_media', path: '/media' },
    { perm: 'api.topvoice.menu_tools', path: '/tools' }
  ];
  // The dashboard's Customize button has no stable selector: match its label
  // (ADMIN_NEXT.DASHBOARD.CUSTOMIZE in ca, es-ES and en-US).
  var customizeLabels = ['Personalitza', 'Personalizar', 'Customize'];
  var hidden = 'data-topvoice-hidden';

  function toggleCustomize(show) {
    var buttons = document.querySelectorAll('main button');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (customizeLabels.indexOf(b.textContent.trim()) === -1) continue;
      if (show && b.hasAttribute(hidden)) { b.style.display = ''; b.removeAttribute(hidden); }
      if (!show && !b.hasAttribute(hidden)) { b.style.display = 'none'; b.setAttribute(hidden, ''); }
    }
  }
  var style = document.createElement('style');
  document.head.appendChild(style);

  function auth() {
    try {
      var raw = localStorage.getItem('grav_admin_auth::' + base) || localStorage.getItem('grav_admin_auth');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function apply() {
    var a = auth();
    if (!a || !a.accessToken) { style.textContent = ''; toggleCustomize(true); return; }
    toggleCustomize(!!(a.superAdmin || (a.access && a.access['api.topvoice.dashboard_customize'])));
    var css = '';
    rules.forEach(function (r) {
      if (a.superAdmin || (a.access && a.access[r.perm])) return;
      var href = base + r.path;
      css += 'a[href="' + href + '"]{display:none!important}';
      var p = location.pathname;
      if (p === href || p.indexOf(href + '/') === 0) location.replace(base);
    });
    if (style.textContent !== css) style.textContent = css;
  }

  apply();
  // The SPA signs in and navigates without reloading the page.
  setInterval(apply, 500);
})();
</script>
JS;

    /**
     * A file field shows each uploaded image as a 32px square, too small to
     * tell the photos of an actuació apart, though the API thumbnail behind
     * it is 500px wide. Show it larger, uncropped, and open it over the page
     * on click (Escape or a click closes it).
     */
    private const ADMIN_NEXT_THUMBS = <<<'HTML'
<style>
.rounded-md.border > img.h-8.w-8[src*="/thumbnails/"]{width:auto;height:96px;max-width:160px;object-fit:contain;cursor:zoom-in;background:#0001}
#tv-preview{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#000c;cursor:zoom-out}
#tv-preview img{max-width:92vw;max-height:88vh;border-radius:6px;box-shadow:0 10px 40px #0008}
</style>
<script>
(function () {
  function close() { var o = document.getElementById('tv-preview'); if (o) o.remove(); }
  document.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('.rounded-md.border > img[src*="/thumbnails/"]');
    if (!img) return;
    e.preventDefault();
    e.stopPropagation();
    var o = document.createElement('div');
    o.id = 'tv-preview';
    o.innerHTML = '<img alt="">';
    o.firstChild.src = img.src;
    o.addEventListener('click', close);
    document.body.appendChild(o);
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
</script>
HTML;

    public static function getSubscribedEvents(): array
    {
        return [
            'onPluginsInitialized'           => ['onPluginsInitialized', 0],
            PermissionsRegisterEvent::class => ['onRegisterPermissions', 0],
            'onFlexObjectBeforeSave'         => ['onFlexObjectBeforeSave', 0],
            'onFlexObjectAfterSave'          => ['onFlexObjectAfterSave', 0],
            'onFlexObjectAfterDelete'        => ['clearCache', 0],
            'onApiBeforeMediaUpload'         => ['onApiBeforeMediaUpload', 0],
            'onApiBlueprintResolved'         => ['onApiBlueprintResolved', 0],
            'onApiPageUpdated'               => ['onApiPageUpdated', 0],
        ];
    }

    public function onRegisterPermissions(PermissionsRegisterEvent $event): void
    {
        $event->permissions->addActions(PermissionsReader::fromYaml("plugin://{$this->name}/permissions.yaml"));
    }

    public function onPluginsInitialized(): void
    {
        if (!$this->config->get('plugins.admin2.enabled')) {
            return;
        }

        $route = '/' . trim((string) $this->config->get('plugins.admin2.route', '/admin'), '/');
        $path = $this->grav['uri']->path();
        if ($path !== $route && !str_starts_with($path, $route . '/')) {
            return;
        }

        // Admin Next has no hook for custom CSS/JS: it echoes the shell and
        // exits, which flushes this buffer. Only the HTML shell carries
        // __GRAV_CONFIG__, so JSON and assets under the route pass untouched.
        ob_start(static function (string $html): string {
            if (!str_contains($html, 'window.__GRAV_CONFIG__')) {
                return $html;
            }

            $inject = self::ADMIN_NEXT_CSS . self::ADMIN_NEXT_MENU_JS . self::ADMIN_NEXT_THUMBS;

            return preg_replace('~</head>~i', $inject . '</head>', $html, 1) ?? $html;
        });
    }

    /**
     * Admin Next shows or hides a `conditional` block from the form values, but
     * the API names its children under the block (`date_fields.date`) because
     * it only treats section/fieldset/tabs/columns as transparent. Grav itself
     * treats `conditional` as a container (`input@: false`), so the values must
     * stay top level: strip the block's prefix in Flex forms.
     */
    public function onApiBlueprintResolved($event): void
    {
        if (!str_starts_with((string) ($event['template'] ?? ''), 'flex-objects/')) {
            return;
        }
        $event['fields'] = $this->unprefixConditionals((array) $event['fields']);
    }

    private function unprefixConditionals(array $fields): array
    {
        foreach ($fields as $i => $field) {
            if (!is_array($field) || empty($field['fields']) || !is_array($field['fields'])) {
                continue;
            }
            if (($field['type'] ?? '') === 'conditional') {
                $prefix = $field['name'] . '.';
                foreach ($field['fields'] as $j => $child) {
                    if (is_array($child) && str_starts_with((string) ($child['name'] ?? ''), $prefix)) {
                        $field['fields'][$j]['name'] = substr($child['name'], strlen($prefix));
                    }
                }
            }
            $field['fields'] = $this->unprefixConditionals($field['fields']);
            $fields[$i] = $field;
        }

        return $fields;
    }

    /**
     * The photo order (header.media_order) is a property of the folder, but
     * Grav keeps it in each language's file, so reordering the gallery in
     * Catalan left Spanish in the old order. When a page is saved, copy its
     * media_order to its other language files. An empty order is not copied.
     */
    public function onApiPageUpdated($event): void
    {
        $page = $event['page'] ?? null;
        $own = $page ? (string) $page->filePath() : '';
        $order = $page ? ($page->header()->media_order ?? null) : null;
        if ($own === '' || !is_string($order) || trim($order) === '') {
            return;
        }

        // gallery.ca.md → gallery; siblings are gallery.md and gallery.<lang>.md
        $base = preg_replace('~(\.[a-z]{2}(-[a-z]{2})?)?\.md$~i', '', Utils::basename($own));
        $dir = dirname($own);
        foreach (scandir($dir) ?: [] as $name) {
            $path = $dir . '/' . $name;
            if ($path === $own || !preg_match('~^' . preg_quote($base, '~') . '(\.[a-z]{2}(-[a-z]{2})?)?\.md$~i', $name)) {
                continue;
            }
            $file = \Grav\Common\File\CompiledMarkdownFile::instance($path);
            $header = (array) $file->header();
            if (($header['media_order'] ?? null) !== $order) {
                $header['media_order'] = $order;
                $file->header($header);
                $file->save();
            }
            $file->free();
        }
    }

    public function onFlexObjectBeforeSave($event): void
    {
        $object = $event['object'] ?? null;
        $type = $object && method_exists($object, 'getFlexType') ? $object->getFlexType() : null;
        if ($type === 'actuacions') {
            $this->applyEmptiedLists($object);
            $this->appendUploadedPhotos($object);
            $this->nameGalleryRows($object);
        } elseif ($type === 'concerts') {
            $this->requireConcertDate($object);
        }
    }

    /**
     * Removing every row of a list (all the photos, all the videos) sends it
     * as []. FlexObject::update() flattens the data into field => value pairs,
     * an empty list yields none, so the stored rows stayed and came back on
     * reload. The API fires nothing before update(), so read the request body
     * (php://input can be read again) and empty those lists here.
     */
    private function applyEmptiedLists($object): void
    {
        if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['PATCH', 'PUT', 'POST'], true)
            || !str_contains((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'json')) {
            return;
        }
        $body = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($body)) {
            return;
        }
        foreach ($body as $field => $value) {
            if ($value === [] && is_string($field) && !empty($object->getProperty($field))) {
                $object->setProperty($field, []);
            }
        }
    }

    /**
     * An upcoming concert may be saved without a date only when it is marked
     * "Data per determinar"; otherwise a missing date is a slip. The blueprint
     * cannot make the date conditionally required (Grav would enforce it even
     * while the field is hidden), so it is checked here.
     */
    private function requireConcertDate($object): void
    {
        if ($object->getProperty('date_tbd') || trim((string) $object->getProperty('date')) !== '') {
            return;
        }
        $message = $this->grav['language']->translate(['SITE.CONCERTS.DATE_REQUIRED']);
        throw new \Grav\Plugin\Api\Exceptions\ValidationException(
            $message !== 'SITE.CONCERTS.DATE_REQUIRED' ? $message : 'Posa la data del concert o marca «Data per determinar».'
        );
    }

    /**
     * "Pujar diverses fotos" takes many files at once, but the order and the
     * captions live in the "Fotos" rows (one file each, so they can be
     * dragged). Move every uploaded file not yet in a row to a new row at the
     * end, in natural file-name order (…-002 before …-010), and empty the field.
     */
    private function appendUploadedPhotos($object): void
    {
        $uploads = (array) ($object->getProperty('gallery_upload') ?? []);
        if ($uploads === []) {
            return;
        }

        $gallery = array_values((array) ($object->getProperty('gallery') ?? []));
        $taken = $this->galleryFiles($object);

        uksort($uploads, static fn ($a, $b) => strnatcasecmp(Utils::basename((string) $a), Utils::basename((string) $b)));
        foreach ($uploads as $key => $file) {
            if (!isset($taken[Utils::basename((string) $key)])) {
                $gallery[] = ['image' => [$key => $file]];
            }
        }

        $object->setProperty('gallery', $gallery);
        $object->setProperty('gallery_upload', []);
    }

    /**
     * Admin Next titles a folded list row with its first non-empty text value,
     * and a photo is not text, so every "Fotos" row would read "Item". Copy
     * the file name into the row's `name`, first, so folded rows say which
     * photo they hold.
     */
    private function nameGalleryRows($object): void
    {
        $gallery = $object->getProperty('gallery');
        if (!is_array($gallery)) {
            return;
        }

        foreach ($gallery as $i => $row) {
            $row = (array) $row;
            $file = array_key_first((array) ($row['image'] ?? []));
            // A row whose photo was removed with its ✕ (or never picked) has
            // nothing to show: drop it rather than keep an empty "Item".
            if ($file === null) {
                unset($gallery[$i]);
                continue;
            }
            unset($row['name']);
            $gallery[$i] = ['name' => Utils::basename((string) $file)] + $row;
        }
        $object->setProperty('gallery', array_values($gallery));
    }

    public function onFlexObjectAfterSave($event): void
    {
        $this->pruneActuacioPhotos($event['object'] ?? null);
        $this->clearCache();
    }

    /**
     * Drop Grav's data cache (page content, Flex indexes) so the home page
     * shows the change. Not Cache::clearCache(): that also empties cache://,
     * where the API keeps the records it builds admin thumbnails from, so
     * every thumbnail on the edit page went 404 right after saving.
     */
    public function clearCache(): void
    {
        $this->grav['cache']->deleteAll();
    }

    /**
     * Admin Next does not pass the field's avoid_overwriting to uploads made
     * from a list row, so a photo named like an existing one (IMG_0001.jpg
     * from two phones) would silently replace it. Refuse the upload instead,
     * but only when a saved row uses that file: one uploaded and then left
     * unsaved stays in the folder unseen (it goes on the next save), and
     * uploading it again has to work.
     */
    public function onApiBeforeMediaUpload($event): void
    {
        $path = $this->actuacioFolder($event['object'] ?? null);
        $name = Utils::basename((string) ($event['filename'] ?? ''));
        if ($path !== null && $name !== '' && is_file($path . '/' . $name)
            && isset($this->galleryFiles($event['object'])[$name])) {
            throw new \Grav\Plugin\Api\Exceptions\ConflictException(
                "Aquesta actuació ja té una foto que es diu «{$name}». Canvia-li el nom al fitxer i torna-la a pujar."
            );
        }
    }

    /**
     * File names the actuació's "Fotos" rows point to, as keys.
     *
     * @return array<string, true>
     */
    private function galleryFiles($object): array
    {
        $names = [];
        foreach ((array) ($object->getProperty('gallery') ?? []) as $row) {
            foreach (array_keys((array) ($row['image'] ?? [])) as $name) {
                $names[Utils::basename((string) $name)] = true;
            }
        }

        return $names;
    }

    /**
     * Absolute path of an actuació's own folder (its item.json and photos), or
     * null for any other object. getMediaFolder() returns a stream
     * (user-data://...) or a path relative to the Grav root, as
     * FlexApiController::resolveMediaFolder() handles it.
     */
    private function actuacioFolder($object): ?string
    {
        if (!$object || !method_exists($object, 'getFlexType') || $object->getFlexType() !== 'actuacions') {
            return null;
        }

        $folder = (string) $object->getMediaFolder();
        if ($folder === '') {
            return null;
        }
        $locator = $this->grav['locator'];
        $path = $locator->isStream($folder)
            ? $locator->findResource($folder, true)
            : (str_starts_with($folder, '/') ? $folder : GRAV_ROOT . '/' . $folder);

        return $path && is_dir($path) ? $path : null;
    }

    /**
     * Admin Next uploads each "Fotos" row of an actuació into the object's own
     * folder the moment it is picked, but removing the row (or its image) only
     * drops the reference: the file stays on disk. On save, every row still in
     * the list is referenced, so delete the images in that folder that no row
     * points to, with their .meta.yaml sidecars. Photos cannot be shared
     * between actuacions or picked from elsewhere, so nothing else uses them.
     */
    private function pruneActuacioPhotos($object): void
    {
        $path = $this->actuacioFolder($object);
        if ($path === null) {
            return;
        }

        $keep = $this->galleryFiles($object);

        // scandir, not glob(GLOB_BRACE): musl (Alpine) builds lack GLOB_BRACE.
        $images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
        foreach (scandir($path) ?: [] as $name) {
            $file = $path . '/' . $name;
            if (isset($keep[$name]) || !is_file($file)
                || !in_array(strtolower(pathinfo($name, PATHINFO_EXTENSION)), $images, true)) {
                continue;
            }
            @unlink($file);
            if (is_file($file . '.meta.yaml')) {
                @unlink($file . '.meta.yaml');
            }
        }
    }
}
