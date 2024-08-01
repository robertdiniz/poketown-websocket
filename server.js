const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const users = {};
const rooms = {};

// Envia atualizações para todos os clientes na sala
function broadcastRoom(room) {
  io.to(room).emit('update', { users: rooms[room] });
}

io.on('connection', (socket) => {
  console.log(`${socket.id} LOG:USER_CONNECTED`);

  let currentRoom = null;

  socket.on('joinRoom', (roomName) => {
    currentRoom = roomName;

    if (!rooms[roomName]) {
      rooms[roomName] = {};
    }
    
    rooms[roomName][socket.id] = {id: socket.id, x: 300, y: 100, name: `${socket.id}`};

    socket.join(roomName);
    broadcastRoom(roomName);
    socket.emit('update', { users: rooms[roomName] });
  });

  socket.on('setName', (name) => {
    if (currentRoom && rooms[currentRoom][socket.id]) {
      rooms[currentRoom][socket.id].name = name.name;
      broadcastRoom(currentRoom);
    }
  });

  socket.on('move', (data) => {
    if (currentRoom && rooms[currentRoom][socket.id]) {
      rooms[currentRoom][socket.id].x += data.dx;
      rooms[currentRoom][socket.id].y += data.dy;
      broadcastRoom(currentRoom);
    }
  });

  socket.on('sendMessage', (data) => {
    if (currentRoom) {
      io.to(currentRoom).emit('receiveMessage', { id: socket.id, message: data.message });
    }
  });

  socket.on('updatePokemonImage', (data) => {
    if (currentRoom && rooms[currentRoom][socket.id]) {
      rooms[currentRoom][socket.id].imageUrl = data.imageUrl;
      broadcastRoom(currentRoom);
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} LOG:USER_DISCONNECTED`);
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom][socket.id];
      broadcastRoom(currentRoom);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
