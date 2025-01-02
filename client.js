'use strict';

const net = require('net');
const crypto = require("crypto");

const clientHello = crypto.randomBytes(16).toString('hex');
let sessionKey;
let serverHello = null;

const client = net.createConnection({ port: 3000 }, () => {
  console.log('Connected to server');

  console.log(`Send to server "hello": ${clientHello}`);
  client.write(JSON.stringify({ type: 'hello', data: clientHello }));
});

client.on('data', (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === 'serverHello') {
    const { serverHello: sh, publicKey } = message.data;
    serverHello = sh;
    console.log(`Received from server "hello": ${serverHello}`);
    console.log(`Received server public key:\n${publicKey}`);

    const premaster = crypto.randomBytes(16);
    console.log(`Generated premaster: ${premaster.toString('hex')}`);

    const encryptedPremaster = crypto.publicEncrypt(
      publicKey,
      premaster
    );

    console.log('Sending encrypted premaster to server');
    client.write(
      JSON.stringify({ type: 'premaster', data: encryptedPremaster.toString('hex') })
    );

    const hash = crypto.createHash('sha256');
    hash.update(clientHello + serverHello + premaster);
    sessionKey = hash.digest('hex');
    console.log(`Created session key: ${sessionKey}`);
  } else if (message.type === 'ready') {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(sessionKey, 'hex'),
      Buffer.alloc(16, 0)
    );
    let decryptedMessage = decipher.update(message.data, 'hex', 'utf8');
    decryptedMessage += decipher.final('utf8');

    if (decryptedMessage === 'ready') {
      console.log('Received encrypted "ready" message from server');

      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(sessionKey, 'hex'),
        Buffer.alloc(16, 0)
      );
      let encryptedReady = cipher.update('ready', 'utf8', 'hex');
      encryptedReady += cipher.final('hex');
      client.write(JSON.stringify({ type: 'clientReady', data: encryptedReady }));

      console.log('Sent encrypted message "ready" to server');
    }
  }
});

client.on('end', () => {
  console.log('Connection closed');
});
