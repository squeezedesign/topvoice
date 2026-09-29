<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;

/**
 * Ships languages/ca.yaml only: Admin Next has no Catalan of its own, and the
 * API's translation index picks up any enabled plugin's languages/<lang>.yaml,
 * so no events are needed.
 */
class Admin2CaPlugin extends Plugin
{
}
