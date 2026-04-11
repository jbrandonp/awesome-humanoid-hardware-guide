const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Add to DpdpaConsent
const dpdpaConsentAddition = `
  consentHash String? @map("consent_hash") // SHA-256 hash of consent parameters
  version     Int     @default(1)
`;
schema = schema.replace(/  purpose   String\n/g, '  purpose   String\n' + dpdpaConsentAddition);


fs.writeFileSync(schemaPath, schema);
