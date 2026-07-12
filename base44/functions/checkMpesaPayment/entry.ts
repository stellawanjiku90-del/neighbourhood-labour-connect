import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUBSCRIPTION_AMOUNT = 1.00; // USD stored in DB
const LEVEL_RATES = [0.10, 0.05, 0.02]; // Level 1=10%, 2=5%, 3=2%

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

    // Require authentication — prevents invoice replay attacks where an
    // unauthenticated caller supplies a victim's invoice_id with their own uid.
    const caller = await base44.auth.me();
    if (!caller) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    // The caller's authenticated ID is the source of truth — never trust
    // the client-supplied firebase_uid.
    const firebase_uid = caller.id;

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return Response.json({ error: "invoice_id required" }, { status: 400 });
    }

    const apiKey = Deno.env.get("INTASEND_API_KEY");
    const publishableKey = Deno.env.get("INTASEND_PUBLISHABLE_KEY");
    if (!apiKey || !publishableKey) {
      return Response.json({ error: "IntaSend keys not configured" }, { status: 500 });
    }

    const baseUrl = resolveBaseUrl(apiKey, publishableKey);
    const endpoint = `${baseUrl}/api/v1/payment/status/`;

    // Query IntaSend for the current payment status
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        public_key: publishableKey,
        invoice_id,
      }),
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Non-JSON response — still pending or transient server error
      return Response.json({
        state: "PENDING",
        note: `IntaSend returned a non-JSON response (HTTP ${response.status}): "${rawText.trim()}". Payment is still being processed.`,
      });
    }
    const state = data.invoice?.state;

    // ─── Verify invoice ownership before activating ──────────────
    // The api_ref is set at creation time as "NLC|<firebase_uid>".
    // Extract it from the IntaSend response and confirm the firebase_uid
    // embedded in it matches the authenticated caller — prevents replaying
    // another user's paid invoice to activate your own subscription.
    if (state === "SUCCESS" || state === "COMPLETED") {
      const apiRef = data.invoice?.api_ref || "";
      const invoiceUid = apiRef.includes("|") ? apiRef.split("|").pop() : null;
      if (!invoiceUid || invoiceUid !== firebase_uid) {
        return Response.json({ error: "Invoice does not belong to this account" }, { status: 403 });
      }
    }

    // ─── Payment successful — activate subscription ──────────────
    if (state === "SUCCESS" || state === "COMPLETED") {
      // Idempotency: skip if already active
      const existing = await base44.asServiceRole.entities.Subscription.filter(
        { user_id: firebase_uid, status: "active" }, "-created_date", 1
      );
      if (existing.length > 0) {
        return Response.json({
          state: "SUCCESS",
          already_active: true,
          period_end: existing[0].period_end,
        });
      }

      const profiles = await base44.asServiceRole.entities.UserProfile.filter(
        { firebase_uid }, null, 1
      );
      if (profiles.length === 0) {
        return Response.json({ error: "Profile not found" }, { status: 404 });
      }
      const subscriber = profiles[0];
      const subscriberName = `${subscriber.first_name || ""} ${subscriber.surname || ""}`.trim() || subscriber.phone;

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Expire any previously active subscriptions
      await base44.asServiceRole.entities.Subscription.updateMany(
        { user_id: firebase_uid, status: "active" },
        { $set: { status: "expired" } }
      );

      // Create the new active subscription
      await base44.asServiceRole.entities.Subscription.create({
        user_id: firebase_uid,
        user_phone: subscriber.phone,
        user_name: subscriberName,
        status: "active",
        amount: SUBSCRIPTION_AMOUNT,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        activated_by: "intasend-payment",
      });

      // ─── Cascade referral earnings up to 3 levels ───────────────
      let currentProfile = subscriber;
      for (let level = 1; level <= 3; level++) {
        const referrerUid = currentProfile?.referred_by;
        if (!referrerUid) break;

        const referrerProfiles = await base44.asServiceRole.entities.UserProfile.filter(
          { firebase_uid: referrerUid }, null, 1
        );
        if (referrerProfiles.length === 0) break;
        const referrer = referrerProfiles[0];
        const referrerName = `${referrer.first_name || ""} ${referrer.surname || ""}`.trim() || referrer.phone;
        const amount = +(SUBSCRIPTION_AMOUNT * LEVEL_RATES[level - 1]).toFixed(2);

        const existingEarning = await base44.asServiceRole.entities.ReferralEarning.filter(
          { earner_id: referrerUid, source_subscriber_id: firebase_uid, level }, null, 1
        );
        if (existingEarning.length === 0) {
          await base44.asServiceRole.entities.ReferralEarning.create({
            earner_id: referrerUid,
            earner_name: referrerName,
            source_subscriber_id: firebase_uid,
            source_name: subscriberName,
            level,
            amount,
            status: "pending",
          });
        }

        currentProfile = referrer;
      }

      // Mark the direct referral record as subscribed
      await base44.asServiceRole.entities.Referral.updateMany(
        { referred_id: firebase_uid, status: "registered" },
        { $set: { status: "subscribed" } }
      );

      return Response.json({
        state: "SUCCESS",
        activated: true,
        period_end: periodEnd.toISOString(),
      });
    }

    // ─── Payment failed ──────────────────────────────────────────
    if (state === "FAILED" || state === "CANCELLED") {
      return Response.json({
        state,
        reason: data.invoice?.failed_reason || "Payment was not completed.",
      });
    }

    // Still pending
    return Response.json({ state: state || "PENDING" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});