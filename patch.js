const fs = require('fs');
const file = 'apps/api/src/app/auth/auth.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /Buffer\.byteLength\(process\.env\.TOKEN_ENCRYPTION_KEY, 'utf8'\) < 32/,
    "process.env.TOKEN_ENCRYPTION_KEY.length < 32"
);

code = code.replace(
    /private encryptToken\(token: string\): string \{[\s\S]*?const secret = Buffer\.from\([\s\S]*?process\.env\.TOKEN_ENCRYPTION_KEY!,[\s\S]*?'utf8',[\s\S]*?\)\.subarray\(0, 32\);/,
    `private getEncryptionSecret(): Buffer {
    // Generate a consistent 32-byte key using SHA-256 to support multi-byte characters safely
    return crypto.createHash('sha256').update(process.env.TOKEN_ENCRYPTION_KEY || '').digest();
  }

  private encryptToken(token: string): string {
    const secret = this.getEncryptionSecret();`
);

code = code.replace(
    /private decryptToken\(encryptedData: string\): string \{[\s\S]*?const parts = encryptedData\.split\(':'\);[\s\S]*?if \(parts\.length !== 2\) throw new Error\('Invalid encrypted token format'\);[\s\S]*?const secret = Buffer\.from\([\s\S]*?process\.env\.TOKEN_ENCRYPTION_KEY!,[\s\S]*?'utf8',[\s\S]*?\)\.subarray\(0, 32\);/,
    `private decryptToken(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) throw new Error('Invalid encrypted token format');
    const secret = this.getEncryptionSecret();`
);

fs.writeFileSync(file, code);
