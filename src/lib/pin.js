/**
 * PIN hashing utility using the Web Crypto API (SHA-256).
 * Used for storing and verifying the user's 4-digit login PIN.
 */

export async function hashPin(pin) {
  const data = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPin(pin, storedHash) {
  if (!storedHash) return false;
  const hash = await hashPin(pin);
  return hash === storedHash;
}