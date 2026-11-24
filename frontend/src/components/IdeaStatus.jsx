import React from 'react';
import { UserSearch } from 'lucide-react';
import { BUILD_STATUS, ROLE_LABEL } from '../lib/ideaDisplay';

export function BuildStatusBadge({ status, size = 'sm' }) {
  const s = BUILD_STATUS[status];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ring-1 font-medium ${s.cls} ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}>
      <s.icon size={size === 'sm' ? 11 : 13} /> {s.label}
    </span>
  );
}

export function LookingFor({ roles, size = 'sm' }) {
  if (!roles?.length) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-mi-text-secondary ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}>
      <UserSearch size={size === 'sm' ? 12 : 14} className="text-violet-300" />
      Looking for <span className="text-white">{roles.map((r) => ROLE_LABEL[r] || r).join(', ')}</span>
    </span>
  );
}
