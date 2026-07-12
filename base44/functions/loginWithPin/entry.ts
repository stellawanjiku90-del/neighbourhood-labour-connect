import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from "npm:bcryptjs@2.4.3";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Replicate the legacy client-side SHA-256 hash for backward-compatible
// comparison with existing PIN records that were created before the
// server-side bcrypt migration.
async function legacySha256(pin) {
  const data = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, pin } = await req.json();

    if (!phone || !pin) {
      return Response.json({ error: "phone and pin are required" }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ phone }, null, 1);
    if (profiles.length === 0) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profiles[0];

    // Check if account is locked due to too many failed attempts
    if (profile.locked_until) {
      const lockedUntil = new Date(profile.locked_until);
      if (lockedUntil > new Date()) {
        const remainingMin = Math.ceil((lockedUntil - new Date()) / 60000);
        return Response.json({
          error: `Too many failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`
        }, { status: 429 });
      }
    }

    // ─── Verify the PIN server-side ──────────────────────────────
    // Bcrypt hashes start with "$2". Legacy SHA-256 hashes are 64-char hex.
    // On legacy match, transparently upgrade to bcrypt.
    const storedHash = profile.pin_hash;
    let pinMatches = false;
    let needsUpgrade = false;

    if (storedHash) {
      if (storedHash.startsWith("$2")) {
        pinMatches = await bcrypt.compare(pin, storedHash);
      } else {
        const legacyHash = await legacySha256(pin);
        pinMatches = legacyHash === storedHash;
        needsUpgrade = pinMatches;
      }
    }

    if (!pinMatches) {
      const attempts = (profile.failed_pin_attempts || 0) + 1;
      const updates = { failed_pin_attempts: attempts };

      if (attempts >= MAX_ATTEMPTS) {
        updates.locked_until = new Date(Date.now() + LOCKOUT_MS).toISOString();
        updates.failed_pin_attempts = 0;
      }

      await base44.asServiceRole.entities.UserProfile.update(profile.id, updates);

      const remaining = MAX_ATTEMPTS - attempts;
      const message = remaining > 0
        ? `Incorrect PIN. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before lockout.`
        : `Too many failed attempts. Your account is locked for 15 minutes.`;

      return Response.json({ error: message }, { status: 401 });
    }

    // Success — reset failed attempts and clear lockout
    const successUpdates = { failed_pin_attempts: 0, locked_until: null };

    // Transparently upgrade legacy SHA-256 hash to bcrypt
    if (needsUpgrade) {
      const salt = await bcrypt.genSalt(10);
      successUpdates.pin_hash = await bcrypt.hash(pin, salt);
    }

    await base44.asServiceRole.entities.UserProfile.update(profile.id, successUpdates);

    // Return the full profile with pin_hash stripped
    const { pin_hash: _removed, ...safeProfile } = profile;
    return Response.json({ profile: safeProfile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});