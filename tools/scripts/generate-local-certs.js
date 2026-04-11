let forge;
try {
  forge = require('node-forge');
} catch (e) {
  console.error('Error: "node-forge" dependency is missing.');
  console.log('Please run: npm install --save-dev node-forge');
  process.exit(1);
}

const os = require('os');
const fs = require('fs');
const path = require('path');

// Determine the local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback
}

const localIp = getLocalIpAddress();
console.log(`Local IP Address detected: ${localIp}`);

// Ensure certs directory exists at project root
const certsDir = path.resolve(process.cwd(), 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Generate Key Pair function
function generateKeyPair() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  return keys;
}

console.log('Generating Root CA...');
const caKeys = generateKeyPair();
const caCert = forge.pki.createCertificate();
caCert.publicKey = caKeys.publicKey;
caCert.serialNumber = '01';
caCert.validity.notBefore = new Date();
caCert.validity.notAfter = new Date();
caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 10); // 10 years validity

const caAttrs = [
  { name: 'commonName', value: 'Hopital Local Root CA' },
  { name: 'countryName', value: 'FR' },
  { shortName: 'ST', value: 'Ile-de-France' },
  { name: 'localityName', value: 'Paris' },
  { name: 'organizationName', value: 'Systeme de Sante Resilient' },
  { shortName: 'OU', value: 'IT Department' }
];
caCert.setSubject(caAttrs);
caCert.setIssuer(caAttrs);

caCert.setExtensions([
  {
    name: 'basicConstraints',
    cA: true
  },
  {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }
]);

// Self-sign the CA
caCert.sign(caKeys.privateKey, forge.md.sha256.create());

console.log('Generating Server Certificate...');
const serverKeys = generateKeyPair();
const serverCert = forge.pki.createCertificate();
serverCert.publicKey = serverKeys.publicKey;
serverCert.serialNumber = '02';
serverCert.validity.notBefore = new Date();
serverCert.validity.notAfter = new Date();
serverCert.validity.notAfter.setFullYear(serverCert.validity.notBefore.getFullYear() + 1); // 1 year validity

const serverAttrs = [
  { name: 'commonName', value: localIp },
  { name: 'countryName', value: 'FR' },
  { shortName: 'ST', value: 'Ile-de-France' },
  { name: 'localityName', value: 'Paris' },
  { name: 'organizationName', value: 'Systeme de Sante Resilient' },
  { shortName: 'OU', value: 'Hospital Server' }
];
serverCert.setSubject(serverAttrs);
serverCert.setIssuer(caCert.subject.attributes); // Issuer is the CA

serverCert.setExtensions([
  {
    name: 'basicConstraints',
    cA: false
  },
  {
    name: 'keyUsage',
    digitalSignature: true,
    keyEncipherment: true
  },
  {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true
  },
  {
    name: 'subjectAltName',
    altNames: [
      {
        type: 7, // IP address
        ip: localIp
      },
      {
        type: 7,
        ip: '127.0.0.1'
      },
      {
        type: 2, // DNS name
        value: 'localhost'
      }
    ]
  }
]);

// Sign the server certificate with the CA private key
serverCert.sign(caKeys.privateKey, forge.md.sha256.create());

// Save to files
const caCertPem = forge.pki.certificateToPem(caCert);
const caKeyPem = forge.pki.privateKeyToPem(caKeys.privateKey);
const serverCertPem = forge.pki.certificateToPem(serverCert);
const serverKeyPem = forge.pki.privateKeyToPem(serverKeys.privateKey);

fs.writeFileSync(path.join(certsDir, 'ca.crt'), caCertPem);
fs.writeFileSync(path.join(certsDir, 'ca.key'), caKeyPem);
fs.writeFileSync(path.join(certsDir, 'server.crt'), serverCertPem);
fs.writeFileSync(path.join(certsDir, 'server.key'), serverKeyPem);

console.log(`Certificates successfully generated and saved in ${certsDir}:`);
console.log('- ca.crt (Root CA Certificate - distribute to clients)');
console.log('- ca.key (Root CA Private Key - keep secret!)');
console.log('- server.crt (Server Certificate)');
console.log('- server.key (Server Private Key)');
console.log('');
console.log('Please refer to docs/CERTIFICATE_PINNING_GUIDE.md for implementation instructions.');
