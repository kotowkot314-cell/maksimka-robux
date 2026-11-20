const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const authRouter = require('./auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('client'));
app.use('/api', authRouter);

const players = {};

io.on('connection', (socket) => {
  console.log('[Xliilx] Подключился:', socket.id);

  socket.on('join', ({ username }) => {
    if (!username) return;
    players[socket.id] = {
      id: socket.id,
      username,
      x: 200 + Math.random() * 600,
      y: 200 + Math.random() * 400,
      hp: 100,
      angle: 0
    };
    socket.emit('init', { selfId: socket.id, players });
    socket.broadcast.emit('playerJoined', players[socket.id]);
  });

  socket.on('move', ({ x, y, angle }) => {
    if (!players[socket.id]) return;
    Object.assign(players[socket.id], { x, y, angle });
    socket.broadcast.emit('playerMoved', { id: socket.id, x, y, angle });
  });

  socket.on('shoot', ({ angle }) => {
    socket.broadcast.emit('playerShot', { id: socket.id, angle });
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
    console.log('[Xliilx] Отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log( Xliilx: http://localhost:${PORT}`));