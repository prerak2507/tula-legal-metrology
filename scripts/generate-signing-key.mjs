// Generates an ECDSA P-256 key pair for certificate signing.
// Usage: node scripts/generate-signing-key.mjs <key-id>
// Prints the private key (put it in the server env as CERT_SIGNING_PRIVATE_KEY, never commit it)
// and the public JWK (add it to src/config/trustedKeys.ts).

import { generateKeyPairSync } from 'node:crypto';

const kid = process.argv[2] || `tula-${new Date().toISOString().slice(0, 7)}`;
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

const privDer = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');
const jwk = publicKey.export({ format: 'jwk' });

console.log(JSON.stringify({ kid, CERT_SIGNING_PRIVATE_KEY: privDer, publicJwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y } }, null, 2));
