import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign as nodeSign, verify as nodeVerify } from "node:crypto";
import { LEDGER_DIR } from "./ledger.js";

/**
 * Passport identity: an Ed25519 keypair, expressed as a `did:key`.
 *
 * Local-first by design — no account, no registry lookup needed to be
 * verifiable. The public key travels inside the DID itself, so anyone
 * holding the passport can check the signature offline.
 */

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58encode(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes) n = n * 256n + BigInt(b);
  let out = "";
  while (n > 0n) {
    out = B58[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) out = "1" + out;
    else break;
  }
  return out || "1";
}

export function base58decode(s: string): Uint8Array {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error(`invalid base58 character: ${c}`);
    n = n * 58n + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n % 256n));
    n /= 256n;
  }
  for (const c of s) {
    if (c === "1") bytes.unshift(0);
    else break;
  }
  return Uint8Array.from(bytes);
}

/** multicodec prefix for an Ed25519 public key */
const ED25519_PREFIX = Uint8Array.from([0xed, 0x01]);

export function publicKeyToDid(raw: Uint8Array): string {
  const buf = new Uint8Array(ED25519_PREFIX.length + raw.length);
  buf.set(ED25519_PREFIX, 0);
  buf.set(raw, ED25519_PREFIX.length);
  return `did:key:z${base58encode(buf)}`;
}

export function didToPublicKey(did: string): Uint8Array {
  const m = /^did:key:z([1-9A-HJ-NP-Za-km-z]+)(#.*)?$/.exec(did.trim());
  if (!m) throw new Error(`not a did:key: ${did}`);
  const bytes = base58decode(m[1]);
  if (bytes[0] !== 0xed || bytes[1] !== 0x01) throw new Error("did:key is not Ed25519");
  return bytes.slice(2);
}

export interface KeyFile {
  did: string;
  publicKeyMultibase: string;
  privateKeyPem: string;
  createdAt: string;
  purpose: string;
}

export function keyPath(cwd: string): string {
  return join(cwd, LEDGER_DIR, "passport-key.json");
}

export function loadKey(cwd: string): KeyFile | null {
  const p = keyPath(cwd);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

export function createKey(cwd: string): KeyFile {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = new Uint8Array(publicKey.export({ type: "spki", format: "der" })).slice(-32);
  const did = publicKeyToDid(raw);
  const data: KeyFile = {
    did,
    publicKeyMultibase: did.slice("did:key:".length),
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    createdAt: new Date().toISOString(),
    purpose: "carbon.md passport signing key",
  };
  mkdirSync(join(cwd, LEDGER_DIR), { recursive: true });
  writeFileSync(keyPath(cwd), JSON.stringify(data, null, 2), { mode: 0o600 });
  return data;
}

export function signBytes(key: KeyFile, bytes: Uint8Array): Uint8Array {
  return new Uint8Array(nodeSign(null, bytes, createPrivateKey(key.privateKeyPem)));
}

export function verifyBytes(did: string, bytes: Uint8Array, signature: Uint8Array): boolean {
  const raw = didToPublicKey(did);
  // rebuild an SPKI DER wrapper around the raw Ed25519 key
  const spki = Buffer.concat([
    Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]),
    Buffer.from(raw),
  ]);
  const pub = createPublicKey({ key: spki, format: "der", type: "spki" });
  try {
    return nodeVerify(null, bytes, pub, signature);
  } catch {
    return false;
  }
}
