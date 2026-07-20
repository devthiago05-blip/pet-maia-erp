import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

interface EncryptedPayload {
  version: 1;
  iv: string;
  tag: string;
  data: string;
}

function getEncryptionKey() {
  const source =
    process.env.FISCAL_SECRETS_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!source) {
    throw new Error("Chave de criptografia fiscal não configurada.");
  }

  return createHash("sha256")
    .update(`pet-maia:nfce:v1:${source}`)
    .digest();
}

export function encryptFiscalSecret(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);

  return JSON.stringify({
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  } satisfies EncryptedPayload);
}

export function decryptFiscalSecret<T>(payload: string): T {
  const parsed = JSON.parse(payload) as EncryptedPayload;

  if (parsed.version !== 1) {
    throw new Error("Versão de criptografia fiscal não suportada.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(parsed.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));

  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(parsed.data, "base64")),
      decipher.final(),
    ]).toString("utf8"),
  ) as T;
}
