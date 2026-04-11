const crypto = require('crypto');
// Checking that crypto.createHash('sha256').update(String(undefined)).digest() is what runs if env var is missing,
// although the validation step will throw before it reaches that point.
const hash = crypto.createHash('sha256').update('12345678901234567890123456789012').digest();
console.log(hash.length);
