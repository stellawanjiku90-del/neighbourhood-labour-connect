import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, pin_hash } = await req.json();

    if (!phone || !pin_hash) {
      return Response.json({ error: "phone and pin_hash are required" }, { status: 400 });
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

    // Verify the PIN server-side — never expose pin_hash to the client
    if (pin_hash !== profile.pin_hash) {
      const attempts = (profile.failed_pin_attempts || 0) + 1;
      const updates = { failed_pin_attempts: attempts };

      if (attempts >= MAX_ATTEMPTS) {
        // Lock the account and reset the counter
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
    if (profile.failed_pin_attempts > 0 || profile.locked_until) {
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        failed_pin_attempts: 0,
        locked_until: null,
      });
    }

    // Return the full profile with pin_hash stripped
    const { pin_hash: _removed, ...safeProfile } = profile;
    return Response.json({ profile: safeProfile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});