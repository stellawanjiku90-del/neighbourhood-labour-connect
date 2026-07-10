import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get client IP from request headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : null;

    // Require a client IP — never call the bare /json/ endpoint, which would
    // geolocate the server's datacenter and disclose its location.
    if (!ip) {
      return Response.json({ error: 'Could not determine client IP' }, { status: 400 });
    }
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch {
      return Response.json({ error: 'Geolocation service unavailable' }, { status: 502 });
    }

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