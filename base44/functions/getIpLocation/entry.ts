import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get client IP from request headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // Call ipapi.co from the backend (no CORS issues)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    // Return location data
    return Response.json({
      lat: data.latitude || null,
      lng: data.longitude || null,
      location_name: [data.city, data.region, data.country_name].filter(Boolean).join(', ') || 'Unknown location'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});