import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUBSCRIPTION_AMOUNT = 1.00; // USD per month
const LEVEL_RATES = [0.10, 0.05, 0.02]; // Level 1 = 10%, Level 2 = 5%, Level 3 = 2%

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    const { target_user_id } = await req.json();
    if (!target_user_id) return Response.json({ error: "target_user_id required" }, { status: 400 });

    // Look up the subscriber's UserProfile by firebase_uid
    const profiles = await base44.asServiceRole.entities.UserProfile.filter(
      { firebase_uid: target_user_id }, null, 1
    );
    if (profiles.length === 0) return Response.json({ error: "User profile not found" }, { status: 404 });
    const subscriber = profiles[0];
    const subscriberName = `${subscriber.first_name || ""} ${subscriber.surname || ""}`.trim() || subscriber.phone;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Expire any previously active subscriptions for this user
    await base44.asServiceRole.entities.Subscription.updateMany(
      { user_id: target_user_id, status: "active" },
      { $set: { status: "expired" } }
    );

    // Create the new active subscription
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: target_user_id,
      user_phone: subscriber.phone,
      user_name: subscriberName,
      status: "active",
      amount: SUBSCRIPTION_AMOUNT,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      activated_by: user.id,
    });

    // ─── Cascade referral earnings up to 3 levels ───────────────
    const earnings = [];
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

      // Avoid duplicate earnings for the same subscriber + level
      const existingEarning = await base44.asServiceRole.entities.ReferralEarning.filter(
        { earner_id: referrerUid, source_subscriber_id: target_user_id, level }, null, 1
      );
      if (existingEarning.length === 0) {
        const earning = await base44.asServiceRole.entities.ReferralEarning.create({
          earner_id: referrerUid,
          earner_name: referrerName,
          source_subscriber_id: target_user_id,
          source_name: subscriberName,
          level,
          amount,
          status: "pending",
        });
        earnings.push(earning);
      }

      currentProfile = referrer;
    }

    // Mark the direct referral record as subscribed
    await base44.asServiceRole.entities.Referral.updateMany(
      { referred_id: target_user_id, status: "registered" },
      { $set: { status: "subscribed" } }
    );

    return Response.json({ subscription, earnings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});