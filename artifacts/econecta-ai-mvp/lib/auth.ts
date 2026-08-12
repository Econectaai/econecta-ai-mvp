// Shared auth utilities — uses only Web Crypto API so it works in both
// Edge Runtime (middleware) and Node.js runtime (API routes).

export const COOKIE_NAME = "econecta_admin_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function ab2b64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function importKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

/** Create a signed session token valid for COOKIE_MAX_AGE seconds. */
export async function createToken(secret: string): Promise<string> {
  const data = btoa(JSON.stringify({ exp: Date.now() + COOKIE_MAX_AGE * 1000 }));
  const key = await importKey(secret, "sign");
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${ab2b64(sig)}`;
}

/** Verify a session token — returns true only if signature and expiry are valid. */
export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return false;
    const data = token.slice(0, lastDot);
    const b64Sig = token.slice(lastDot + 1);

    const sigBytes = Uint8Array.from(atob(b64Sig), (c) => c.charCodeAt(0));
    const key = await importKey(secret, "verify");
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );
    if (!valid) return false;

    const { exp } = JSON.parse(atob(data));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
