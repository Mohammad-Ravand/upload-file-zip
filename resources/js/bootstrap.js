import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Configure Pusher for local development
window.Pusher = Pusher;

// Enable Pusher logging in development for debugging
Pusher.logToConsole = true;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: 'local',
    cluster: 'mt1',
    scheme: 'http',
    wsHost: window.location.hostname,
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    enabledTransports: ['ws'],
    disableStats: true,
});

console.log('✅ Laravel Echo initialized with local WebSocket server on ws://localhost:6001');
