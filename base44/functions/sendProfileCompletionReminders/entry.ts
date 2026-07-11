import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all users who haven't completed profile
    const allProfiles = await base44.entities.UserProfile.filter({ 
      profile_completed: false 
    });

    // Get all users without active subscription
    const allSubscriptions = await base44.entities.Subscription.filter({ 
      status: 'active' 
    });
    const subscribedUserIds = new Set(allSubscriptions.map(s => s.user_id));

    // Find users who need reminders
    const incompleteProfiles = allProfiles.filter(p => !p.profile_completed);
    const unsubscribedUsers = allProfiles.filter(p => 
      p.profile_completed && !subscribedUserIds.has(p.firebase_uid)
    );

    // Get device tokens for notifications
    const allTokens = await base44.entities.DeviceToken.list();
    
    let notificationsSent = 0;

    // Send notifications to users with incomplete profiles
    for (const profile of incompleteProfiles) {
      const tokens = allTokens.filter(t => t.user_id === profile.firebase_uid);
      for (const token of tokens) {
        try {
          await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${Deno.env.get('FIREBASE_SERVICE_ACCOUNT')}`
            },
            body: JSON.stringify({
              to: token.token,
              notification: {
                title: 'Complete Your Profile',
                body: 'Finish setting up your profile to start posting or finding jobs on Neighbourhood Labour Connect!'
              },
              data: {
                type: 'profile_completion',
                action: 'complete_profile'
              }
            })
          });
          notificationsSent++;
        } catch (e) {
          console.error('Failed to send notification:', e);
        }
      }
    }

    // Send notifications to users without subscription
    for (const profile of unsubscribedUsers) {
      const tokens = allTokens.filter(t => t.user_id === profile.firebase_uid);
      for (const token of tokens) {
        try {
          await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${Deno.env.get('FIREBASE_SERVICE_ACCOUNT')}`
            },
            body: JSON.stringify({
              to: token.token,
              notification: {
                title: 'Subscribe to Get Started',
                body: 'Your profile is ready! Subscribe for just $1/month to start posting or finding jobs.'
              },
              data: {
                type: 'subscription_reminder',
                action: 'subscribe'
              }
            })
          });
          notificationsSent++;
        } catch (e) {
          console.error('Failed to send notification:', e);
        }
      }
    }

    return Response.json({ 
      success: true, 
      notificationsSent,
      incompleteProfiles: incompleteProfiles.length,
      unsubscribedUsers: unsubscribedUsers.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});