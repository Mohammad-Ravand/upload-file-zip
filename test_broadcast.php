<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$kernel->bootstrap();

use App\Events\EditorUpdated;
use App\Models\EditorContent;

// Get a document
$doc = EditorContent::first();
if (!$doc) {
    echo "No documents found. Create one first.\n";
    exit(1);
}

echo "Testing broadcast for document ID: {$doc->id}\n";
echo "Channel: editor-{$doc->id}\n\n";

try {
    broadcast(new EditorUpdated(
        $doc->id,
        $doc->title,
        $doc->content_json,
        null
    ));
    echo "✅ Broadcast sent successfully!\n";
    echo "Check WebSocket server terminal for: 📤 Broadcasting to channels\n";
} catch (\Exception $e) {
    echo "❌ Broadcast failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

