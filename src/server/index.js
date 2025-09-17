const http = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT || process.env.SOCKET_PORT || '3000', 10);
const host = '0.0.0.0';

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    return handle(req, res);
  });

  // attach socket.io
  const io = new Server(server, {
    // optional config
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('ping', (payload) => {
      socket.emit('pong', payload);
    });
    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);
    });
  });

  server.listen(port, host, (err) => {
    if (err) {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
    console.log(`> Server listening on http://${host}:${port} (dev=${dev})`);
  });
});
