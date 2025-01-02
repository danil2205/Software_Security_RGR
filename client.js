'use strict';

const net = require('net');
const crypto = require("crypto");

const clientHello = crypto.randomBytes(20).toString('hex');

const client = net.createConnection({ port: 3000 }, () => {
  console.log('Connected to server');

  console.log(`Send to server: ${clientHello}`);
  client.write(clientHello);
});

client.on('end', () => {
  console.log('Connection closed');
});
