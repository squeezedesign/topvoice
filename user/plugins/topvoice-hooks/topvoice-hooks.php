<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
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

    public static function getSubscribedEvents(): array
    {
        return [
            'onPluginsInitialized'           => ['onPluginsInitialized', 0],
            PermissionsRegisterEvent::class => ['onRegisterPermissions', 0],
            'onFlexObjectAfterSave'          => ['clearCache', 0],
            'onFlexObjectAfterDelete'        => ['clearCache', 0],
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

            $inject = self::ADMIN_NEXT_CSS . self::ADMIN_NEXT_MENU_JS;

            return preg_replace('~</head>~i', $inject . '</head>', $html, 1) ?? $html;
        });
    }

    public function clearCache(): void
    {
        \Grav\Common\Cache::clearCache();
    }
}
