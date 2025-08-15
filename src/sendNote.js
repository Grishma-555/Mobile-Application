const crypto = require('crypto');

function sendNote(note, recipient) {
  // Generate a random 256-bit key
  const key = crypto.randomBytes(32).toString('hex');

  // Encrypt the note using AES-256-CBC
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(note, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Show what you send and the decryption code
  console.log(`Note sent to ${recipient}:`);
  console.log('Encrypted note:', encrypted);
  console.log('IV:', iv.toString('hex'));
  console.log('Decryption code (key):', key);

  // You can return these values or send them to your frontend/UI as needed
  return {
    encryptedNote: encrypted,
    iv: iv.toString('hex'),
    decryptionKey: key,
    recipient,
  };
}

// Example usage

sendNote('This is a secret note!', 'recipient@example.com');