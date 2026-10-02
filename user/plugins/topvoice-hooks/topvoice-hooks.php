<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;

class TopvoiceHooksPlugin extends Plugin
{
    /**
     * Admin Next's login and setup screens open with a "Server configuration"
     * panel (server URL + environment) meant for driving remote Grav installs.
     * Here the admin only ever talks to this site, so the panel just confuses.
     * The shell offers no hook for custom CSS: it echoes the page and exits.
     * The panel is the block right before the form holding #username.
     */
    private const ADMIN_NEXT_CSS = '<style>div:has(+ form #username){display:none!important}</style>';

    public static function getSubscribedEvents(): array
    {
        return [
            'onPluginsInitialized'    => ['onPluginsInitialized', 0],
            'onFlexObjectAfterSave'   => ['clearCache', 0],
            'onFlexObjectAfterDelete' => ['clearCache', 0],
        ];
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

        // Flushed on exit(); only the HTML shell carries __GRAV_CONFIG__, so
        // JSON and asset responses under the admin route pass through untouched.
        ob_start(static function (string $html): string {
            if (!str_contains($html, 'window.__GRAV_CONFIG__')) {
                return $html;
            }

            return preg_replace('~</head>~i', self::ADMIN_NEXT_CSS . '</head>', $html, 1) ?? $html;
        });
    }

    public function clearCache(): void
    {
        \Grav\Common\Cache::clearCache();
    }
}
