import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, TrendingUp, Clock, MessageSquare, Lightbulb, Wrench, Users, Bookmark, X, Flame,
  Trophy, Download, Loader2, BadgeIndianRupee, Plus, Sparkles, History,
} from 'lucide-react';
import { authFetch } from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/AuthContext';
import ConnectModal from '../components/ConnectModal';
import { PostCardSkeleton } from '../components/SkeletonLoaders';
import EmptyState from '../components/EmptyState';
import { REACTION_CONFIG, ReactionPill, Reactors } from '../components/Reactions';
import CommentThread from '../components/CommentThread';
import ValidationWidget from '../components/ValidationWidget';
import IdeaActionsMenu from '../components/IdeaActionsMenu';
import { BuildStatusBadge, LookingFor } from '../components/IdeaStatus';
import {
  asArray, displayTitle, imgFallback, parseApiDate, thumbUrl, timeAgo, validationHeadline,
} from '../lib/ideaDisplay';

const PER_PAGE = 12;
const CACHE_KEY = 'mi_feed_cache_v2';        // last default-feed response (instant repeat visits)
const LAST_SEEN_KEY = 'mi_feed_last_seen';   // for "new since your last visit"

const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

/* ─── Updates (read-only) ─── */
function UpdatesList({ entryId }) {
  const [updates, setUpdates] = useState(null);
  useEffect(() => {
    let alive = true;
    authFetch(`/api/catalogs/${entryId}/updates`)
      .then((r) => (r.ok ? r.json() : []))
      .then((u) => { if (alive) setUpdates(u); })
      .catch(() => { if (alive) setUpdates([]); });
    return () => { alive = false; };
  }, [entryId]);
  if (!updates) return <div className="py-3"><Loader2 size={16} className="animate-spin text-mi-text-secondary" /></div>;
  if (!updates.length) return <p className="py-2 text-sm text-mi-text-secondary">No progress updates yet.</p>;
  return (
    <ol className="space-y-3">
      {updates.map((u) => (
        <li key={u.id} className="rounded-xl bg-mi-bg/60 ring-1 ring-mi-border/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mi-accent font-medium capitalize">{u.update_type}</span>
            <span className="text-mi-text-secondary">{timeAgo(u.created_at)}</span>
          </div>
          <p className="text-sm text-mi-text-secondary mt-1.5 whitespace-pre-wrap">{u.content}</p>
        </li>
      ))}
    </ol>
  );
}

/* ─── Export-to-image modal (kept: it is a deliberate creation flow) ─── */
function SocialShareModal({ entry, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const title = displayTitle(entry);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0a0b', scale: 2, logging: false, useCORS: true });
      const link = document.createElement('a');
      link.download = `mindinspo-${entry.id.substring(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('Download failed', e); toast.error('Could not create the image'); }
    finally { setDownloading(false); }
  };

  const head = validationHeadline(entry.validation);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Export as image">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80" />
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }}
        className="relative z-10 w-full max-w-md bg-mi-surface border border-mi-border rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-mi-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Export as image</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-mi-text-secondary hover:text-white hover:bg-white/5" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div ref={cardRef} className="w-full aspect-[4/5] bg-mi-bg p-7 rounded-xl border border-mi-border flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <img src="/mindinspo-logo.svg" alt="" className="w-7 h-7 rounded-md" />
              <span className="font-heading text-lg tracking-widest text-white">MINDINSPO</span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-mi-accent mb-2">{entry.input_type === 'tool' ? 'Tool breakdown' : 'Idea'}</p>
            <h2 className="text-2xl font-semibold text-white leading-tight mb-3">{title}</h2>
            <p className="text-sm text-mi-text-secondary leading-relaxed line-clamp-6">{entry.tagline || entry.summary}</p>
            {head && (
              <p className="mt-4 text-sm text-white"><span className="font-semibold">{head.text}</span> would use it{head.topTier ? ` · ${head.topTier.label}` : ''}</p>
            )}
            <div className="mt-auto pt-5 border-t border-mi-border/60 flex items-center justify-between text-[11px] text-mi-text-secondary">
              <span>by {entry.author?.name || 'Builder'}</span>
              <span className="text-mi-accent">mindinspo.abhijit-singh.in</span>
            </div>
          </div>
          <button onClick={handleDownload} disabled={downloading} className="w-full mt-5 btn-primary justify-center py-3">
            {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {downloading ? 'Creating image…' : 'Download image'}
          </button>
          <p className="mt-3 text-xs text-mi-text-secondary text-center">Sized for Instagram, WhatsApp Status and LinkedIn.</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Sidebar ─── */
function TrendingSidebar({ entries, leaderboard, loading }) {
  const trending = [...entries].sort((a, b) => (b.idea_score || 0) - (a.idea_score || 0)).filter((e) => (e.idea_score || 0) > 0).slice(0, 5);
  return (
    <div className="space-y-6">
      {trending.length > 0 && (
        <section className="rounded-2xl ring-1 ring-mi-border bg-mi-surface/40 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4"><Flame size={15} className="text-mi-accent" /> Getting attention</h2>
          <ol className="space-y-3.5">
            {trending.map((idea, i) => (
              <li key={idea.id}>
                <Link to={`/idea/${idea.id}`} className="group flex items-start gap-3">
                  <span className="w-5 text-sm tabular-nums text-mi-text-muted group-hover:text-mi-accent">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-sm text-white font-medium truncate group-hover:text-mi-accent">{displayTitle(idea)}</span>
                    <span className="text-xs text-mi-text-secondary">{idea.input_type === 'tool' ? 'Tool' : 'Idea'} · score {idea.idea_score}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section className="rounded-2xl ring-1 ring-mi-border bg-mi-surface/40 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4"><Trophy size={15} className="text-amber-300" /> Top builders</h2>
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-8 rounded-lg bg-white/[0.04] animate-pulse" />)}</div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-mi-text-secondary">Publish an idea to appear here.</p>
        ) : (
          <ol className="space-y-3">
            {leaderboard.slice(0, 5).map((b) => (
              <li key={b.id}>
                <Link to={`/profile/${b.id}`} className="group flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-mi-surface-2 ring-1 ring-mi-border flex items-center justify-center text-xs font-semibold text-white overflow-hidden shrink-0">
                    {b.avatar_url ? <img src={b.avatar_url} alt="" className="w-full h-full object-cover" /> : (b.name || 'B')[0].toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-white truncate group-hover:text-mi-accent">{b.name}</span>
                    <span className="text-xs text-mi-text-secondary">{b.published_count} published · {b.score} pts</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

/* ─── Feed card ─── */
function ActionButton({ icon: Icon, label, count, active, activeCls, onClick, ariaLabel, expanded }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      aria-expanded={expanded}
      className={`h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-sm transition-colors ${
        active ? activeCls : 'text-mi-text-secondary hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && <span className="tabular-nums text-xs">{count}</span>}
    </button>
  );
}

function PostCard({ entry, isNew, onBookmark, onReact, onOpenConnect, onExport, onRemix, onTag, onValidation, promptLogin }) {
  const { isAuthenticated, user } = useAuth();
  const [panel, setPanel] = useState(null); // 'react' | 'discuss' | 'validate' | 'updates' | null
  const [commentCount, setCommentCount] = useState(entry.comment_count || 0);
  const viewedRef = useRef(false);
  const isOwner = user?.id === entry.user_id;
  const title = displayTitle(entry);
  const tech = asArray(entry.tech_stack);
  const tags = asArray(entry.tags);
  const totalReactions = entry.reactions ? Object.values(entry.reactions).reduce((a, b) => a + b, 0) : 0;
  const head = validationHeadline(entry.validation);
  const authorName = entry.author?.name || 'Builder';

  const topReactions = useMemo(() => REACTION_CONFIG
    .map((r) => ({ ...r, count: entry.reactions?.[r.type] || 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2), [entry.reactions]);

  const markViewed = () => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    authFetch(`/api/community/${entry.id}/view`, { method: 'POST', noRetry: true }).catch(() => {});
  };
  const toggle = (p) => { markViewed(); setPanel((cur) => (cur === p ? null : p)); };

  return (
    <article className="relative z-0 focus-within:z-30 rounded-2xl bg-mi-surface ring-1 ring-mi-border hover:ring-mi-border-light transition-shadow">
      {/* Header */}
      <div className="relative z-20 flex items-center gap-2.5 px-4 sm:px-5 pt-4">
        <Link to={`/profile/${entry.user_id}`} className="w-8 h-8 rounded-full bg-mi-surface-2 ring-1 ring-mi-border flex items-center justify-center overflow-hidden shrink-0" aria-label={`${authorName}'s profile`}>
          {entry.author?.avatar_url
            ? <img src={entry.author.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs font-semibold text-white">{authorName[0].toUpperCase()}</span>}
        </Link>
        <div className="min-w-0 flex-1 flex items-center gap-x-2 gap-y-0.5 flex-wrap text-sm">
          <Link to={`/profile/${entry.user_id}`} className="font-medium text-white truncate hover:underline">{authorName}</Link>
          <span className="text-mi-text-secondary">{timeAgo(entry.published_at || entry.created_at)}</span>
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${entry.input_type === 'tool' ? 'bg-sky-400/10 text-sky-300' : 'bg-mi-accent/10 text-mi-accent'}`}>
            {entry.input_type === 'tool' ? 'Tool' : 'Idea'}
          </span>
          <BuildStatusBadge status={entry.build_status} />
          {isNew && <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-400/10 text-emerald-300">New</span>}
        </div>
        <IdeaActionsMenu
          entry={entry}
          isOwner={isOwner}
          onConnect={onOpenConnect}
          onRemix={onRemix}
          onExport={onExport}
        />
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 pt-3 pb-3 grid grid-cols-[1fr,auto] gap-4">
        <div className="min-w-0">
          <h3 className="text-[17px] sm:text-lg font-semibold text-white leading-snug">
            <Link to={`/idea/${entry.id}`} onClick={markViewed} className="hover:text-mi-accent transition-colors after:absolute after:inset-0 after:content-[''] after:rounded-2xl focus:outline-none">
              {title}
            </Link>
          </h3>
          {(entry.tagline || entry.summary) && (
            <p className="mt-1 text-sm text-mi-text-secondary leading-relaxed line-clamp-2">{entry.tagline || entry.summary}</p>
          )}
          <div className="relative z-10 mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {tags.slice(0, 3).map((t) => (
              <button key={t} type="button" onClick={() => onTag(t)} className="text-mi-text-secondary hover:text-mi-accent">#{t}</button>
            ))}
            {!tags.length && tech.slice(0, 3).map((t) => <span key={t} className="text-mi-text-secondary">{t}</span>)}
            {entry.remix_count > 0 && <span className="text-mi-text-secondary">Remixed {entry.remix_count}×</span>}
          </div>
          {entry.looking_for?.length > 0 && <div className="mt-2"><LookingFor roles={entry.looking_for} /></div>}
        </div>
        {entry.image_url && (
          <Link to={`/idea/${entry.id}`} tabIndex={-1} aria-hidden="true" className="relative z-10 block w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden ring-1 ring-mi-border bg-mi-surface-2">
            <img
              src={thumbUrl(entry.image_url, 240)}
              alt=""
              loading="lazy"
              decoding="async"
              width="112" height="112"
              className="w-full h-full object-cover"
              onError={imgFallback(entry.image_url)}
            />
          </Link>
        )}
      </div>

      {/* Signals: community verdict + market check, at a glance */}
      {(topReactions.length > 0 || head) && (
        <div className="relative z-10 px-4 sm:px-5 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-mi-text-secondary">
          {topReactions.map((r) => (
            <span key={r.type} className="inline-flex items-center gap-1"><r.icon size={13} style={{ color: r.hex }} /> {r.label} <span className="tabular-nums">{r.count}</span></span>
          ))}
          {head && (
            <span className="inline-flex items-center gap-1"><BadgeIndianRupee size={13} className="text-emerald-300" />
              <span className="text-white font-medium tabular-nums">{head.text}</span> would use{head.topTier ? ` · ${head.topTier.label}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Actions: 3 primary + save; the rest live in the ⋯ menu */}
      <div className="relative z-10 px-2 sm:px-3 py-1.5 border-t border-mi-border/60 flex items-center">
        <ActionButton icon={Flame} label="React" count={totalReactions} active={panel === 'react' || (entry.user_reactions?.length > 0)} activeCls="text-amber-300 bg-amber-300/5" onClick={() => toggle('react')} expanded={panel === 'react'} ariaLabel={`React, ${totalReactions} reactions`} />
        <ActionButton icon={MessageSquare} label="Discuss" count={commentCount} active={panel === 'discuss'} activeCls="text-sky-300 bg-sky-300/5" onClick={() => toggle('discuss')} expanded={panel === 'discuss'} ariaLabel={`Discuss, ${commentCount} comments`} />
        {!isOwner && (
          <ActionButton icon={BadgeIndianRupee} label={entry.user_validation ? 'Validated' : 'Validate'} count={0} active={panel === 'validate' || !!entry.user_validation} activeCls="text-emerald-300 bg-emerald-300/5" onClick={() => toggle('validate')} expanded={panel === 'validate'} />
        )}
        {entry.updates_count > 0 && (
          <ActionButton icon={History} label="Updates" count={entry.updates_count} active={panel === 'updates'} activeCls="text-mi-accent bg-mi-accent/5" onClick={() => toggle('updates')} expanded={panel === 'updates'} />
        )}
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => onBookmark(entry.id)}
          aria-pressed={!!entry.bookmarked_by_user}
          aria-label={entry.bookmarked_by_user ? 'Saved' : 'Save'}
          className={`h-9 w-9 inline-flex items-center justify-center rounded-lg transition-colors ${entry.bookmarked_by_user ? 'text-mi-accent' : 'text-mi-text-secondary hover:text-white hover:bg-white/[0.04]'}`}
        >
          <Bookmark size={17} fill={entry.bookmarked_by_user ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Expanding panels */}
      <AnimatePresence initial={false}>
        {panel && (
          <motion.div
            key={panel}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 overflow-hidden border-t border-mi-border/60"
          >
            <div className="px-4 sm:px-5 py-4">
              {panel === 'react' && (
                <>
                  <p className="text-xs text-mi-text-secondary mb-2">What's your verdict?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {REACTION_CONFIG.map((r) => (
                      <span key={r.type} className="inline-flex items-center">
                        <ReactionPill r={r} count={entry.reactions?.[r.type] || 0} isActive={entry.user_reactions?.includes(r.type)} canReact={isAuthenticated} onReact={(type) => onReact(entry.id, type)} />
                        <span className="sr-only">{r.label}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-mi-text-secondary">
                    {REACTION_CONFIG.map((r) => <span key={r.type} className="inline-flex items-center gap-1"><r.icon size={11} /> {r.label}</span>)}
                  </div>
                  <Reactors entryId={entry.id} open={totalReactions > 0} />
                </>
              )}
              {panel === 'discuss' && <CommentThread entryId={entry.id} owner={entry.author} onCountChange={setCommentCount} maxHeight={360} />}
              {panel === 'validate' && (
                <ValidationWidget entry={entry} isOwner={isOwner} isAuthenticated={isAuthenticated} onRequireAuth={promptLogin}
                  onChange={(validation, user_validation) => onValidation(entry.id, validation, user_validation)} />
              )}
              {panel === 'updates' && <UpdatesList entryId={entry.id} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

const SORTS = [
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'popular', label: 'Popular', icon: TrendingUp },
  { value: 'trending', label: 'Trending', icon: Flame },
];
const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'idea', label: 'Ideas', icon: Lightbulb },
  { value: 'tool', label: 'Tools', icon: Wrench },
];

function Chip({ on, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-sm transition-colors ${
        on ? 'bg-white/[0.08] text-white ring-1 ring-mi-border-light' : 'text-mi-text-secondary hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {Icon && <Icon size={14} />}{children}
    </button>
  );
}

export default function CommunityPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isDefaultQuery = (s, t, q, tag) => s === 'recent' && t === 'all' && !q && !tag;

  // Instant first paint: last cached default feed (repeat visits). The build-time
  // snapshot below covers first-time visitors while the API cold-starts.
  const cached = useMemo(() => { try { return JSON.parse(safeGet(CACHE_KEY) || 'null'); } catch { return null; } }, []);
  const [entries, setEntries] = useState(cached?.entries || []);
  const [stale, setStale] = useState(!!cached);
  const [loading, setLoading] = useState(!cached);
  const [loadingMore, setLoadingMore] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterType, setFilterType] = useState('all');
  const [tagFilter, setTagFilter] = useState(params.get('tag') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(cached?.pages || 1);
  const [total, setTotal] = useState(cached?.total || 0);
  const [connectModal, setConnectModal] = useState({ open: false, entryId: null, ideaTitle: '' });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [exportEntry, setExportEntry] = useState(null);
  const [popularTags, setPopularTags] = useState([]);
  const sentinel = useRef(null);
  const reqId = useRef(0);

  // Old notification links used /community?post=<id>; send them to the idea page.
  useEffect(() => {
    const post = params.get('post');
    if (post) navigate(`/idea/${post}`, { replace: true });
  }, [params, navigate]);

  // "New since your last visit": read the previous timestamp once, then move it forward.
  const lastSeen = useMemo(() => Number(safeGet(LAST_SEEN_KEY) || 0), []);
  useEffect(() => { const t = setTimeout(() => safeSet(LAST_SEEN_KEY, String(Date.now())), 4000); return () => clearTimeout(t); }, []);

  // First-time visitors: show the build-time snapshot while the API wakes up.
  useEffect(() => {
    if (cached) return;
    fetch('/feed-snapshot.json').then((r) => (r.ok ? r.json() : null)).then((snap) => {
      if (snap?.entries?.length) {
        setEntries((cur) => (cur.length ? cur : snap.entries));
        setTotal((t) => t || snap.total || 0);
        setStale(true);
        setLoading(false);
      }
    }).catch(() => {});
  }, [cached]);

  // Debounce search typing.
  useEffect(() => { const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300); return () => clearTimeout(t); }, [searchInput]);

  const fetchPage = useCallback(async (p, { replace }) => {
    const id = ++reqId.current;
    if (replace) { setError(false); setSlow(false); } else setLoadingMore(true);
    const slowTimer = setTimeout(() => { if (id === reqId.current) setSlow(true); }, 3500);
    try {
      let url;
      if (sortBy === 'following') url = `/api/feed/following?page=${p}&per_page=${PER_PAGE}`;
      else {
        const params = new URLSearchParams({ page: String(p), per_page: String(PER_PAGE), sort: sortBy, type: filterType });
        if (searchQuery) params.set('q', searchQuery);
        if (tagFilter) params.set('tag', tagFilter);
        url = `/api/community/feed?${params}`;
      }
      const res = await authFetch(url);
      if (id !== reqId.current) return;
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const list = data.entries || [];
      setEntries((cur) => {
        if (replace) return list;
        const seen = new Set(cur.map((e) => e.id));
        return [...cur, ...list.filter((e) => !seen.has(e.id))];
      });
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
      setStale(false);
      if (replace && p === 1 && isDefaultQuery(sortBy, filterType, searchQuery, tagFilter)) {
        safeSet(CACHE_KEY, JSON.stringify({ entries: list, pages: data.pages, total: data.total, at: Date.now() }));
      }
    } catch (e) {
      if (id === reqId.current && replace) setError(true);
      console.error('Failed to fetch feed', e);
    } finally {
      clearTimeout(slowTimer);
      if (id === reqId.current) { setLoading(false); setLoadingMore(false); setSlow(false); }
    }
  }, [sortBy, filterType, searchQuery, tagFilter]);

  // Any filter change: back to page 1, replace the list.
  useEffect(() => {
    setPage(1);
    if (!isDefaultQuery(sortBy, filterType, searchQuery, tagFilter) || !entries.length) setLoading(true);
    fetchPage(1, { replace: true });
  }, [fetchPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !loading && !loadingMore && !stale && page < totalPages) {
        const next = page + 1;
        setPage(next);
        fetchPage(next, { replace: false });
      }
    }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [page, totalPages, loading, loadingMore, stale, fetchPage]);

  useEffect(() => {
    authFetch('/api/community/leaderboard').then((r) => (r.ok ? r.json() : [])).then(setLeaderboard)
      .catch(() => {}).finally(() => setLoadingLeaderboard(false));
    authFetch('/api/community/tags').then((r) => (r.ok ? r.json() : [])).then(setPopularTags).catch(() => {});
  }, []);

  const promptLogin = useCallback((verb = 'do that') => {
    toast((t) => (
      <span className="flex items-center gap-3">
        <span className="text-sm">Sign in to {verb}.</span>
        <button onClick={() => { toast.dismiss(t.id); navigate('/login'); }} className="px-2.5 py-1 rounded-md bg-mi-accent text-white text-xs font-medium hover:opacity-90">Sign in</button>
      </span>
    ), { id: 'auth-prompt', duration: 4000 });
  }, [navigate]);

  const patch = (id, fn) => setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...fn(e) } : e)));

  const handleBookmark = async (entryId) => {
    if (!isAuthenticated) { promptLogin('save ideas'); return; }
    patch(entryId, (e) => ({ bookmarked_by_user: !e.bookmarked_by_user }));
    try {
      const res = await authFetch(`/api/community/${entryId}/bookmark`, { method: 'POST' });
      if (res.ok) { const d = await res.json(); patch(entryId, () => ({ bookmarked_by_user: d.bookmarked })); toast.success(d.bookmarked ? 'Saved to your list' : 'Removed from saved', { id: `bm-${entryId}` }); }
    } catch (e) { console.error(e); }
  };

  const handleReact = async (entryId, type) => {
    if (!isAuthenticated) { promptLogin('react to ideas'); return; }
    patch(entryId, (e) => {
      const had = (e.user_reactions || []).includes(type);
      const c = e.reactions?.[type] || 0;
      return {
        user_reactions: had ? e.user_reactions.filter((r) => r !== type) : [...(e.user_reactions || []), type],
        reactions: { ...(e.reactions || {}), [type]: had ? Math.max(0, c - 1) : c + 1 },
      };
    });
    try {
      const res = await authFetch(`/api/community/${entryId}/react`, { method: 'POST', body: JSON.stringify({ reaction_type: type }) });
      if (res.ok) { const d = await res.json(); patch(entryId, () => ({ reactions: d.reactions, user_reactions: d.user_reactions })); }
    } catch (e) { console.error(e); }
  };

  const handleRemix = async (entry) => {
    if (!isAuthenticated) { promptLogin('remix ideas'); return; }
    const t = toast.loading('Remixing idea…');
    try {
      const res = await authFetch(`/api/catalogs/${entry.id}/remix`, { method: 'POST' });
      if (res.ok) { toast.success('Remixed into your catalog as a draft', { id: t }); navigate('/dashboard'); }
      else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Could not remix', { id: t }); }
    } catch { toast.error('Could not remix', { id: t }); }
  };

  const filtersActive = !isDefaultQuery(sortBy, filterType, searchQuery, tagFilter);
  const newCount = lastSeen ? entries.filter((e) => parseApiDate(e.published_at || e.created_at).getTime() > lastSeen).length : 0;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-[2.5rem] sm:text-5xl tracking-wide text-white leading-none">
              EXPLORE <span className="text-mi-accent">/</span> IDEAS
            </h1>
            <p className="mt-2 text-sm text-mi-text-secondary max-w-lg">
              Real ideas from builders, researched by AI. Validate them, discuss, and find a project partner.
              {total > 0 && <span className="text-white"> {total} published.</span>}
            </p>
          </div>
          {isAuthenticated && (
            <Link to="/publish" className="btn-primary shrink-0 self-start sm:self-auto"><Plus size={16} /> Publish an idea</Link>
          )}
        </header>

        {/* Toolbar */}
        <div className="sticky top-16 lg:top-20 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-mi-bg border-b border-mi-border/70 mb-6 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mi-text-secondary" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search ideas and tools"
                aria-label="Search ideas and tools"
                className="w-full h-10 rounded-xl bg-mi-surface ring-1 ring-mi-border pl-10 pr-3 text-sm text-white placeholder:text-mi-text-muted focus:outline-none focus:ring-2 focus:ring-mi-accent/40"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1" role="toolbar" aria-label="Sort and filter">
              {SORTS.map((s) => <Chip key={s.value} on={sortBy === s.value} onClick={() => setSortBy(s.value)} icon={s.icon}>{s.label}</Chip>)}
              {isAuthenticated && <Chip on={sortBy === 'following'} onClick={() => setSortBy('following')} icon={Users}>Following</Chip>}
              <span className="shrink-0 w-px h-5 bg-mi-border mx-1.5" aria-hidden="true" />
              {TYPES.map((t) => <Chip key={t.value} on={filterType === t.value} onClick={() => setFilterType(t.value)} icon={t.icon}>{t.label}</Chip>)}
            </div>
          </div>
          {(popularTags.length > 0 || tagFilter) && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
              {tagFilter ? (
                <button type="button" onClick={() => setTagFilter('')} className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs bg-mi-accent/15 text-mi-accent ring-1 ring-mi-accent/30">
                  #{tagFilter} <X size={12} /><span className="sr-only">Clear tag filter</span>
                </button>
              ) : popularTags.slice(0, 14).map((t) => (
                <button key={t.tag} type="button" onClick={() => setTagFilter(t.tag)} className="shrink-0 h-8 px-3 rounded-full text-xs text-mi-text-secondary ring-1 ring-mi-border hover:text-white hover:ring-mi-border-light">
                  #{t.tag} <span className="text-mi-text-muted">{t.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),300px] gap-8 items-start">
          <main aria-live="polite" aria-busy={loading}>
            {stale && !filtersActive && entries.length > 0 && (
              <p className="mb-3 inline-flex items-center gap-2 text-xs text-mi-text-secondary">
                <Loader2 size={13} className="animate-spin" /> Checking for new ideas…
              </p>
            )}
            {!loading && newCount > 0 && !filtersActive && (
              <p className="mb-3 inline-flex items-center gap-2 text-xs text-emerald-300"><Sparkles size={13} /> {newCount} new since your last visit</p>
            )}

            {loading ? (
              <div className="space-y-3">
                {slow && (
                  <div className="rounded-xl ring-1 ring-mi-border bg-mi-surface/60 px-4 py-3 text-sm text-mi-text-secondary flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin text-mi-accent" />
                    Waking up the server. The first load after a quiet spell can take up to 30 seconds.
                  </div>
                )}
                {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
              </div>
            ) : error && entries.length === 0 ? (
              <div className="rounded-2xl ring-1 ring-mi-border bg-mi-surface/50 p-8 text-center">
                <p className="text-white font-medium">Couldn't load ideas</p>
                <p className="mt-1 text-sm text-mi-text-secondary">Check your connection and try again.</p>
                <button type="button" onClick={() => { setLoading(true); fetchPage(1, { replace: true }); }} className="btn-primary mt-4">Try again</button>
              </div>
            ) : entries.length === 0 ? (
              <div className="py-10 rounded-2xl border border-dashed border-mi-border bg-mi-surface/40">
                <EmptyState
                  icon={Users}
                  title={sortBy === 'following' ? 'YOUR FEED IS QUIET' : searchQuery ? 'NO MATCHES' : tagFilter ? 'NOTHING WITH THIS TAG YET' : 'NO IDEAS YET'}
                  description={sortBy === 'following'
                    ? 'Follow builders from their profiles to see their newest ideas here.'
                    : searchQuery ? `Nothing matches "${searchQuery}". Try a broader word, or browse by tag.`
                    : tagFilter ? 'No published ideas use this tag yet.'
                    : 'Publish the first idea and get AI research plus real feedback.'}
                  action={sortBy === 'following'
                    ? <button onClick={() => setSortBy('recent')} className="btn-primary mt-4"><Users size={16} /> Browse all ideas</button>
                    : searchQuery || tagFilter
                    ? <button onClick={() => { setSearchInput(''); setTagFilter(''); }} className="btn-secondary mt-4">Clear filters</button>
                    : <Link to={isAuthenticated ? '/publish' : '/login?mode=register'} className="btn-primary mt-4"><Plus size={16} /> Share an idea</Link>}
                />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <PostCard
                      key={entry.id}
                      entry={entry}
                      isNew={!!lastSeen && parseApiDate(entry.published_at || entry.created_at).getTime() > lastSeen}
                      onBookmark={handleBookmark}
                      onReact={handleReact}
                      onOpenConnect={(e) => (isAuthenticated ? setConnectModal({ open: true, entryId: e.id, ideaTitle: displayTitle(e) }) : promptLogin('collaborate on ideas'))}
                      onExport={setExportEntry}
                      onRemix={handleRemix}
                      onTag={(t) => { setTagFilter(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      onValidation={(id, validation, user_validation) => patch(id, () => ({ validation, user_validation }))}
                      promptLogin={promptLogin}
                    />
                  ))}
                </div>
                <div ref={sentinel} className="h-px" aria-hidden="true" />
                <div className="py-8 text-center text-sm text-mi-text-secondary">
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading more</span>
                  ) : page < totalPages && !stale ? (
                    <button type="button" onClick={() => { const n = page + 1; setPage(n); fetchPage(n, { replace: false }); }} className="btn-secondary">Load more</button>
                  ) : !stale ? (
                    <span>You're all caught up.</span>
                  ) : null}
                </div>
              </>
            )}
          </main>

          <aside className="hidden lg:block sticky top-48">
            <TrendingSidebar entries={entries} leaderboard={leaderboard} loading={loadingLeaderboard} />
          </aside>
        </div>
      </div>

      <ConnectModal
        isOpen={connectModal.open}
        onClose={() => { setConnectModal({ open: false, entryId: null, ideaTitle: '' }); fetchPage(1, { replace: true }); }}
        entryId={connectModal.entryId}
        ideaTitle={connectModal.ideaTitle}
      />

      <AnimatePresence>
        {exportEntry && <SocialShareModal entry={exportEntry} onClose={() => setExportEntry(null)} />}
      </AnimatePresence>
    </div>
  );
}
