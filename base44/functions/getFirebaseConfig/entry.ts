Deno.serve(async (req) => {
  try {
    return Response.json({
      apiKey: Deno.env.get("FIREBASE_API_KEY"),
      authDomain: Deno.env.get("FIREBASE_AUTH_DOMAIN"),
      projectId: Deno.env.get("FIREBASE_PROJECT_ID"),
      storageBucket: Deno.env.get("FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: Deno.env.get("FIREBASE_MESSAGING_SENDER_ID"),
      appId: Deno.env.get("FIREBASE_APP_ID"),
      vapidKey: Deno.env.get("FIREBASE_VAPID_KEY"),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});