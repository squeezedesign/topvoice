<?php
/**
 * One-off: the home gallery used to keep each photo's alt and caption in a
 * "gallery_items" list in the page header, matched by file name. They now
 * live in each photo's .meta.yaml, which Admin Next edits from the media
 * panel. Copy the list into the sidecars, without overwriting a value that is
 * already there. Catalan wins over Spanish when both have one.
 *
 *   php user/plugins/topvoice-hooks/cli/migrate-gallery-meta.php
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__, 4) . '/vendor/autoload.php';

use Symfony\Component\Yaml\Yaml;

$dir = dirname(__DIR__, 3) . '/pages/01.home/_05.gallery';

$rows = [];
foreach (['ca', 'es'] as $lang) {
    $md = @file_get_contents("{$dir}/gallery.{$lang}.md");
    if ($md === false || !preg_match('/^---\R(.*?)\R---/s', $md, $m)) {
        continue;
    }
    foreach ((array) (Yaml::parse($m[1])['gallery_items'] ?? []) as $row) {
        $file = basename((string) ($row['file'] ?? ''));
        foreach (['alt', 'title'] as $key) {
            $value = trim((string) ($row[$key] ?? ''));
            if ($file !== '' && $value !== '' && !isset($rows[$file][$key])) {
                $rows[$file][$key] = $value;
            }
        }
    }
}

foreach ($rows as $file => $values) {
    if (!is_file("{$dir}/{$file}")) {
        echo "{$file}: no existeix, saltada\n";
        continue;
    }
    $metaPath = "{$dir}/{$file}.meta.yaml";
    $meta = is_file($metaPath) ? (array) Yaml::parseFile($metaPath) : [];
    $changed = false;
    foreach ($values as $key => $value) {
        if (trim((string) ($meta[$key] ?? '')) === '') {
            $meta[$key] = $value;
            $changed = true;
        }
    }
    if ($changed) {
        file_put_contents($metaPath, Yaml::dump($meta, 2, 2));
    }
    echo $file . ': ' . ($changed ? 'copiada' : 'ja tenia dades') . "\n";
}
