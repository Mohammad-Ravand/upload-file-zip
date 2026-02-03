<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$kernel->bootstrap();

use App\Events\EditorUpdated;
use App\Models\EditorContent;

echo "=== WebSocket Diagnostic Test ===\n\n";

// Check config
echo "1. Checking configuration...\n";
echo "   Broadcast driver: " . config('broadcasting.default') . "\n";
echo "   Pusher host: " . config('broadcasting.connections.pusher.options.host') . "\n";
echo "   Pusher port: " . config('broadcasting.connections.pusher.options.port') . "\n";
echo "   Pusher app_id: " . config('broadcasting.connections.pusher.app_id') . "\n";
echo "   Pusher scheme: " . config('broadcasting.connections.pusher.options.scheme') . "\n\n";

// Check if WebSocket server is reachable
echo "2. Testing WebSocket server connection...\n";
$wsHost = config('broadcasting.connections.pusher.options.host');
$wsPort = config('broadcasting.connections.pusher.options.port');
$testUrl = "http://{$wsHost}:{$wsPort}/";

$ch = curl_init($testUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 2);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "   ✅ WebSocket server is reachable at {$testUrl}\n";
} else {
    echo "   ❌ WebSocket server NOT reachable at {$testUrl} (HTTP {$httpCode})\n";
    echo "   Make sure 'node websocket-server.js' is running!\n\n";
    exit(1);
}

// Get a document
echo "\n3. Testing broadcast...\n";
$doc = EditorContent::find(10);
if (!$doc) {
    echo "   ❌ Document ID 10 not found. Creating test document...\n";
    $doc = EditorContent::create([
        'title' => 'Test Document',
        'content_json' => json_encode(['type' => 'doc', 'content' => [['type' => 'paragraph']]])
    ]);
    echo "   ✅ Created document ID: {$doc->id}\n";
}

echo "   Document ID: {$doc->id}\n";
echo "   Channel: editor-{$doc->id}\n";
echo "   Sending broadcast...\n";

try {
    $event = new EditorUpdated(
        $doc->id,
        $doc->title,
        $doc->content_json,
        null
    );
    
    echo "   Event channel: " . $event->broadcastOn()[0]->name . "\n";
    echo "   Event name: " . $event->broadcastAs() . "\n";
    echo "   Event data: " . json_encode($event->broadcastWith()) . "\n\n";
    
    broadcast($event);
    echo "   ✅ Broadcast sent!\n";
    echo "\n   👀 NOW CHECK YOUR WEBSOCKET SERVER TERMINAL!\n";
    echo "   You should see:\n";
    echo "   - 🌐 POST /apps/local/events\n";
    echo "   - 📤 Broadcasting to channels: editor-{$doc->id}\n";
    echo "   - ➡️ Sent event editor.updated\n\n";
    
} catch (\Exception $e) {
    echo "   ❌ Broadcast failed: " . $e->getMessage() . "\n";
    echo "   Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

echo "=== Diagnostic Complete ===\n";
echo "\nNext steps:\n";
echo "1. Check WebSocket server terminal for the POST request\n";
echo "2. Open two browsers to /editor/{$doc->id}/edit\n";
echo "3. Make changes in one browser\n";
echo "4. Check if updates appear in the other browser\n";

