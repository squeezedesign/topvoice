<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;

class TopvoiceHooksPlugin extends Plugin
{
    public static function getSubscribedEvents(): array
    {
        return [
            'onFlexObjectAfterSave'   => ['clearCache', 0],
            'onFlexObjectAfterDelete' => ['clearCache', 0],
        ];
    }

    public function clearCache(): void
    {
        \Grav\Common\Cache::clearCache();
    }
}
