import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@/common/utils/envConfig";

const algorithm = "aes-256-gcm";
const key = Buffer.from(env.ENCRYPTION_KEY, "hex");

export function encryptText(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, tag, encrypted]);
  return payload.toString("base64");
}

export function decryptText(encryptedText: string): string {
  const payload = Buffer.from(encryptedText, "base64");
  const iv = payload.slice(0, 12);
  const tag = payload.slice(12, 28);
  const encrypted = payload.slice(28);

  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
