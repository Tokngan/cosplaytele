import crypto from "node:crypto";

const KEY_INFO = "media-proxy-key-v1";
const NONCE_INFO = "media-proxy-nonce-v1";

function getMasterSecret(): string {
  const s = process.env.MEDIA_PROXY_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MEDIA_PROXY_SECRET must be set to a string of >= 32 chars in production",
    );
  }
  return "dev-only-insecure-secret-not-for-production-use!!";
}

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!cachedKey) {
    cachedKey = crypto
      .createHmac("sha256", getMasterSecret())
      .update(KEY_INFO)
      .digest();
  }
  return cachedKey;
}

function deterministicNonce(plaintext: string): Buffer {
  return crypto
    .createHmac("sha256", getMasterSecret())
    .update(NONCE_INFO)
    .update(plaintext)
    .digest()
    .subarray(0, 12);
}

export function encryptUrl(plaintext: string): string {
  const iv = deterministicNonce(plaintext);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64url");
}

export function decryptUrl(token: string): string | null {
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < 12 + 16 + 1) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}
