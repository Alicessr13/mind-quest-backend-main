import { app } from './app';

app.listen({
    host: '0.0.0.0',
    port: 3333,
}).then(() => {
    console.log('----------------------------------------');
    console.log('HTTP server running on 0.0.0.0:3333 🔥🚀');
    console.log('----------------------------------------');
});
