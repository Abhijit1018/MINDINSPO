import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeIndianRupee, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { PAY_TIERS, validationHeadline } from '../lib/ideaDisplay';

const USE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No' },
];

function Segmented({ options, value, onChange, disabled, size = 'sm', ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1 rounded-lg border transition-colors disabled:opacity-60 ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            } ${on
              ? 'border-mi-accent/60 bg-mi-accent/10 text-white'
              : 'border-mi-border text-mi-text-secondary hover:text-white hover:border-mi-border-light'}`}
          >
            {on && <Check size={12} className="text-mi-accent" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Bar({ label, count, total, tone }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="grid grid-cols-[84px,1fr,40px] items-center gap-3 text-xs">
      <span className="text-mi-text-secondary">{label}</span>
      <span className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
        <motion.span
          className={`block h-full rounded-full ${tone}`}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <span className="text-right tabular-nums text-mi-text-secondary">{pct}%</span>
    </div>
  );
}

/**
 * "Would you use it? What would you pay?" — structured market signal.
 * variant="compact" for feed cards, "full" (with distribution) for the idea page.
 */
export default function ValidationWidget({ entry, isOwner, isAuthenticated, onRequireAuth, onChange, variant = 'compact' }) {
  const v = entry.validation;
  const mine = entry.user_validation;
  const [busy, setBusy] = useState(false);
  const [pendingUse, setPendingUse] = useState(null);
  const head = validationHeadline(v);
  const use = pendingUse || mine?.would_use || null;

  const save = async (would_use, pay_tier) => {
    if (!isAuthenticated) { onRequireAuth?.('validate ideas'); return; }
    setBusy(true);
    try {
      const res = await authFetch(`/api/community/${entry.id}/validate`, {
        method: 'POST', body: JSON.stringify({ would_use, pay_tier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || 'Could not save your vote'); return; }
      onChange?.(data.validation, data.user_validation);
      setPendingUse(null);
      if (would_use !== 'no' && pay_tier !== undefined && pay_tier !== null) toast.success('Thanks, the builder will see this.');
    } catch { toast.error('Network error. Try again.'); }
    finally { setBusy(false); }
  };

  const chooseUse = (value) => {
    if (!isAuthenticated) { onRequireAuth?.('validate ideas'); return; }
    if (value === 'no') { save('no', null); return; }
    // Record yes/maybe immediately; the price question is a follow-up.
    setPendingUse(value);
    save(value, mine?.pay_tier ?? null);
  };

  const summary = head ? (
    <p className="text-xs text-mi-text-secondary">
      <span className="text-white font-semibold tabular-nums">{head.text}</span> would use it
      {head.topTier && <> · most would pay <span className="text-white font-semibold">{head.topTier.label}</span></>}
      <span className="text-mi-text-muted"> · {head.voters} {head.voters === 1 ? 'vote' : 'votes'}</span>
    </p>
  ) : (
    <p className="text-xs text-mi-text-secondary">{isOwner ? 'No validation votes yet. Share it to get real signal.' : 'Be the first to validate this idea.'}</p>
  );

  const ask = !isOwner && (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className={`${variant === 'full' ? 'text-sm' : 'text-xs'} text-white`}>Would you use this?</span>
        <Segmented ariaLabel="Would you use this?" options={USE_OPTIONS} value={use} disabled={busy} onChange={chooseUse} size={variant === 'full' ? 'md' : 'sm'} />
        {busy && <Loader2 size={14} className="animate-spin text-mi-text-secondary" />}
      </div>
      <AnimatePresence initial={false}>
        {(use === 'yes' || use === 'maybe') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
              <span className={`${variant === 'full' ? 'text-sm' : 'text-xs'} text-white`}>What would you pay?</span>
              <Segmented ariaLabel="What would you pay per month?" options={PAY_TIERS} value={mine?.pay_tier ?? null} disabled={busy} onChange={(t) => save(use, t)} size={variant === 'full' ? 'md' : 'sm'} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="rounded-xl bg-white/[0.02] ring-1 ring-mi-border/70 px-3.5 py-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <BadgeIndianRupee size={14} className="text-emerald-300 shrink-0" />
          {summary}
        </div>
        {ask}
      </div>
    );
  }

  const total = v?.total || 0;
  return (
    <section aria-labelledby="validate-h" className="space-y-4">
      <div className="flex items-center gap-2">
        <BadgeIndianRupee size={18} className="text-emerald-300" />
        <h2 id="validate-h" className="text-base font-semibold text-white">Market check</h2>
      </div>
      {summary}
      {total > 0 && (
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
          <div className="space-y-2">
            <Bar label="Would use" count={v.use.yes} total={total} tone="bg-emerald-400" />
            <Bar label="Maybe" count={v.use.maybe} total={total} tone="bg-amber-300" />
            <Bar label="Wouldn't" count={v.use.no} total={total} tone="bg-slate-400" />
          </div>
          <div className="space-y-2">
            {PAY_TIERS.map((t) => (
              <Bar key={t.value} label={t.label} count={v.pay[String(t.value)] || 0} total={total} tone="bg-mi-accent" />
            ))}
          </div>
        </div>
      )}
      {ask}
    </section>
  );
}
