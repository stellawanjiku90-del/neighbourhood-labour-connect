import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, pin_hash, firebase_uid } = await req.json();

    if (!phone || !pin_hash) {
      return Response.json({ error: "Phone and pin_hash are required" }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.UserProfile.filter({ phone });

    if (existing.length === 0) {
      return Response.json({ error: "No account found for this phone number" }, { status: 404 });
    }

    // Only update the PIN (and refresh firebase_uid if provided). All other
    // profile fields (role, name, ID verification, etc.) are preserved.
    const updateData = { pin_hash };
    if (firebase_uid) updateData.firebase_uid = firebase_uid;

    const profile = await base44.asServiceRole.entities.UserProfile.update(
      existing[0].id,
      updateData
    );
    return Response.json({ profile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});