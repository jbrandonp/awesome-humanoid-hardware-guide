const fs = require('fs');
const file = 'apps/api/src/app/auth/auth.service.spec.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace all occurrences of:
// const secret = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!.substring(0, 32));
// with:
// const secret = crypto.createHash('sha256').update(process.env.TOKEN_ENCRYPTION_KEY!).digest();
code = code.replace(
    /const secret = Buffer\.from\(process\.env\.TOKEN_ENCRYPTION_KEY!\.substring\(0, 32\)\);/g,
    "const secret = crypto.createHash('sha256').update(process.env.TOKEN_ENCRYPTION_KEY!).digest();"
);

fs.writeFileSync(file, code);
