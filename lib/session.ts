// Signed session cookie. Uses Web Crypto so it works both in middleware
// (edge runtime) and in server actions / route handlers (node runtime).

export const SESSION_COOKIE = "difusion_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Session =
  | { role: "ADMIN"; exp: number }
  | { role: "USER"; userId: string; exp: number };

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string) {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

export async function signSession(
  data: { role: "ADMIN" } | { role: "USER"; userId: string }
) {
  const payload: Session = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  } as Session;
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

export async function verifySession(
  token: string | undefined
): Promise<Session | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = await hmac(body);
  // Constant-time compare
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (diff !== 0) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload as Session;
  } catch {
    return null;
  }
}
