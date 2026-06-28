import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INTASEND_API_URL = "https://api.intasend.com/api/v1/payment/collection/";
const KES_AMOUNT = 130; // KES equivalent of $1/month

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { firebase_uid } = await req.json();
    if (!firebase_uid) {
      return Response.json({ error: "firebase_uid required" }, { status: 400 });
    }

    // Fetch the user's profile to get their phone number and name
    const profiles = await base44.asServiceRole.entities.UserProfile.filter(
      { firebase_uid }, null, 1
    );
    if (profiles.length === 0) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }
    const profile = profiles[0];

    // Normalize phone: strip "+" prefix (IntaSend expects 2547...)
    const phone = profile.phone.replace("+", "");
    const name = `${profile.first_name || ""} ${profile.surname || ""}`.trim() || "Customer";

    const apiKey = Deno.env.get("INTASEND_API_KEY");
    const publishableKey = Deno.env.get("INTASEND_PUBLISHABLE_KEY");
    if (!apiKey || !publishableKey) {
      return Response.json({ error: "IntaSend keys not configured" }, { status: 500 });
    }

    const apiRef = `NLC|${firebase_uid}`;

    const response = await fetch(INTASEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        public_key: publishableKey,
        currency: "KES",
        method: "M-PESA",
        amount: KES_AMOUNT,
        api_ref: apiRef,
        name: name,
        phone_number: phone,
        email: `${phone}@ncl.app`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return Response.json({
        error: data.detail || data.message || data.error || "IntaSend API error",
      }, { status: 400 });
    }

    return Response.json({
      invoice_id: data.invoice?.invoice_id || data.invoice?.id,
      state: data.invoice?.state,
      amount: KES_AMOUNT,
      phone: phone,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});