import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { BUILD_STATUS, ROLE_LABEL } from '../lib/ideaDisplay';

/** Owner control: build stage + which collaborators they're looking for.
 *  Shown as badges on the feed card and the public idea page. */
export default function BuildProgressEditor({ entryId, status, lookingFor = [], onSaved }) {
  const [busy, setBusy] = useState(null);

  const save = async (payload, key) => {
    setBusy(key);
    try {
      const res = await authFetch(`/api/catalogs/${entryId}`, { method: 'PUT', body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || 'Could not save'); return; }
      onSaved?.(data.entry);
    } catch { toast.error('Network error. Try again.'); }
    finally { setBusy(null); }
  };

  const toggleRole = (r) => {
    const next = lookingFor.includes(r) ? lookingFor.filter((x) => x !== r) : [...lookingFor, r];
    save({ looking_for: next }, `role-${r}`);
  };

  return (
    <div className="mt-3 rounded-xl border border-mi-border bg-black/20 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-mi-text-secondary w-24">Stage</span>
        {Object.entries(BUILD_STATUS).map(([key, s]) => {
          const on = status === key;
          return (
            <button key={key} type="button" aria-pressed={on} disabled={!!busy}
              onClick={() => save({ build_status: on ? null : key }, key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ring-1 transition-colors ${on ? s.cls : 'ring-mi-border text-mi-text-secondary hover:text-white'}`}
            >
              {busy === key ? <Loader2 size={12} className="animate-spin" /> : <s.icon size={12} />} {s.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-mi-text-secondary w-24">Looking for</span>
        {Object.entries(ROLE_LABEL).map(([key, label]) => {
          const on = lookingFor.includes(key);
          return (
            <button key={key} type="button" aria-pressed={on} disabled={!!busy} onClick={() => toggleRole(key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ring-1 transition-colors ${on ? 'ring-violet-400/40 bg-violet-400/10 text-violet-200' : 'ring-mi-border text-mi-text-secondary hover:text-white'}`}
            >
              {busy === `role-${key}` ? <Loader2 size={12} className="animate-spin" /> : on && <Check size={12} />} {label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-mi-text-secondary">Shown on your published idea so the right people offer to help.</p>
    </div>
  );
}
