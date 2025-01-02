'use strict';

const crypto = require('crypto');

const decryptMessage = (key, msgToDecrypt) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.alloc(16, 0)
  );
  let decryptedMessage = decipher.update(msgToDecrypt, 'hex', 'utf8');
  decryptedMessage += decipher.final('utf8');

  return decryptedMessage;
};

const encryptMessage = (key, msgToEncrypt) => {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.alloc(16, 0)
  );
  let encryptedResponse = cipher.update(msgToEncrypt, 'utf8', 'hex');
  encryptedResponse += cipher.final('hex');

  return encryptedResponse;
}

module.exports = { decryptMessage, encryptMessage };
