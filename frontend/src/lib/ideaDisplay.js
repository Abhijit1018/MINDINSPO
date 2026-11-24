// Shared presentation helpers for ideas (feed cards, idea page, home).
import { Compass, Hammer, Rocket } from 'lucide-react';

/** The AI-written title when present; otherwise a tidied-up version of the
 *  user's raw prompt (sentence case, no trailing punctuation, capped). */
export function displayTitle(entry) {
  if (entry?.title) return entry.title;
  const raw = String(entry?.raw_input || 'Untitled idea').trim().replace(/\s+/g, ' ').replace(/[.?!]+$/, '');
  const capped = raw.length > 80 ? `${raw.slice(0, 77).trimEnd()}…` : raw;
  return capped.charAt(0).toUpperCase() + capped.slice(1);
}

/** True when the raw prompt adds information beyond the displayed title. */
export function showPrompt(entry) {
  return Boolean(entry?.title && entry?.raw_input && entry.raw_input.trim().toLowerCase() !== entry.title.trim().toLowerCase());
}

/** Resized, WebP thumbnail through the wsrv.nl image proxy (public CDN).
 *  Generated concept images are ~1MB 1024px JPEG/PNG; feed cards need ~20KB. */
export function thumbUrl(url, width = 480) {
  if (!url || !/^https?:\/\//.test(url)) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=78`;
}

/** <img onError> handler: fall back from the proxy to the original once, then hide. */
export function imgFallback(original) {
  return (e) => {
    const img = e.currentTarget;
    if (original && img.dataset.fallback !== '1') {
      img.dataset.fallback = '1';
      img.src = original;
    } else {
      img.style.display = 'none';
    }
  };
}

/** The API emits naive UTC ISO strings ("2026-11-24T10:19:17.123") with no
 *  zone. `new Date()` reads those as LOCAL time, which made fresh content show
 *  "5h ago" in India (UTC+5:30). Treat zone-less timestamps as UTC. */
export function parseApiDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const s = String(dateStr);
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - parseApiDate(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return parseApiDate(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export function asArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

export const BUILD_STATUS = {
  exploring: { label: 'Exploring', icon: Compass, cls: 'text-sky-300 bg-sky-400/10 ring-sky-400/20' },
  building: { label: 'Building', icon: Hammer, cls: 'text-amber-300 bg-amber-400/10 ring-amber-400/20' },
  launched: { label: 'Launched', icon: Rocket, cls: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/20' },
};

export const ROLE_LABEL = {
  co_founder: 'Co-founder',
  developer: 'Developer',
  designer: 'Designer',
  advisor: 'Advisor',
  investor: 'Investor',
};

export const PAY_TIERS = [
  { value: 0, label: 'Free only' },
  { value: 99, label: '₹99/mo' },
  { value: 499, label: '₹499/mo' },
  { value: 1999, label: '₹1,999+/mo' },
];

/** "64% would use · most would pay ₹499/mo" style summary, or null. */
export function validationHeadline(v) {
  if (!v || !v.total) return null;
  const yes = v.use?.yes || 0;
  const maybe = v.use?.maybe || 0;
  const pct = Math.round(((yes + maybe * 0.5) / v.total) * 100);
  let topTier = null;
  let best = 0;
  for (const t of PAY_TIERS) {
    const c = v.pay?.[String(t.value)] || 0;
    if (c > best) { best = c; topTier = t; }
  }
  // Percentages from 1-4 votes ("100% would use") overstate the signal; show counts.
  const small = v.total < 5;
  const text = small ? `${yes} of ${v.total}` : `${pct}%`;
  return { pct, text, small, voters: v.total, topTier: topTier && topTier.value > 0 ? topTier : null };
}

/** Canonical share URL. The backend /i/<id> route serves Open Graph tags so the
 *  link unfurls with title + image on WhatsApp, X and LinkedIn. */
export function shareUrlFor(entry, apiBase) {
  return `${apiBase || window.location.origin}/i/${entry.id}`;
}
