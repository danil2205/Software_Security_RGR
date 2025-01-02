'use strict';

const net = require('net');
const crypto = require("crypto");

const clientHello = crypto.randomBytes(16).toString('hex');

const client = net.createConnection({ port: 3000 }, () => {
  console.log('Connected to server');

  console.log(`Send to server "hello": ${clientHello}`);
  client.write(JSON.stringify({ type: 'hello', data: clientHello }));
});

let serverPublicKey;

client.on('data', (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === 'serverHello') {
    const { serverHello, publicKey } = message.data;
    serverPublicKey = publicKey;
    console.log(`Received from server "hello": ${serverHello}`);
    console.log(`Received server public key:\n${publicKey}`);

    const premaster = crypto.randomBytes(16);
    console.log(`Generated premaster: ${premaster.toString('hex')}`);

    const encryptedPremaster = crypto.publicEncrypt(
      serverPublicKey,
      premaster
    );

    console.log('Sending encrypted premaster to server');
    client.write(
      JSON.stringify({ type: 'premaster', data: encryptedPremaster.toString('hex') })
    );
  }


});

client.on('end', () => {
  console.log('Connection closed');
});
