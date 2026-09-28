<?php
namespace Grav\Theme;

use Grav\Common\Theme;
use Grav\Common\Utils;

class Topvoice extends Theme
{
    public static function getSubscribedEvents(): array
    {
        return [
            'onTwigExtensions' => ['onTwigExtensions', 0],
        ];
    }

    /**
     * `{{ 'css/style.css'|theme_asset }}` → the theme URL of that file with
     * `?v=<mtime>`. The theme's CSS/JS are linked by hand (not through Assets)
     * and served without cache headers, so browsers kept stale copies after
     * each upload; the mtime changes the URL whenever the file does.
     */
    public function onTwigExtensions(): void
    {
        $this->grav['twig']->twig()->addFilter(
            new \Twig\TwigFilter('theme_asset', [$this, 'themeAsset'])
        );
    }

    public function themeAsset(string $path): string
    {
        $path = ltrim($path, '/');
        $url  = Utils::url('theme://' . $path);
        $file = $this->grav['locator']->findResource('theme://' . $path, true);

        return $file ? $url . '?v=' . filemtime($file) : $url;
    }
}
