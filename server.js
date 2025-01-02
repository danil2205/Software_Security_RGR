'use strict';

const net = require('net');
const PORT = 3000;

const server = net.createServer((socket) => {
  console.log('Client connected');

  socket.on('data', (data) => {
    const clientHello = data.toString();
    console.log(`Received from client: ${clientHello}`);
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
