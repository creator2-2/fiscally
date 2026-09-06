const KEY_STORAGE = "fiscally.deviceKey.v1";

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

async function getDeviceKey(): Promise<CryptoKey> {
  const existing = window.localStorage.getItem(KEY_STORAGE);
  let raw: Uint8Array;
  if (existing) {
    raw = b64ToBytes(existing);
  } else {
    raw = crypto.getRandomValues(new Uint8Array(32));
    window.localStorage.setItem(KEY_STORAGE, bytesToB64(raw));
  }
  return crypto.subtle.importKey("raw", raw as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptAtRest(value: unknown): Promise<string> {
  const key = await getDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, encoded);
  return `${bytesToB64(iv)}.${bytesToB64(new Uint8Array(cipher))}`;
}

export async function decryptAtRest<T>(payload: string): Promise<T> {
  const [ivB64, dataB64] = payload.split(".");
  if (!ivB64 || !dataB64) throw new Error("payload invalid");
  const key = await getDeviceKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(ivB64) as BufferSource },
    key,
    b64ToBytes(dataB64) as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

export function clearDeviceKey(): void {
  window.localStorage.removeItem(KEY_STORAGE);
}
