<?php

require __DIR__ . '/vendor/autoload.php';

// Bootstrap the framework
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Events\EditorUpdated;
use App\Models\EditorContent;

$item = EditorContent::find(1);
if (! $item) {
    echo "No item with id 1\n";
    exit(1);
}

// Dispatch event
event(new EditorUpdated($item->id, $item->title, $item->content_json, null));

echo "Event dispatched for document {$item->id}\n";
