#!/usr/bin/env node

/**
 * Simple WebSocket Server for Pusher Simulation
 * This server simulates Pusher for local development
 */

import { WebSocketServer } from 'ws';
import http from 'http';
import url from 'url';

const PORT = 6001;
const server = http.createServer();
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

      if (data.event === 'pusher:subscribe') {
        const channelName = data.data.channel;
        ws.subscribedChannels.add(channelName);

        if (!channels.has(channelName)) {
          channels.set(channelName, new Set());
        }
        channels.get(channelName).add(ws);

        console.log(`📡 ${clientId} subscribed to: ${channelName}`);

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
