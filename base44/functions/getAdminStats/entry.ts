import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [onlineUsers, allPresence, activeSubs, recentNotifications, failedNotifications, totalUsers] = await Promise.all([
      base44.asServiceRole.entities.UserPresence.filter({ is_online: true }, '-last_active', 500),
      base44.asServiceRole.entities.UserPresence.list('-last_active', 500),
      base44.asServiceRole.entities.Subscription.filter({ status: 'active' }, null, 1000),
      base44.asServiceRole.entities.NotificationLog.list('-created_date', 200),
      base44.asServiceRole.entities.NotificationLog.filter({ status: 'failed' }, '-created_date', 20),
      base44.asServiceRole.entities.UserProfile.list(null, 1)
    ]);

    const onlineProviders = onlineUsers.filter(u => u.role === 'provider');
    const onlineCustomers = onlineUsers.filter(u => u.role === 'customer');

    const sentCount = recentNotifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
    const failedCount = recentNotifications.filter(n => n.status === 'failed').length;
    const deliveryRate = recentNotifications.length > 0
      ? ((sentCount / recentNotifications.length) * 100).toFixed(1)
      : '100.0';

    // Breakdown by notification type
    const typeBreakdown = {};
    for (const n of recentNotifications) {
      if (!typeBreakdown[n.type]) typeBreakdown[n.type] = { sent: 0, failed: 0 };
      if (n.status === 'failed') typeBreakdown[n.type].failed++;
      else typeBreakdown[n.type].sent++;
    }

    return Response.json({
      onlineUsersCount: onlineUsers.length,
      onlineProvidersCount: onlineProviders.length,
      onlineCustomersCount: onlineCustomers.length,
      activeSubscriptionsCount: activeSubs.length,
      notificationStats: {
        total: recentNotifications.length,
        sent: sentCount,
        failed: failedCount,
        deliveryRate: `${deliveryRate}%`,
        typeBreakdown
      },
      failedNotifications: failedNotifications.map(n => ({
        type: n.type,
        title: n.title,
        error: n.error,
        user_name: n.user_name,
        created_date: n.created_date
      })),
      onlineUsers: onlineUsers.map(u => ({
        name: u.user_name,
        role: u.role,
        provider_status: u.provider_status,
        last_active: u.last_active
      })),
      allUsersPresence: allPresence.map(u => ({
        user_id: u.user_id,
        name: u.user_name,
        role: u.role,
        is_online: u.is_online,
        provider_status: u.provider_status,
        last_active: u.last_active
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});