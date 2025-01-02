'use strict';

const net = require('net');
const crypto = require('crypto');
const PORT = 3000;

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const server = net.createServer((socket) => {
  console.log('Client connected');

  socket.on('data', (data) => {
    const clientHello = data.toString();
    console.log(`Received from client "hello": ${clientHello}`);

    const serverHello = crypto.randomBytes(16).toString('hex');
    console.log(`Send to client "hello": ${serverHello}`);
    socket.write(
      JSON.stringify({
        serverHello,
        publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
      })
    );
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
