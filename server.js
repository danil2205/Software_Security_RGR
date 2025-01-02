'use strict';

const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const { decryptMessage, encryptMessage } = require('./utils.js');
const PORT = 3000;

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

let sessionKey;

const server = net.createServer((socket) => {
  console.log('Client connected');

  let serverHello = null;

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

      const encryptedReady = encryptMessage(sessionKey, 'ready');
      socket.write(JSON.stringify({ type: 'ready', data: encryptedReady }));
      console.log('Sent to client a message "ready"');
    } else if (message.type === 'clientReady') {
      const decryptedMessage = decryptMessage(sessionKey, message.data);
      if (decryptedMessage === 'ready') {
        console.log('Received encrypted "ready" message from client');
      }
    } else if (message.type === 'secureMessage') {
      const decryptedMessage = decryptMessage(sessionKey, message.data);
      console.log(`Received message from client: ${decryptedMessage}`);

      const response = `Server got: ${decryptedMessage}`;
      const encryptedResponse = encryptMessage(sessionKey, response);
      socket.write(JSON.stringify({ type: 'secureMessage', data: encryptedResponse }));
      console.log('Sent encrypted message to client');
    } else if (message.type === 'encryptedFile') {
      const decryptedFileContent = decryptMessage(sessionKey, message.data);
      const outputFilePath = `./${message.fileName}`;
      fs.writeFileSync(outputFilePath, decryptedFileContent, 'utf8');
      console.log(`Saved encrypted file to ${outputFilePath}`);
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
