import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, GitFork, Sparkles, Layers, ThumbsUp, ThumbsDown, ExternalLink, Bookmark, Workflow,
  MessageSquare, Boxes, Handshake, Pencil, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { ReactionRow, Reactors } from '../components/Reactions';
import CommentThread from '../components/CommentThread';
import ValidationWidget from '../components/ValidationWidget';
import IdeaActionsMenu from '../components/IdeaActionsMenu';
import ConnectModal from '../components/ConnectModal';
import { BuildStatusBadge, LookingFor } from '../components/IdeaStatus';
import { asArray, displayTitle, imgFallback, showPrompt, thumbUrl, timeAgo } from '../lib/ideaDisplay';

// Mermaid is ~600KB; only load it when an idea actually has a diagram.
const MermaidDiagram = lazy(() => import('../components/MermaidDiagram'));

function Section({ icon: Icon, title, id, children }) {
  return (
    <section id={id} className="scroll-mt-28" aria-labelledby={id ? `${id}-h` : undefined}>
      <h2 id={id ? `${id}-h` : undefined} className="flex items-center gap-2 text-base font-semibold text-white mb-3">
        {Icon && <Icon size={17} className="text-mi-text-secondary" />} {title}
      </h2>
      {children}
    </section>
  );
}

function RelatedList({ title, items }) {
  if (!items?.length) return null;
  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <ul className="divide-y divide-mi-border/70 rounded-2xl ring-1 ring-mi-border bg-mi-surface/50 overflow-hidden">
        {items.map((r) => (
          <li key={r.id}>
            <Link to={`/idea/${r.id}`} className="flex items-center gap-3 p-3 hover:bg-white/[0.03] transition-colors">
              {r.image_url ? (
                <img src={thumbUrl(r.image_url, 120)} alt="" loading="lazy" width="48" height="48" className="w-12 h-12 rounded-lg object-cover ring-1 ring-mi-border shrink-0" onError={imgFallback(r.image_url)} />
              ) : (
                <span className="w-12 h-12 rounded-lg bg-mi-surface-2 ring-1 ring-mi-border shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white truncate">{displayTitle(r)}</span>
                <span className="block text-xs text-mi-text-secondary truncate">{r.tagline || r.summary}</span>
              </span>
              <ArrowRight size={15} className="text-mi-text-muted shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function IdeaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [entry, setEntry] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [related, setRelated] = useState(null);
  const [connectOpen, setConnectOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`/api/community/entry/${id}`);
      if (res.ok) { setEntry(await res.json()); setState('ready'); }
      else setState(res.status === 404 ? 'notfound' : 'error');
    } catch { setState('error'); }
  }, [id]);

  // Navigating between related ideas reuses this component; stale data is
  // detected by id below instead of being reset inside an effect.
  useEffect(() => { load(); window.scrollTo(0, 0); }, [load]);
  useEffect(() => {
    authFetch(`/api/community/entry/${id}/related`).then((r) => (r.ok ? r.json() : null))
      .then((d) => setRelated(d ? { ...d, forId: id } : null)).catch(() => {});
  }, [id]);
  useEffect(() => {
    if (state === 'ready' && location.hash) {
      requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }));
    }
  }, [state, location.hash]);
  useEffect(() => {
    if (entry) document.title = `${displayTitle(entry)} · MindInspo`;
    return () => { document.title = 'MindInspo — Where Ideas Take Shape'; };
  }, [entry]);

  const promptLogin = (verb = 'do that') => {
    toast((t) => (
      <span className="flex items-center gap-3">
        <span className="text-sm">Sign in to {verb}.</span>
        <button onClick={() => { toast.dismiss(t.id); navigate('/login'); }} className="px-2.5 py-1 rounded-md bg-mi-accent text-white text-xs font-medium hover:opacity-90">Sign in</button>
      </span>
    ), { id: 'auth-prompt', duration: 4000 });
  };

  const react = async (type) => {
    if (!isAuthenticated) { promptLogin('react to ideas'); return; }
    try {
      const res = await authFetch(`/api/community/${id}/react`, { method: 'POST', body: JSON.stringify({ reaction_type: type }) });
      if (res.ok) { const d = await res.json(); setEntry((e) => ({ ...e, reactions: d.reactions, user_reactions: d.user_reactions })); }
    } catch (e) { console.error('react', e); }
  };

  const bookmark = async () => {
    if (!isAuthenticated) { promptLogin('save ideas'); return; }
    setEntry((e) => ({ ...e, bookmarked_by_user: !e.bookmarked_by_user }));
    try {
      const res = await authFetch(`/api/community/${id}/bookmark`, { method: 'POST' });
      if (res.ok) { const d = await res.json(); setEntry((e) => ({ ...e, bookmarked_by_user: d.bookmarked })); toast.success(d.bookmarked ? 'Saved to your list' : 'Removed from saved', { id: 'bm' }); }
    } catch (e) { console.error(e); }
  };

  const remix = async () => {
    if (!isAuthenticated) { promptLogin('remix ideas'); return; }
    const t = toast.loading('Remixing…');
    try {
      const res = await authFetch(`/api/catalogs/${id}/remix`, { method: 'POST' });
      if (res.ok) { toast.success('Remixed into your catalog', { id: t }); navigate('/dashboard'); }
      else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Could not remix', { id: t }); }
    } catch { toast.error('Could not remix', { id: t }); }
  };

  const isStale = entry && entry.id !== id;
  if (state === 'loading' || isStale) {
    return (
      <div className="pt-28 pb-16 max-w-3xl mx-auto px-4 sm:px-6 animate-pulse" aria-busy="true">
        <div className="h-4 w-24 rounded bg-white/[0.06] mb-8" />
        <div className="h-9 w-3/4 rounded bg-white/[0.06] mb-3" />
        <div className="h-5 w-1/2 rounded bg-white/[0.06] mb-8" />
        <div className="h-64 rounded-2xl bg-white/[0.04] mb-6" />
        <div className="space-y-2"><div className="h-4 rounded bg-white/[0.05]" /><div className="h-4 rounded bg-white/[0.05]" /><div className="h-4 w-2/3 rounded bg-white/[0.05]" /></div>
      </div>
    );
  }

  if (state !== 'ready' || !entry) {
    return (
      <div className="pt-32 pb-16 min-h-[70vh] text-center px-6">
        <h1 className="text-2xl font-semibold text-white mb-2">{state === 'notfound' ? 'This idea isn’t available' : 'Couldn’t load this idea'}</h1>
        <p className="text-mi-text-secondary mb-6">{state === 'notfound' ? 'It may be private, or its builder unpublished it.' : 'Check your connection and try again.'}</p>
        <div className="flex justify-center gap-3">
          {state === 'error' && <button onClick={() => { setState('loading'); load(); }} className="btn-primary">Try again</button>}
          <Link to="/community" className="btn-secondary">Browse ideas</Link>
        </div>
      </div>
    );
  }

  const title = displayTitle(entry);
  const tech = asArray(entry.tech_stack);
  const pros = asArray(entry.pros_cons?.pros);
  const cons = asArray(entry.pros_cons?.cons);
  const features = asArray(entry.unique_features);
  const similarTools = asArray(entry.similar_tools);
  const tags = asArray(entry.tags);
  const isOwner = !!user && user.id === entry.user_id;
  const author = entry.author;

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-mi-text-secondary hover:text-white mb-6">
          <ArrowLeft size={16} /> All ideas
        </Link>

        {/* Header */}
        <header>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${entry.input_type === 'tool' ? 'bg-sky-400/10 text-sky-300' : 'bg-mi-accent/10 text-mi-accent'}`}>
              {entry.input_type === 'tool' ? 'Tool breakdown' : 'Idea'}
            </span>
            <BuildStatusBadge status={entry.build_status} size="md" />
            {entry.remixed_from && (
              <Link to={`/idea/${entry.remixed_from}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white/5 text-mi-text-secondary hover:text-white">
                <GitFork size={12} /> Remix of another idea
              </Link>
            )}
            {entry.remix_count > 0 && <span className="text-xs text-mi-text-secondary">Remixed {entry.remix_count}×</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight tracking-tight">{title}</h1>
          {entry.tagline && <p className="mt-2 text-lg text-mi-text-secondary">{entry.tagline}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {author && (
              <Link to={`/profile/${author.id}`} className="flex items-center gap-2.5 mr-auto group">
                <span className="w-9 h-9 rounded-full bg-mi-surface-2 ring-1 ring-mi-border overflow-hidden flex items-center justify-center text-sm font-semibold text-white">
                  {author.avatar_url ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" /> : (author.name || 'B')[0].toUpperCase()}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-medium text-white group-hover:underline">{author.name}</span>
                  <span className="block text-xs text-mi-text-secondary">Published {timeAgo(entry.published_at || entry.created_at)}{timeAgo(entry.published_at || entry.created_at).match(/^\d+[mhd]$/) ? ' ago' : ''}</span>
                </span>
              </Link>
            )}
            {isOwner ? (
              <Link to="/dashboard" className="btn-secondary"><Pencil size={15} /> Edit in dashboard</Link>
            ) : (
              <button type="button" onClick={remix} className="btn-secondary"><GitFork size={15} /> Remix</button>
            )}
            <button
              type="button" onClick={bookmark} aria-pressed={!!entry.bookmarked_by_user}
              className={`h-10 px-3.5 inline-flex items-center gap-1.5 rounded-xl ring-1 text-sm transition-colors ${entry.bookmarked_by_user ? 'ring-mi-accent/40 text-mi-accent bg-mi-accent/5' : 'ring-mi-border text-mi-text-secondary hover:text-white'}`}
            >
              <Bookmark size={15} fill={entry.bookmarked_by_user ? 'currentColor' : 'none'} /> {entry.bookmarked_by_user ? 'Saved' : 'Save'}
            </button>
            <IdeaActionsMenu entry={entry} isOwner={isOwner} onConnect={() => (isAuthenticated ? setConnectOpen(true) : promptLogin('collaborate'))} />
          </div>
          {showPrompt(entry) && (
            <p className="mt-4 text-xs text-mi-text-secondary">Original prompt: <span className="text-mi-text-secondary italic">“{entry.raw_input}”</span></p>
          )}
        </header>

        {entry.image_url && (
          <img
            src={thumbUrl(entry.image_url, 1200)} alt="" width="1200" height="675"
            className="mt-7 w-full aspect-video rounded-2xl ring-1 ring-mi-border object-cover bg-mi-surface"
            onError={imgFallback(entry.image_url)}
          />
        )}

        <div className="mt-8 space-y-10">
          {entry.summary && <p className="text-[17px] leading-relaxed text-mi-text-secondary whitespace-pre-line max-w-prose">{entry.summary}</p>}

          {entry.looking_for?.length > 0 && !isOwner && (
            <div className="rounded-2xl ring-1 ring-violet-400/25 bg-violet-400/[0.04] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1"><LookingFor roles={entry.looking_for} size="md" /><p className="mt-1 text-sm text-mi-text-secondary">If that's you, reach out to the builder.</p></div>
              <button type="button" disabled={entry.connect_sent} onClick={() => (isAuthenticated ? setConnectOpen(true) : promptLogin('collaborate'))} className="btn-primary shrink-0 disabled:opacity-60">
                <Handshake size={16} /> {entry.connect_sent ? 'Request sent' : 'Offer to help'}
              </button>
            </div>
          )}

          <div className="rounded-2xl ring-1 ring-mi-border bg-mi-surface/60 p-5 sm:p-6">
            <ValidationWidget
              variant="full" entry={entry} isOwner={isOwner} isAuthenticated={isAuthenticated} onRequireAuth={promptLogin}
              onChange={(validation, user_validation) => setEntry((e) => ({ ...e, validation, user_validation }))}
            />
          </div>

          {entry.mermaid_syntax && (
            <Section icon={Workflow} title="How it works" id="architecture">
              <div className="rounded-2xl ring-1 ring-mi-border bg-mi-surface/60 overflow-hidden [&>div]:border-0 [&>div]:bg-transparent">
                <Suspense fallback={<div className="h-48 animate-pulse bg-white/[0.03]" />}>
                  <MermaidDiagram chart={entry.mermaid_syntax} quietError />
                </Suspense>
              </div>
            </Section>
          )}

          {tech.length > 0 && (
            <Section icon={Layers} title="Suggested tech stack">
              <ul className="flex flex-wrap gap-2">{tech.map((t) => <li key={t} className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.04] ring-1 ring-mi-border text-mi-text-secondary">{t}</li>)}</ul>
            </Section>
          )}

          {(pros.length > 0 || cons.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {pros.length > 0 && (
                <div className="rounded-2xl bg-emerald-400/[0.04] ring-1 ring-emerald-400/15 p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-3"><ThumbsUp size={15} /> Strengths</h2>
                  <ul className="space-y-2 text-sm text-mi-text-secondary list-disc pl-4">{pros.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              )}
              {cons.length > 0 && (
                <div className="rounded-2xl bg-rose-400/[0.04] ring-1 ring-rose-400/15 p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-300 mb-3"><ThumbsDown size={15} /> Risks</h2>
                  <ul className="space-y-2 text-sm text-mi-text-secondary list-disc pl-4">{cons.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {features.length > 0 && (
            <Section icon={Sparkles} title="What stands out">
              <ul className="space-y-2 text-sm text-mi-text-secondary list-disc pl-4">{features.map((f) => <li key={f}>{f}</li>)}</ul>
            </Section>
          )}

          {similarTools.length > 0 && (
            <Section icon={Boxes} title={entry.input_type === 'tool' ? 'Alternatives' : 'Already out there'}>
              <ul className="flex flex-wrap gap-2">{similarTools.map((t) => <li key={t} className="px-3 py-1.5 rounded-lg text-sm ring-1 ring-mi-border text-mi-text-secondary">{t}</li>)}</ul>
            </Section>
          )}

          {(entry.link || tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {entry.link && <a href={entry.link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-mi-accent hover:underline"><ExternalLink size={14} /> {entry.link.replace(/^https?:\/\//, '')}</a>}
              {tags.map((t) => <Link key={t} to={`/community?tag=${encodeURIComponent(t)}`} className="text-mi-text-secondary hover:text-mi-accent">#{t}</Link>)}
            </div>
          )}

          <section aria-labelledby="verdict-h" className="pt-6 border-t border-mi-border/70">
            <h2 id="verdict-h" className="text-base font-semibold text-white mb-3">{isAuthenticated && !isOwner ? 'Your verdict' : 'Community verdict'}</h2>
            <ReactionRow reactions={entry.reactions} userReactions={entry.user_reactions} onReact={react} canReact={isAuthenticated} showLabels />
            <Reactors entryId={entry.id} open />
          </section>

          <Section icon={MessageSquare} title="Discussion" id="comments">
            <CommentThread entryId={entry.id} owner={author} />
          </Section>

          {!isAuthenticated && (
            <div className="rounded-2xl ring-1 ring-mi-accent/25 bg-mi-accent/[0.05] p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-white font-semibold">Have an idea of your own?</p>
                <p className="mt-1 text-sm text-mi-text-secondary">Get the same research, architecture diagram and market check in under a minute. Free.</p>
              </div>
              <Link to="/login?mode=register" className="btn-primary shrink-0">Try it free</Link>
            </div>
          )}

          <RelatedList title={`More from ${author?.name || 'this builder'}`} items={related?.forId === id ? related.same_author : null} />
          <RelatedList title="Similar ideas" items={related?.forId === id ? related.similar : null} />
        </div>
      </div>

      <ConnectModal
        isOpen={connectOpen}
        onClose={() => { setConnectOpen(false); load(); }}
        entryId={entry.id}
        ideaTitle={title}
      />
    </div>
  );
}
