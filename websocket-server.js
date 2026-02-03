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
  // Log ALL incoming requests for debugging
  console.log(`\n🌐 ${req.method} ${req.url} from ${req.socket.remoteAddress || 'unknown'}`)
  
  // Simple HTTP endpoint to accept Pusher-style event posts from server-side
  // clients (e.g. pusher-php-server). Accept POST /apps/:appId/events
  try {
    const parsed = url.parse(req.url, true)
    
    // Debug: log the pathname pattern match
    const isEventsEndpoint = /\/apps\/[^\/]+\/events/.test(parsed.pathname)
    console.log(`   Path: ${parsed.pathname}, Method: ${req.method}, Matches events pattern: ${isEventsEndpoint}`)
    
    if (req.method === 'POST' && isEventsEndpoint) {
      console.log(`✅ Processing broadcast request to ${parsed.pathname}`)
      console.log(`   Content-Type: ${req.headers['content-type'] || 'not set'}`)
      
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', () => {
        console.log(`   Raw body (first 500 chars): ${body.substring(0, 500)}`)
        
        let payload
        const contentType = req.headers['content-type'] || ''
        
        // Laravel Pusher driver sends form-encoded data, not JSON
        if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
          try {
            // Parse form-encoded data
            const params = new URLSearchParams(body)
            payload = {}
            
            // Extract fields
            const name = params.get('name') || params.get('event')
            const channels = params.get('channels') || params.get('channel')
            const data = params.get('data')
            const socketId = params.get('socket_id')
            
            if (name) payload.name = name
            if (channels) {
              // Channels might be JSON string or comma-separated
              try {
                payload.channels = JSON.parse(channels)
              } catch {
                payload.channels = channels.split(',').map(c => c.trim())
              }
            }
            if (data) {
              // Data is usually a JSON string
              try {
                payload.data = JSON.parse(data)
              } catch {
                payload.data = data
              }
            }
            if (socketId) payload.socket_id = socketId
            
            console.log(`   Parsed form data: name=${payload.name}, channels=${JSON.stringify(payload.channels)}`)
          } catch (err) {
            console.error('❌ Failed to parse form data:', err.message)
            res.writeHead(400)
            res.end('Invalid form data')
            return
          }
        } else {
          // Try JSON
          try {
            payload = JSON.parse(body)
          } catch (err) {
            console.warn('⚠️ HTTP POST received with non-JSON body, trying form-encoded:', body.substring(0, 200))
            try {
              // attempt to parse query-string style payload
              const params = new URLSearchParams(body)
              const dataStr = params.get('data') || params.get('payload')
              payload = dataStr ? JSON.parse(dataStr) : Object.fromEntries(params.entries())
            } catch (err2) {
              console.error('❌ Failed to parse body:', err2.message)
              res.writeHead(400)
              res.end('Invalid request body')
              return
            }
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

        console.log(`📤 Broadcasting to channels: ${channelsList.join(', ')}`)
        console.log(`   Event: ${eventName}`)
        console.log(`   Data keys: ${Object.keys(eventData || {}).join(', ')}`)
        
        channelsList.forEach((channelName) => {
          if (channels.has(channelName)) {
            const subscribers = channels.get(channelName)
            console.log(`   Channel ${channelName} has ${subscribers.size} subscriber(s)`)
            subscribers.forEach((client) => {
              try {
                if (client.readyState === 1) {
                  const payloadOut = { event: eventName, channel: channelName, data: eventData }
                  client.send(JSON.stringify(payloadOut))
                  console.log(`   ➡️ Sent event ${eventName} to client ${client.clientId || 'unknown'} on ${channelName}`)
                } else {
                  console.log(`   ⚠️ Client ${client.clientId} not ready (state: ${client.readyState})`)
                }
              } catch (err) {
                console.error(`   ❌ Failed to send to client ${client.clientId}:`, err.message)
              }
            })
          } else {
            console.log(`   ℹ️ No subscribers for channel ${channelName} (available channels: ${Array.from(channels.keys()).join(', ') || 'none'})`)
          }
        })

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok' }))
        console.log(`✅ HTTP POST processed: ${eventName} -> ${channelsList.join(',')}`)
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

  // Log unhandled requests
  console.log(`⚠️ Unhandled request: ${req.method} ${req.url}`)
  res.writeHead(404)
  res.end('Not found')
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
