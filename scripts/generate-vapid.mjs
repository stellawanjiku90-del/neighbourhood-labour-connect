import crypto from 'node:crypto';
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = publicKey.export({ type: 'spki', format: 'der' });
const priv = privateKey.export({ type: 'pkcs8', format: 'der' });
// VAPID uses the raw 32-byte EC private scalar and the 65-byte uncompressed public point.
const rawPrivate = priv.subarray(priv.length - 32);
const pubRaw = publicKey.export({ format: 'jwk' });
const rawPublic = Buffer.concat([Buffer.from([4]), Buffer.from(pubRaw.x,'base64url'), Buffer.from(pubRaw.y,'base64url')]);
const b64 = b => b.toString('base64url');
console.log(`VAPID_PUBLIC_KEY=${b64(rawPublic)}`);
console.log(`VAPID_PRIVATE_KEY=${b64(rawPrivate)}`);
