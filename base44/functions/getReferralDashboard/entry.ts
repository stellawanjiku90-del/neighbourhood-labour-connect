import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { firebase_uid } = await req.json();
    if (!firebase_uid) return Response.json({ error: "firebase_uid required" }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter(
      { firebase_uid }, null, 1
    );
    if (profiles.length === 0) return Response.json({ error: "Profile not found" }, { status: 404 });
    const profile = profiles[0];

    const [referrals, earnings, subs] = await Promise.all([
      base44.asServiceRole.entities.Referral.filter({ referrer_id: firebase_uid }, "-created_date", 100),
      base44.asServiceRole.entities.ReferralEarning.filter({ earner_id: firebase_uid }, "-created_date", 100),
      base44.asServiceRole.entities.Subscription.filter({ user_id: firebase_uid, status: "active" }, "-created_date", 1),
    ]);

    const totalEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
    const activeSub = subs[0];
    const subscriptionActive = !!(activeSub && new Date(activeSub.period_end) > new Date());

    return Response.json({
      referral_code: profile.referral_code || null,
      referred_by: profile.referred_by || null,
      referrals,
      earnings,
      total_earnings: +totalEarnings.toFixed(2),
      referral_count: referrals.length,
      subscribed_count: referrals.filter((r) => r.status === "subscribed").length,
      subscription_active: subscriptionActive,
      subscription_end: activeSub?.period_end || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});