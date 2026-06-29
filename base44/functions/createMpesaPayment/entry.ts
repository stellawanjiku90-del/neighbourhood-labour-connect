import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const KES_AMOUNT = 130; // KES equivalent of $1/month

/**
 * Detect whether an IntaSend key is a test or live key.
 * Test keys contain the substring "test"; live keys contain "live".
 * Returns the correct base URL for the detected environment.
 */
function resolveBaseUrl(apiKey, publishableKey) {
  const isTest =
    (apiKey && apiKey.includes("test")) ||
    (publishableKey && publishableKey.includes("test"));
  return isTest
    ? "https://sandbox.intasend.com"
    : "https://payment.intasend.com";
}

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

    const baseUrl = resolveBaseUrl(apiKey, publishableKey);
    const endpoint = `${baseUrl}/api/v1/payment/collection/`;
    const apiRef = `NLC|${firebase_uid}`;

    // ─── IntaSend M-Pesa STK Push payload (per current API spec) ──
    const payload = {
      public_key: publishableKey,
      currency: "KES",
      method: "M-PESA",
      amount: KES_AMOUNT,
      api_ref: apiRef,
      name: name,
      phone_number: phone,
      email: `${phone}@ncl.app`,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // ─── Read the raw text first — IntaSend may return non-JSON on error ──
    const rawText = await response.text();
    let data = null;
    let parseError = null;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      parseError = e.message;
    }

    // ─── Non-JSON response (e.g. "error code: 1106") ──────────────
    if (parseError) {
      return Response.json({
        error: `IntaSend returned a non-JSON response (HTTP ${response.status}). Raw body: "${rawText.trim()}"`,
        intasend_error: {
          http_status: response.status,
          raw_body: rawText.trim(),
          endpoint: endpoint,
          environment: baseUrl.includes("sandbox") ? "test" : "live",
        },
      }, { status: 502 });
    }

    // ─── JSON but HTTP error ──────────────────────────────────────
    if (!response.ok) {
      const errMsg = data?.detail || data?.message || data?.errors?.[0]?.detail ||
        data?.error || rawText || "IntaSend API error";
      return Response.json({
        error: `IntaSend error (HTTP ${response.status}): ${errMsg}`,
        intasend_error: {
          http_status: response.status,
          raw_body: rawText,
          parsed: data,
          endpoint: endpoint,
          environment: baseUrl.includes("sandbox") ? "test" : "live",
        },
      }, { status: 400 });
    }

    return Response.json({
      invoice_id: data.invoice?.invoice_id || data.invoice?.id,
      state: data.invoice?.state,
      amount: KES_AMOUNT,
      phone: phone,
      environment: baseUrl.includes("sandbox") ? "test" : "live",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});