// Prebuild: bake the latest public feed into /feed-snapshot.json so a first-time
// visitor sees real ideas instantly while the API (Render free tier) wakes up.
// Fail-soft: any error just skips the snapshot; the build never breaks on it.
import { writeFile, mkdir } from 'node:fs/promises';

const api = (process.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const out = new URL('../public/feed-snapshot.json', import.meta.url);

if (!api || /localhost|127\.0\.0\.1/.test(api)) {
  console.log('[snapshot] VITE_API_BASE_URL not set to a public API, skipping');
  process.exit(0);
}

const fetchWithTimeout = async (url, ms) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); } finally { clearTimeout(t); }
};

try {
  // A cold Render instance can take ~45s to answer the first request.
  const res = await fetchWithTimeout(`${api}/api/community/feed?per_page=12&sort=recent&type=all`, 75000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // Strip viewer-specific fields; the snapshot is the same for everyone.
  const entries = (data.entries || []).map(({ liked_by_user, bookmarked_by_user, user_reactions, connect_sent, user_validation, ...e }) => e);
  await mkdir(new URL('../public/', import.meta.url), { recursive: true });
  await writeFile(out, JSON.stringify({ entries, total: data.total || entries.length, at: new Date().toISOString() }));
  console.log(`[snapshot] wrote ${entries.length} ideas`);
} catch (e) {
  console.log(`[snapshot] skipped: ${e.message}`);
}
