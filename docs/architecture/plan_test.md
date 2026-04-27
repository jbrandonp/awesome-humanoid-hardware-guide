The issue is that `TOKEN_ENCRYPTION_KEY` validation and usage can be problematic with multi-byte characters.
Currently in `auth.service.ts`:
```typescript
if (process.env.TOKEN_ENCRYPTION_KEY && Buffer.byteLength(process.env.TOKEN_ENCRYPTION_KEY, 'utf8') < 32) { ... }
```
And usage in `auth.service.ts`:
```typescript
const secret = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'utf8').subarray(0, 32);
```

While `Buffer.from(..., 'utf8').subarray(0, 32)` guarantees exactly 32 bytes (which satisfies AES-256), taking a subarray might cut a multi-byte UTF-8 character in half, leading to invalid UTF-8 sequences. Also, the validation checks if the byte length is >= 32.

A better and safer way to derive a 32-byte key for AES-256 from a string of any length (as long as it's strong enough) is to use a cryptographic hash like SHA-256.
Wait, if we change how the key is derived (e.g. using SHA-256), existing encrypted refresh tokens will become invalid, causing users to be logged out.

Let's look closely at the request:
"validation impose TOKEN_ENCRYPTION_KEY.length >= 32 (en caractères), puis tronque avec substring(0, 32) avant Buffer.from(secret)"
Wait, the request says:
"La validation impose `TOKEN_ENCRYPTION_KEY.length >= 32` (en caractères), puis tronque avec `substring(0, 32)` avant `Buffer.from(secret)`."

But in the code of `auth.service.ts`:
```typescript
if (
  process.env.TOKEN_ENCRYPTION_KEY &&
  Buffer.byteLength(process.env.TOKEN_ENCRYPTION_KEY, 'utf8') < 32
)
...
const secret = Buffer.from(
  process.env.TOKEN_ENCRYPTION_KEY!,
  'utf8',
).subarray(0, 32);
```
Ah! The request might be describing the *previous* state of the code or is slightly mischaracterizing the current code (or perhaps the problem lies in the `.spec.ts` which indeed uses `substring(0, 32)`).
Wait, look at `auth.service.spec.ts`:
```typescript
const secret = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!.substring(0, 32));
```
If `process.env.TOKEN_ENCRYPTION_KEY` contains multi-byte characters, `substring(0, 32)` takes 32 characters, which might be > 32 bytes! Then `Buffer.from()` will create a buffer of > 32 bytes, which crashes `createCipheriv` with `Invalid key length`.

Let's test this in Node:
```javascript
const crypto = require('crypto');
const key = "é".repeat(32); // 32 characters
const secret = Buffer.from(key.substring(0, 32));
console.log(secret.length); // 64 bytes!
crypto.createCipheriv('aes-256-cbc', secret, crypto.randomBytes(16)); // Throws Invalid key length!
```

So the crash happens if someone does what is done in the spec, or if the user is right and I should use exactly 32 bytes.
To fix the spec and the service, we should ensure that the AES key is exactly 32 bytes long without randomly cutting UTF-8 characters.

Actually, the safest fix that doesn't break backward compatibility for ASCII keys is to pad/truncate strictly on the buffer level (which is what `auth.service.ts` does now: `Buffer.from(..., 'utf8').subarray(0, 32)`), but wait: if we take `.subarray(0, 32)` of a buffer, its length is 32. `createCipheriv` will ALWAYS get 32 bytes and won't throw `Invalid key length`.
Wait, why does the issue say it crashes in `createCipheriv`?
Because if a user has a key that is 32 characters long, but one character is multi-byte, the string length is 32. But wait, `auth.service.ts` doesn't do `substring(0, 32)`.

Let's double check if I missed something in `auth.service.ts` or another file.
