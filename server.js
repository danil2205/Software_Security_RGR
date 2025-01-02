'use strict';

const net = require('net');
const crypto = require('crypto');
const PORT = 3000;

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

let sessionKey;

const server = net.createServer((socket) => {
  console.log('Client connected');

  let serverHello = null;
  let premaster = null;

  socket.on('data', (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === 'hello') {
      const clientHello = message.data
      socket.clientHello = clientHello;
      console.log(`Received from client "hello": ${clientHello}`);

      serverHello = crypto.randomBytes(16).toString('hex');
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

      const hash = crypto.createHash('sha256');
      hash.update(socket.clientHello + serverHello + premaster);
      sessionKey = hash.digest('hex');
      console.log(`Created session key: ${sessionKey}`);

      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(sessionKey, 'hex'),
        Buffer.alloc(16, 0)
      );
      let encryptedReady = cipher.update('ready', 'utf8', 'hex');
      encryptedReady += cipher.final('hex');
      socket.write(JSON.stringify({ type: 'ready', data: encryptedReady }));

      console.log('Sent to client a message "ready"');
    } else if (message.type === 'clientReady') {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(sessionKey, 'hex'),
        Buffer.alloc(16, 0)
      );
      let decryptedMessage = decipher.update(message.data, 'hex', 'utf8');
      decryptedMessage += decipher.final('utf8');

      if (decryptedMessage === 'ready') {
        console.log('Received encrypted "ready" message from client');
      }
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
