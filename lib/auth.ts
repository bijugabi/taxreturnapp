const COOKIE_NAME = "tax_session";
const TOKEN_VALUE = "admin";

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-secret-change-in-production";
}

/** Usado apenas na API (Node). Não importar crypto no topo para o middleware (Edge) não quebrar. */
export function createSessionToken(): string {
  const { createHmac } = require("crypto") as {
    createHmac: (alg: string, key: string) => {
      update: (s: string) => { digest: (enc: string) => string };
    };
  };
  return createHmac("sha256", getSecret()).update(TOKEN_VALUE).digest("hex");
}

/** Verificação compatível com Edge (Web Crypto). Usar no middleware. */
export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  try {
    const secret = getSecret();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(TOKEN_VALUE)
    );
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (token.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < token.length; i++) {
      diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

/** Gera salt e hash da password (usar ao criar utilizador). Salt e hash em hex. */
export function hashPassword(password: string): { salt: string; hash: string } {
  const crypto = require("crypto") as {
    randomBytes: (n: number) => Buffer;
    scryptSync: (p: string, s: Buffer, len: number) => Buffer;
  };
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return {
    salt: salt.toString("hex"),
    hash: hash.toString("hex"),
  };
}

/** Verifica password contra salt e hash guardados (hex). */
export function verifyPassword(
  password: string,
  saltHex: string,
  hashHex: string
): boolean {
  const crypto = require("crypto") as {
    scryptSync: (p: string, s: Buffer, len: number) => Buffer;
    timingSafeEqual: (a: Buffer, b: Buffer) => boolean;
  };
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
