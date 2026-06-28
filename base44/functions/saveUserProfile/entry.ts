import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Generate a unique referral code like "NLC-AB3X9K"
function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return "NLC-" + code;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();
    const {
      phone,
      firebase_uid,
      pin_hash,
      role,
      first_name,
      surname,
      age,
      id_type,
      id_number,
      id_photo_url,
      profile_photo_url,
      location_name,
      lat,
      lng,
      verify_id,
      referral_code_used,
    } = data;

    if (!phone) {
      return Response.json({ error: "Phone is required" }, { status: 400 });
    }

    // ─── ID Verification via InvokeLLM ──────────────────────────
    let id_verified = false;
    let id_names_extracted = "";

    if (verify_id && id_photo_url) {
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt:
            "You are an identity verification assistant. Examine this ID document image and extract the holder's first name, surname, and ID/document number exactly as they appear on the document. Return them as JSON.",
          file_urls: [id_photo_url],
          response_json_schema: {
            type: "object",
            properties: {
              first_name: { type: "string" },
              surname: { type: "string" },
              id_number: { type: "string" },
              full_name: { type: "string" },
            },
          },
        });

        const extractedFirst = (result.first_name || "").toLowerCase().trim();
        const extractedSurname = (result.surname || "").toLowerCase().trim();
        const extractedFull = (result.full_name || "").toLowerCase().trim();
        const providedFirst = (first_name || "").toLowerCase().trim();
        const providedSurname = (surname || "").toLowerCase().trim();

        id_names_extracted = `${result.first_name || ""} ${result.surname || ""}`.trim();

        const directMatch =
          extractedFirst === providedFirst && extractedSurname === providedSurname;
        const swappedMatch =
          extractedFirst === providedSurname && extractedSurname === providedFirst;
        const fullMatch =
          extractedFull.includes(providedFirst) && extractedFull.includes(providedSurname);

        id_verified = directMatch || swappedMatch || fullMatch;
      } catch (e) {
        id_verified = false;
        id_names_extracted = "Verification failed: " + e.message;
      }
    }

    // ─── Resolve referrer if a referral code was provided ────────
    let referred_by = null;
    let referrerProfile = null;
    const normalizedCode = (referral_code_used || "").trim().toUpperCase();

    if (normalizedCode) {
      const referrers = await base44.asServiceRole.entities.UserProfile.filter(
        { referral_code: normalizedCode },
        null,
        1
      );
      if (referrers.length > 0 && referrers[0].phone !== phone) {
        referrerProfile = referrers[0];
        referred_by = referrerProfile.firebase_uid || null;
      }
    }

    const profileData = {
      phone,
      firebase_uid,
      pin_hash,
      role,
      first_name,
      surname,
      age,
      id_type,
      id_number,
      id_photo_url,
      id_names_extracted,
      id_verified,
      profile_photo_url,
      location_name,
      lat,
      lng,
      profile_completed: data.profile_completed !== undefined ? data.profile_completed : true,
    };

    const existing = await base44.asServiceRole.entities.UserProfile.filter({ phone });

    const createReferralRecord = async (profile) => {
      if (!referred_by || !referrerProfile || !firebase_uid) return;
      const existingRef = await base44.asServiceRole.entities.Referral.filter(
        { referrer_id: referred_by, referred_id: firebase_uid },
        null,
        1
      );
      if (existingRef.length > 0) return;
      await base44.asServiceRole.entities.Referral.create({
        referrer_id: referred_by,
        referrer_name:
          `${referrerProfile.first_name || ""} ${referrerProfile.surname || ""}`.trim() ||
          referrerProfile.phone,
        referred_id: firebase_uid,
        referred_name: `${first_name || ""} ${surname || ""}`.trim() || phone,
        referred_phone: phone,
        referral_code_used: normalizedCode,
        status: "registered",
      });
    };

    if (existing.length > 0) {
      const existingRec = existing[0];
      // Preserve existing referral_code; generate one if missing
      if (!existingRec.referral_code) {
        profileData.referral_code = generateReferralCode();
      }
      // Only set referred_by if not already set and a referrer was resolved
      if (!existingRec.referred_by && referred_by) {
        profileData.referred_by = referred_by;
      }
      const profile = await base44.asServiceRole.entities.UserProfile.update(
        existingRec.id,
        profileData
      );
      await createReferralRecord(profile);
      return Response.json({ profile, id_verified });
    } else {
      profileData.referral_code = generateReferralCode();
      if (referred_by) profileData.referred_by = referred_by;
      const profile = await base44.asServiceRole.entities.UserProfile.create(profileData);
      await createReferralRecord(profile);
      return Response.json({ profile, id_verified });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});