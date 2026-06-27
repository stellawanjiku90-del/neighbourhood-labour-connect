import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
      verify_id,
    } = data;

    if (!phone) {
      return Response.json({ error: "Phone is required" }, { status: 400 });
    }

    // ─── ID Verification via InvokeLLM ──────────────────────────
    // If an ID photo is provided and verify_id is true, use the LLM
    // to extract names from the ID document and compare them with
    // the user-provided first name and surname.
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

        // Match in either name order (first/surname may be swapped on some IDs)
        const directMatch =
          extractedFirst === providedFirst && extractedSurname === providedSurname;
        const swappedMatch =
          extractedFirst === providedSurname && extractedSurname === providedFirst;
        // Also check if the full name string contains both provided names
        const fullMatch =
          extractedFull.includes(providedFirst) && extractedFull.includes(providedSurname);

        id_verified = directMatch || swappedMatch || fullMatch;
      } catch (e) {
        // If LLM verification fails, mark as not verified but continue saving
        id_verified = false;
        id_names_extracted = "Verification failed: " + e.message;
      }
    }

    // ─── Save / Update UserProfile ───────────────────────────────
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
      profile_completed: data.profile_completed !== undefined ? data.profile_completed : true,
    };

    const existing = await base44.asServiceRole.entities.UserProfile.filter({ phone });

    if (existing.length > 0) {
      const profile = await base44.asServiceRole.entities.UserProfile.update(
        existing[0].id,
        profileData
      );
      return Response.json({ profile, id_verified });
    } else {
      const profile = await base44.asServiceRole.entities.UserProfile.create(profileData);
      return Response.json({ profile, id_verified });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});