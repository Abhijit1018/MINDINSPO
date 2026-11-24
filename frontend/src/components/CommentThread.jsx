import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CornerDownRight, Loader2, Pencil, Send, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { timeAgo } from '../lib/ideaDisplay';

function Avatar({ author, size = 28 }) {
  const name = author?.name || 'Builder';
  return (
    <Link
      to={author?.id ? `/profile/${author.id}` : '#'}
      className="shrink-0 rounded-full bg-mi-surface-2 ring-1 ring-mi-border flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
      aria-label={`${name}'s profile`}
    >
      {author?.avatar_url
        ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        : <span className="text-[11px] font-semibold text-mi-text-secondary">{name[0].toUpperCase()}</span>}
    </Link>
  );
}

/** Renders comment text with @Name mentions of known participants highlighted. */
function RichText({ text, names }) {
  if (!names.length) return text;
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
  const re = new RegExp(`(@(?:${escaped.join('|')}))`, 'g');
  return text.split(re).map((part, i) => (part.startsWith('@') && names.includes(part.slice(1))
    ? <span key={i} className="text-sky-300 font-medium">{part}</span>
    : <React.Fragment key={i}>{part}</React.Fragment>));
}

function Composer({ participants, onSubmit, initial = '', replyTo, onCancelReply, autoFocus, submitLabel = 'Post' }) {
  // Remounted (via key) whenever the reply target changes, so the "@Name "
  // prefill is plain initial state rather than an effect.
  const [text, setText] = useState(initial || (replyTo?.name ? `@${replyTo.name} ` : ''));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // state updates are async; a double-click must not post twice
  const [mentionQuery, setMentionQuery] = useState(null); // { start, query }
  const [active, setActive] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!autoFocus && !replyTo) return;
    const el = ref.current;
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, [autoFocus, replyTo]);

  const suggestions = useMemo(() => {
    if (!mentionQuery) return [];
    const q = mentionQuery.query.toLowerCase();
    return participants.filter((p) => p.name.toLowerCase().startsWith(q) || p.name.toLowerCase().includes(` ${q}`)).slice(0, 5);
  }, [mentionQuery, participants]);

  const onChange = (e) => {
    const v = e.target.value;
    setText(v);
    const caret = e.target.selectionStart;
    const m = /(^|\s)@([\wÀ-ɏ.\- ]{0,24})$/.exec(v.slice(0, caret));
    setMentionQuery(m ? { start: caret - m[2].length - 1, query: m[2] } : null);
    setActive(0);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const pick = (p) => {
    const before = text.slice(0, mentionQuery.start);
    const after = text.slice(ref.current.selectionStart);
    const next = `${before}@${p.name} ${after}`;
    setText(next);
    setMentionQuery(null);
    requestAnimationFrame(() => { const pos = before.length + p.name.length + 2; ref.current?.focus(); ref.current?.setSelectionRange(pos, pos); });
  };

  const submit = async () => {
    const content = text.trim();
    if (!content || busyRef.current) return;
    const mentions = participants.filter((p) => content.includes(`@${p.name}`)).map((p) => p.id);
    busyRef.current = true;
    setBusy(true);
    const ok = await onSubmit(content, mentions);
    busyRef.current = false;
    setBusy(false);
    if (ok) { setText(''); if (ref.current) ref.current.style.height = 'auto'; }
  };

  const onKeyDown = (e) => {
    if (suggestions.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(suggestions[active]); return; }
      if (e.key === 'Escape') { setMentionQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    if (e.key === 'Escape' && onCancelReply) onCancelReply();
  };

  return (
    <div className="relative">
      {replyTo && (
        <div className="flex items-center gap-1.5 mb-1.5 text-xs text-mi-text-secondary">
          <CornerDownRight size={12} /> Replying to <span className="text-white">{replyTo.name}</span>
          <button type="button" onClick={onCancelReply} className="ml-1 p-0.5 rounded hover:bg-white/5" aria-label="Cancel reply"><X size={12} /></button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          maxLength={2000}
          placeholder={replyTo ? 'Write a reply…' : 'Add to the discussion… (type @ to mention)'}
          aria-label="Comment"
          className="flex-1 resize-none rounded-xl bg-mi-bg border border-mi-border px-3.5 py-2.5 text-sm text-white placeholder:text-mi-text-muted focus:outline-none focus:border-mi-border-light focus:ring-2 focus:ring-mi-accent/30 transition-colors"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || busy}
          className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-xl bg-mi-accent text-white text-sm font-medium hover:bg-mi-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          <span className="hidden sm:inline">{submitLabel}</span>
        </button>
      </div>
      {suggestions.length > 0 && (
        <ul role="listbox" className="absolute left-0 bottom-full mb-1 w-64 max-w-full rounded-xl border border-mi-border bg-mi-surface-2 shadow-xl overflow-hidden z-20">
          {suggestions.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(p); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${i === active ? 'bg-white/[0.06] text-white' : 'text-mi-text-secondary'}`}
              >
                <Avatar author={p} size={22} /> {p.name}
                {p.isOwner && <span className="ml-auto text-[10px] text-mi-text-muted">Author</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({ c, me, ownerId, names, onReply, onEdit, onDelete, isReply }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const mine = me && c.author?.id === me;
  const canDelete = mine || (me && me === ownerId);

  return (
    <div className={`flex gap-2.5 ${isReply ? 'mt-3' : ''}`}>
      <Avatar author={c.author} size={isReply ? 24 : 28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link to={`/profile/${c.author?.id}`} className="text-sm font-semibold text-white hover:underline">{c.author?.name || 'Builder'}</Link>
          {c.author?.id === ownerId && <span className="text-[10px] px-1.5 py-0.5 rounded bg-mi-accent/10 text-mi-accent">Author</span>}
          <span className="text-xs text-mi-text-secondary">{timeAgo(c.created_at)}{c.edited ? ' · edited' : ''}</span>
        </div>
        {editing ? (
          <div className="mt-1.5">
            <Composer
              participants={[]}
              initial={c.content}
              autoFocus
              submitLabel="Save"
              onCancelReply={() => setEditing(false)}
              onSubmit={async (text) => { const ok = await onEdit(c, text); if (ok) setEditing(false); return ok; }}
            />
            <button type="button" onClick={() => setEditing(false)} className="mt-1 text-xs text-mi-text-secondary hover:text-white">Cancel</button>
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-mi-text-secondary leading-relaxed whitespace-pre-wrap break-words"><RichText text={c.content} names={names} /></p>
        )}
        {!editing && me && (
          <div className="mt-1 flex items-center gap-3 text-xs text-mi-text-secondary">
            <button type="button" onClick={() => onReply(c)} className="hover:text-white">Reply</button>
            {mine && <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 hover:text-white"><Pencil size={11} /> Edit</button>}
            {canDelete && !confirming && (
              <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1 hover:text-red-300"><Trash2 size={11} /> Delete</button>
            )}
            {confirming && (
              <span className="inline-flex items-center gap-2">
                <span className="text-red-300">Delete{c.replies?.length ? ' with replies' : ''}?</span>
                <button type="button" onClick={() => onDelete(c)} className="font-semibold text-red-300 hover:text-red-200">Delete</button>
                <button type="button" onClick={() => setConfirming(false)} className="hover:text-white">Keep</button>
              </span>
            )}
          </div>
        )}
        {c.replies?.map((r) => (
          <CommentItem key={r.id} c={r} me={me} ownerId={ownerId} names={names} onReply={onReply} onEdit={onEdit} onDelete={onDelete} isReply />
        ))}
      </div>
    </div>
  );
}

/**
 * Threaded discussion for an idea. One level of replies (deeper replies are
 * attached to the top-level comment by the API), @mentions with autocomplete,
 * edit/delete your own comments, and idea-owner moderation.
 */
export default function CommentThread({ entryId, owner, onCountChange, maxHeight }) {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const me = user?.id;

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`/api/community/${entryId}/comments`);
      setComments(res.ok ? await res.json() : []);
    } catch { setComments([]); }
  }, [entryId]);
  useEffect(() => { load(); }, [load]);

  const count = useMemo(() => (comments || []).reduce((n, c) => n + 1 + (c.replies?.length || 0), 0), [comments]);
  useEffect(() => { if (comments) onCountChange?.(count); }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  const participants = useMemo(() => {
    const map = new Map();
    if (owner?.id) map.set(owner.id, { id: owner.id, name: owner.name || 'Builder', avatar_url: owner.avatar_url, isOwner: true });
    for (const c of comments || []) {
      for (const x of [c, ...(c.replies || [])]) if (x.author?.id && !map.has(x.author.id)) map.set(x.author.id, { ...x.author });
    }
    if (me) map.delete(me);
    return [...map.values()];
  }, [comments, owner, me]);
  const names = useMemo(() => participants.map((p) => p.name).concat(user?.user_metadata?.name || []), [participants, user]);

  const post = async (content, mentions) => {
    try {
      const res = await authFetch(`/api/community/${entryId}/comments`, {
        method: 'POST', body: JSON.stringify({ content, mentions, parent_id: replyTo?.id || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || 'Could not post'); return false; }
      setReplyTo(null);
      await load();
      return true;
    } catch { toast.error('Network error. Try again.'); return false; }
  };

  const edit = async (c, content) => {
    const res = await authFetch(`/api/community/${entryId}/comments/${c.id}`, { method: 'PUT', body: JSON.stringify({ content }) });
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error || 'Could not save'); return false; }
    await load();
    return true;
  };

  const remove = async (c) => {
    const res = await authFetch(`/api/community/${entryId}/comments/${c.id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Could not delete'); return; }
    toast.success('Comment deleted');
    await load();
  };

  return (
    <div>
      {comments === null ? (
        <div className="space-y-3 py-2" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-white/[0.06]" />
              <div className="flex-1 space-y-2"><div className="h-3 w-28 rounded bg-white/[0.06]" /><div className="h-3 w-3/4 rounded bg-white/[0.06]" /></div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-3 text-sm text-mi-text-secondary">
          No discussion yet. {isAuthenticated ? 'Ask the builder a question or share what you would change.' : ''}
        </p>
      ) : (
        <div className="space-y-5 py-1 overflow-y-auto pr-1" style={maxHeight ? { maxHeight } : undefined}>
          {comments.map((c) => (
            <CommentItem key={c.id} c={c} me={me} ownerId={owner?.id} names={names}
              onReply={(x) => setReplyTo({ id: x.id, name: x.author?.name || 'Builder' })}
              onEdit={edit} onDelete={remove} />
          ))}
        </div>
      )}
      <div className="mt-4">
        {isAuthenticated ? (
          <Composer key={replyTo?.id || 'root'} participants={participants} onSubmit={post} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
        ) : (
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-mi-accent hover:underline">Sign in to join the discussion</Link>
        )}
      </div>
    </div>
  );
}
