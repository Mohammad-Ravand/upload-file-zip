# 🧪 Testing Live Editing - Step by Step

## Prerequisites

1. **Start Laravel Server** (Terminal 1):
   ```bash
   php artisan serve --host=127.0.0.1 --port=8000
   ```

2. **Start WebSocket Server** (Terminal 2):
   ```bash
   node websocket-server.js
   ```
   
   You should see:
   ```
   🚀 WebSocket Server running on ws://localhost:6001
   Simulating Pusher for local development
   Waiting for connections...
   ```

## Testing Steps

### Step 1: Open First Browser Window
1. Go to: `http://127.0.0.1:8000/editor/10/edit` (or any document ID)
2. Open browser console (F12)
3. Look for these messages:
   - `✅ Laravel Echo initialized with WebSocket server on ws://127.0.0.1:6001`
   - `📄 Document ID detected: 10`
   - `🔌 Connecting to WebSocket channel for document #10`
   - `✅ WebSocket real-time collaboration enabled for document #10`

### Step 2: Check WebSocket Server Terminal
You should see:
```
✅ Client connected: [random-id] (total: 1)
📩 Message from [id]: pusher:subscribe - ...
📡 ✅ [id] subscribed to: editor-10
```

### Step 3: Open Second Browser Window
1. Open a **different browser** or **incognito window**
2. Go to: `http://127.0.0.1:8000/editor/10/edit` (same document)
3. Check WebSocket server - should show 2 clients connected

### Step 4: Make Changes in First Window
1. Type some text in the editor
2. Wait 2 seconds for auto-save
3. Check WebSocket server terminal - you should see:
   ```
   🌐 POST /apps/local/events from 127.0.0.1
   ✅ Processing broadcast request to /apps/local/events
   📤 Broadcasting to channels: editor-10
      Event: editor.updated
      Channel editor-10 has 2 subscriber(s)
      ➡️ Sent event editor.updated to client [id] on editor-10
      ➡️ Sent event editor.updated to client [id] on editor-10
   ```

### Step 5: Check Second Window
- Content should update automatically
- Browser console should show: `📨 Received real-time update from another user:`
- A notification should appear: "✓ Document updated by another user"

## Troubleshooting

### If WebSocket server shows "No subscribers"
- Make sure both browsers are on the same document ID
- Check browser console for connection errors
- Verify WebSocket server shows both clients subscribed

### If no HTTP POST appears in WebSocket server
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Should see: `Broadcast sent for document`
- If not, the broadcast might be failing silently

### If clients don't receive updates
- Check WebSocket server shows: `➡️ Sent event editor.updated`
- Check browser console for: `📨 Received real-time update`
- Verify event name matches: `editor.updated`

### Test Broadcast Manually
```bash
php test_broadcast.php
```
This should trigger a broadcast and you should see it in WebSocket server terminal.

