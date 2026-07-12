import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { firebase_uid } = await req.json();
    if (!firebase_uid) return Response.json({ error: "firebase_uid required" }, { status: 400 });

    // Run all independent queries in parallel for faster response
    const [profiles, earnings, subs, pendingWithdrawals] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ firebase_uid }, null, 1),
      base44.asServiceRole.entities.ReferralEarning.filter({ earner_id: firebase_uid }, "-created_date", 100),
      base44.asServiceRole.entities.Subscription.filter({ user_id: firebase_uid, status: "active" }, "-created_date", 1),
      base44.asServiceRole.entities.WithdrawalRequest.filter({ user_id: firebase_uid }, "-created_date", 50),
    ]);

    if (profiles.length === 0) return Response.json({ error: "Profile not found" }, { status: 404 });
    const profile = profiles[0];

    // Provider earnings (linked by phone number — depends on profile)
    let provider = null;
    if (profile.phone) {
      const providers = await base44.asServiceRole.entities.ServiceProvider.filter(
        { phone: profile.phone }, null, 1
      );
      provider = providers[0] || null;
    }
    const referralTotal = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
    const byLevel = [0, 0, 0];
    earnings.forEach((e) => {
      if (e.level >= 1 && e.level <= 3) byLevel[e.level - 1] += e.amount || 0;
    });

    const activeSub = subs[0];
    const subscriptionActive = !!(activeSub && new Date(activeSub.period_end) > new Date());

    const providerEarnings = provider?.earnings || 0;
    const totalEarnings = +providerEarnings + referralTotal;

    const pendingAmount = pendingWithdrawals.reduce((s, w) => s + (w.amount || 0), 0);
    const availableBalance = +(totalEarnings - pendingAmount).toFixed(2);

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
      available_balance: availableBalance,
      pending_withdrawals: pendingAmount,
      withdrawal_history: pendingWithdrawals.map((w) => ({
        id: w.id,
        amount: w.amount || 0,
        provider: w.provider || "M-PESA",
        status: w.status || "pending",
        tracking_id: w.tracking_id || null,
        created_date: w.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});