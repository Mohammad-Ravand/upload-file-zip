<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$kernel->bootstrap();

use App\Models\EditorContent;

$m = new EditorContent();
$m->title = 'test-script';
$m->content_json = json_encode(['type' => 'doc', 'content' => []]);
$m->save();

echo "saved id={$m->id}\n";
