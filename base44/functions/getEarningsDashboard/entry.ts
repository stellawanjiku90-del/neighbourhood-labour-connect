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

    // Provider earnings (linked by phone number)
    let provider = null;
    if (profile.phone) {
      const providers = await base44.asServiceRole.entities.ServiceProvider.filter(
        { phone: profile.phone }, null, 1
      );
      provider = providers[0] || null;
    }

    // Referral earnings
    const earnings = await base44.asServiceRole.entities.ReferralEarning.filter(
      { earner_id: firebase_uid }, "-created_date", 100
    );
    const referralTotal = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
    const byLevel = [0, 0, 0];
    earnings.forEach((e) => {
      if (e.level >= 1 && e.level <= 3) byLevel[e.level - 1] += e.amount || 0;
    });

    // Subscription status
    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { user_id: firebase_uid, status: "active" }, "-created_date", 1
    );
    const activeSub = subs[0];
    const subscriptionActive = !!(activeSub && new Date(activeSub.period_end) > new Date());

    const providerEarnings = provider?.earnings || 0;
    const totalEarnings = +providerEarnings + referralTotal;

    return Response.json({
      referral_code: profile.referral_code || null,
      provider: provider
        ? {
            name: provider.name,
            earnings: provider.earnings || 0,
            completed_jobs: provider.completed_jobs || 0,
            rating: provider.rating || 0,
            reviews_count: provider.reviews_count || 0,
          }
        : null,
      referral: {
        total: +referralTotal.toFixed(2),
        by_level: byLevel.map((v) => +v.toFixed(2)),
        count: earnings.length,
        history: earnings,
      },
      subscription: {
        active: subscriptionActive,
        period_end: activeSub?.period_end || null,
      },
      total_earnings: +totalEarnings.toFixed(2),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});