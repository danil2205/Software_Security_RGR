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
    const message = JSON.parse(data.toString());

    if (message.type === 'hello') {
      console.log(`Received from client "hello": ${message.data}`);

      const serverHello = crypto.randomBytes(16).toString('hex');
      console.log(`Send to client "hello": ${serverHello}`);
      socket.write(
        JSON.stringify({
          type: 'serverHello',
          data: {
            serverHello,
            publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
          },
        })
      );
    } else if (message.type === 'premaster') {
      const encryptedPremaster = message.data;
      console.log('Received encrypted premaster from client');

      const premaster = crypto.privateDecrypt(
        privateKey,
        Buffer.from(encryptedPremaster, 'hex')
      );

      console.log(`Decrypted premaster: ${premaster.toString('hex')}`);
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
