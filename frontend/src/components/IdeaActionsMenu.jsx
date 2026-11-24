import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, GitFork, Handshake, Link2, MoreHorizontal, Share2 } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import { displayTitle, shareUrlFor } from '../lib/ideaDisplay';

function WhatsAppIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.2 8.2 0 1 1 6.96 3.84Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.89c-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.78 2.78 0 0 0-.87 2.07 4.83 4.83 0 0 0 1.01 2.57 11.06 11.06 0 0 0 4.24 3.74c1.58.68 2.2.74 2.99.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

/**
 * Secondary idea actions behind one "⋯" button, so the card keeps 3 visible
 * actions. Keyboard: Enter/Space opens, arrows move, Esc closes.
 */
export default function IdeaActionsMenu({ entry, isOwner, onConnect, onRemix, onExport, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef(null);
  const items = useRef([]);
  const url = shareUrlFor(entry, API_BASE_URL);
  const title = displayTitle(entry);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    requestAnimationFrame(() => items.current.find(Boolean)?.focus());
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const close = () => setOpen(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  const nativeShare = async () => {
    try { await navigator.share({ title, text: entry.tagline || `${title} on MindInspo`, url }); } catch { /* cancelled */ }
    close();
  };
  const whatsapp = () => {
    const text = `${title}${entry.tagline ? ` - ${entry.tagline}` : ''}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    close();
  };

  const list = [
    !isOwner && onConnect && { key: 'connect', icon: Handshake, label: entry.connect_sent ? 'Request sent' : 'Collaborate', run: () => { close(); onConnect(entry); }, disabled: entry.connect_sent },
    !isOwner && onRemix && { key: 'remix', icon: GitFork, label: 'Remix into my catalog', run: () => { close(); onRemix(entry); } },
    typeof navigator !== 'undefined' && navigator.share && { key: 'share', icon: Share2, label: 'Share…', run: nativeShare },
    { key: 'wa', icon: WhatsAppIcon, label: 'Share on WhatsApp', run: whatsapp },
    { key: 'copy', icon: copied ? Check : Link2, label: copied ? 'Link copied' : 'Copy link', run: copy },
    onExport && { key: 'export', icon: Camera, label: 'Export as image', run: () => { close(); onExport(entry); } },
  ].filter(Boolean);

  const onKeyDown = (e) => {
    const els = items.current.filter(Boolean);
    const i = els.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); close(); wrap.current?.querySelector('button')?.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus(); }
  };

  return (
    <div ref={wrap} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        className={`h-9 w-9 inline-flex items-center justify-center rounded-lg transition-colors ${open ? 'bg-white/[0.06] text-white' : 'text-mi-text-secondary hover:text-white hover:bg-white/[0.04]'}`}
      >
        <MoreHorizontal size={18} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-30 mt-1 w-56 rounded-xl border border-mi-border bg-mi-surface-2 p-1 shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            {list.map((it, idx) => (
              <button
                key={it.key}
                ref={(el) => { items.current[idx] = el; }}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                onClick={it.run}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm text-mi-text-secondary hover:text-white hover:bg-white/[0.05] focus:outline-none focus:bg-white/[0.06] focus:text-white disabled:opacity-50"
              >
                <it.icon size={15} /> {it.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
