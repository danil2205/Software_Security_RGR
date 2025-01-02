'use strict';

const net = require('net');
const crypto = require("crypto");

const clientHello = crypto.randomBytes(16).toString('hex');

const client = net.createConnection({ port: 3000 }, () => {
  console.log('Connected to server');

  console.log(`Send to server "hello": ${clientHello}`);
  client.write(clientHello);
});

client.on('data', (data) => {
  const { serverHello, publicKey } = JSON.parse(data.toString());
  console.log(`Received from server "hello": ${serverHello}`);
  console.log(`Received server public key:\n${publicKey}`);
});

client.on('end', () => {
  console.log('Connection closed');
});
