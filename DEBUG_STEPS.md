# 🔍 Debugging Live Editing - Step by Step

## Critical: Check WebSocket Server Terminal

When you make a change in Browser 1, **IMMEDIATELY check your WebSocket server terminal**. You should see:

```
🌐 POST /apps/local/events from 127.0.0.1
   Path: /apps/local/events, Method: POST, Matches events pattern: true
✅ Processing broadcast request to /apps/local/events
   Content-Type: application/x-www-form-urlencoded
   Raw body (first 500 chars): name=editor.updated&channels=...
📤 Broadcasting to channels: editor-10
   Event: editor.updated
   Channel editor-10 has 2 subscriber(s)
   ➡️ Sent event editor.updated to client [id] on editor-10
```

## If You DON'T See POST Requests

If the WebSocket server terminal shows **NO POST requests** when you save, then Laravel isn't sending HTTP requests to the WebSocket server. This means:

1. **Check Laravel logs** - Do you see "Broadcast sent for document"?
   - If YES: Laravel thinks it sent, but HTTP request failed
   - If NO: Broadcast isn't being triggered

2. **Test manually**:
   ```bash
   php diagnose_websocket.php
   ```
   Then check WebSocket server terminal - do you see the POST request?

3. **Check if Pusher driver is actually sending**:
   - Laravel's Pusher driver might be failing silently
   - Check for errors in `storage/logs/laravel.log`

## If You DO See POST Requests But No Updates

If WebSocket server shows POST requests but Browser 2 doesn't update:

1. **Check Browser 2 console** (F12):
   - Do you see: `✅ Successfully subscribed to channel: editor-10`?
   - Do you see: `📨 Received real-time update from another user:`?
   - Any errors?

2. **Check WebSocket server shows subscribers**:
   - Should see: `Channel editor-10 has 2 subscriber(s)`
   - If it says "0 subscriber(s)", clients aren't connected

3. **Verify both browsers are on same document**:
   - Both should be: `http://127.0.0.1:8000/editor/10/edit`
   - Same document ID!

## Quick Test

1. Open Browser 1: `http://127.0.0.1:8000/editor/10/edit`
2. Open Browser 2: `http://127.0.0.1:8000/editor/10/edit`
3. In Browser 1 console, type: `window.Echo.connector.pusher.connection.state`
   - Should return: `"connected"`
4. In Browser 2 console, type: `window.Echo.connector.pusher.connection.state`
   - Should return: `"connected"`
5. Make a change in Browser 1
6. **IMMEDIATELY** check WebSocket server terminal
7. Check Browser 2 console for: `📨 Received real-time update`

## Common Issues

### Issue 1: WebSocket server not receiving POST requests
**Symptom**: No `🌐 POST /apps/local/events` in WebSocket terminal
**Solution**: Laravel's Pusher driver might not be configured correctly. Check `.env` file has:
```
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=local
PUSHER_APP_KEY=local
PUSHER_APP_SECRET=local
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001
PUSHER_SCHEME=http
```

### Issue 2: Clients not subscribed
**Symptom**: WebSocket server shows "0 subscriber(s)"
**Solution**: 
- Check browser console for connection errors
- Verify both browsers are on the same document ID
- Check WebSocket server shows: `📡 ✅ [id] subscribed to: editor-10`

### Issue 3: Events not matching
**Symptom**: POST requests arrive but no updates
**Solution**: Check event name matches. Should be `editor.updated` (not `EditorUpdated`)

## Next Steps

1. **Run the diagnostic**: `php diagnose_websocket.php`
2. **Check WebSocket server terminal** when you save
3. **Check browser console** in both browsers
4. **Share the output** from:
   - WebSocket server terminal (when you save)
   - Browser 1 console
   - Browser 2 console

