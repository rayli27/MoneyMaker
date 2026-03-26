import crypto from "crypto";

function keyFromEnv() {
  const raw = process.env.PLAID_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("Missing PLAID_TOKEN_ENCRYPTION_KEY");

  // Accept either base64-encoded 32-byte key or hex-encoded 32-byte key.
  let key: Buffer;
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length === 64) {
    key = Buffer.from(raw, "hex");
  } else {
    key = Buffer.from(raw, "base64");
  }

  if (key.length !== 32) {
    throw new Error(
      `PLAID_TOKEN_ENCRYPTION_KEY must decode to 32 bytes; got ${key.length}`,
    );
  }

  return key;
}

/**
 * Encrypts a string and returns base64 string containing iv + ciphertext + tag.
 * This is MVP-grade crypto. For production, consider a managed secrets/KMS approach.
 */
export function encryptString(plaintext: string) {
  const key = keyFromEnv();
  const iv = crypto.randomBytes(12); // recommended size for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, ciphertext, tag]).toString("base64");
}

export function decryptString(encryptedBase64: string) {
  const key = keyFromEnv();
  const raw = Buffer.from(encryptedBase64, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(raw.length - 16);
  const ciphertext = raw.subarray(12, raw.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

