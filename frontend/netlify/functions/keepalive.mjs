// Netlify Scheduled Function: keeps the Render free-tier backend warm and
// pings Supabase (via /api/keepalive) so neither spins down / auto-pauses.
//
// Replaces the GitHub Actions cron as the primary pinger: GitHub throttled it
// to roughly every 8h (never inside Render's 15-min idle window) and disabled
// it entirely after 60 days without a commit.
//
// Optional env on Netlify: BACKEND_URL (defaults to the prod Render URL).
const BACKEND = (process.env.BACKEND_URL || 'https://idea-incubator-back.onrender.com').replace(/\/$/, '');

export default async () => {
  const started = Date.now();
  try {
    // Scheduled functions get ~30s. A cold Render boot takes longer, but the
    // request alone triggers the wake-up, so a timeout here is still a success.
    const res = await fetch(`${BACKEND}/api/keepalive`, { signal: AbortSignal.timeout(25000) });
    const body = await res.text();
    console.log(`keepalive ${res.status} in ${Date.now() - started}ms ${body.slice(0, 200)}`);
  } catch (err) {
    console.log(`keepalive wake-up sent, no reply within ${Date.now() - started}ms: ${err.message}`);
  }
  return new Response('ok');
};

// Every 10 minutes — inside Render's 15-minute idle spin-down window.
export const config = { schedule: '*/10 * * * *' };
