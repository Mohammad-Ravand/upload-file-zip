#!/usr/bin/env node

/**
 * Simple WebSocket Server for Pusher Simulation
 * This server simulates Pusher for local development
 */

import { WebSocketServer } from 'ws';
import http from 'http';
import url from 'url';

const PORT = 6001;
const server = http.createServer((req, res) => {
  // Simple HTTP endpoint to accept Pusher-style event posts from server-side
  // clients (e.g. pusher-php-server). Accept POST /apps/:appId/events
  try {
    const parsed = url.parse(req.url, true)
    if (req.method === 'POST' && /\/apps\/[^\/]+\/events/.test(parsed.pathname)) {
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', () => {
        let payload
        try {
          payload = JSON.parse(body)
        } catch (err) {
          console.warn('⚠️ HTTP POST received with non-JSON body:', body.substring(0, 1000))
          try {
            // attempt to parse query-string style payload
            const params = new URLSearchParams(body)
            const dataStr = params.get('data') || params.get('payload')
            payload = dataStr ? JSON.parse(dataStr) : Object.fromEntries(params.entries())
          } catch (err2) {
            res.writeHead(400)
            res.end('Invalid JSON')
            return
          }
        }

        // payload typically contains: name, channels, data
        const eventName = payload.name || payload.event
        let channelsList = payload.channels || payload.channel || []
        let eventData = payload.data || payload

        // Normalize channelsList to an array
        if (typeof channelsList === 'string' && channelsList.length) {
          channelsList = [channelsList]
        }
        if (!Array.isArray(channelsList)) {
          channelsList = []
        }

        // If data is a JSON string, attempt to parse
        if (typeof eventData === 'string') {
          try { eventData = JSON.parse(eventData) } catch (e) { /* leave as string */ }
        }

        channelsList.forEach((channelName) => {
          if (channels.has(channelName)) {
            channels.get(channelName).forEach((client) => {
              try {
                if (client.readyState === 1) {
                  const payloadOut = { event: eventName, channel: channelName, data: eventData }
                  client.send(JSON.stringify(payloadOut))
                  console.log(`➡️ Sent event ${eventName} to client ${client.clientId || 'unknown'} on ${channelName}`)
                }
              } catch (err) {
                console.error('Failed to send to client:', err.message)
              }
            })
          } else {
            console.log(`ℹ️ No subscribers for channel ${channelName}`)
          }
        })

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok' }))
        console.log(`🌐 HTTP POST -> broadcast ${eventName} to ${channelsList.join(',')}`)
      })
      return
    }
  } catch (err) {
    // fall through to default
  }

  // default health endpoint
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('WebSocket Pusher simulator')
    return
  }

  res.writeHead(404)
  res.end()
});
const wss = new WebSocketServer({ server });

const channels = new Map();
let connectionCount = 0;

wss.on('connection', (ws, req) => {
  connectionCount++;
  const clientId = Math.random().toString(36).substring(7);
  console.log(`✅ Client connected: ${clientId} (total: ${connectionCount})`);

  ws.clientId = clientId;
  ws.subscribedChannels = new Set();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Log all messages received (debug)
      console.log(`📩 Message from ${clientId}: ${data.event || 'unknown'} - ${JSON.stringify(data).substring(0, 100)}`)

      if (data.event === 'pusher:subscribe') {
        const channelName = data.data.channel;
        ws.subscribedChannels.add(channelName);

        if (!channels.has(channelName)) {
          channels.set(channelName, new Set());
        }
        channels.get(channelName).add(ws);

        console.log(`📡 ✅ ${clientId} subscribed to: ${channelName}`);

        // Send subscription confirmation
        ws.send(JSON.stringify({
          event: 'pusher_internal:subscription_succeeded',
          channel: channelName,
        }));
      } else if (data.event === 'pusher:unsubscribe') {
        const channelName = data.data.channel;
        ws.subscribedChannels.delete(channelName);

        if (channels.has(channelName)) {
          channels.get(channelName).delete(ws);
        }

        console.log(`📡 ${clientId} unsubscribed from: ${channelName}`);
      } else if (data.event) {
        // Broadcast event to all subscribers in the channel
        const channelName = data.channel;
        console.log(`📢 Broadcasting event "${data.event}" on channel "${channelName}"`);

        if (channels.has(channelName)) {
          channels.get(channelName).forEach((client) => {
            if (client.readyState === 1 && client !== ws) { // 1 = OPEN
              client.send(JSON.stringify(data));
            }
          });
        }
      }
    } catch (err) {
      console.error('Error processing message:', err.message);
    }
  });

  ws.on('close', () => {
    connectionCount--;
    console.log(`❌ Client disconnected: ${clientId} (total: ${connectionCount})`);

    // Remove from all channels
    channels.forEach((clients, channel) => {
      clients.delete(ws);
      if (clients.size === 0) {
        channels.delete(channel);
      }
    });
  });

  ws.on('error', (error) => {
    console.error(`Error for client ${clientId}:`, error.message);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 WebSocket Server running on ws://localhost:${PORT}`);
  console.log(`   Simulating Pusher for local development`);
  console.log(`   Waiting for connections...\n`);
});
