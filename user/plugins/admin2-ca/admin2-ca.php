<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;

/**
 * Ships languages/ca.yaml: Admin Next has no Catalan of its own, and the API's
 * translation index picks up any enabled plugin's languages/<lang>.yaml.
 *
 * The language picker, though, lists only the files in admin2/languages/, so
 * Catalan works but cannot be selected. Keep an empty ca.yaml there to put it
 * on the list; admin2 updates replace that folder, hence the check per request.
 */
class Admin2CaPlugin extends Plugin
{
    public static function getSubscribedEvents(): array
    {
        return [
            'onPluginsInitialized' => ['ensurePickerEntry', 0],
        ];
    }

    public function ensurePickerEntry(): void
    {
        // No admin2 (still on Grav 1.7, or admin2 removed): nothing to list.
        $dir = $this->grav['locator']->findResource('plugins://admin2/languages', true);
        if (!$dir || is_file($dir . '/ca.yaml') || !is_writable($dir)) {
            return;
        }

        @file_put_contents(
            $dir . '/ca.yaml',
            "# Placeholder so Catalan shows in the Admin Next language picker.\n"
            . "# The strings live in user/plugins/admin2-ca/languages/ca.yaml.\n"
            . "{}\n"
        );
    }
}
