import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Configure Pusher for local development
window.Pusher = Pusher;

// Enable Pusher logging in development for debugging
Pusher.logToConsole = true;

// Determine WebSocket host - use 127.0.0.1 for localhost connections
const wsHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '127.0.0.1' 
    : window.location.hostname;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: 'local',
    cluster: 'mt1',
    scheme: 'http',
    wsHost: wsHost,
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: '/broadcasting/auth', // Not needed for public channels but good to have
});

console.log(`✅ Laravel Echo initialized with WebSocket server on ws://${wsHost}:6001`);
