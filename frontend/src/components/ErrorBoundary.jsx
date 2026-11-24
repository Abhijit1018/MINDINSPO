import React from 'react';

// After a redeploy, lazily-loaded route chunks get new hashed filenames. A tab
// still running the old build then fails to load e.g. DashboardPage-<oldhash>.js
// and, without a boundary, React unmounts everything → blank white screen.
// Detect that case and reload once to pick up the new build; otherwise show a
// recoverable error screen.
const RELOAD_KEY = 'mi-chunk-reload-at';

function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .* failed|ChunkLoadError/i.test(msg);
}

function reloadedRecently() {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    return Date.now() - at < 30000;
  } catch {
    return true; // storage blocked: never risk a reload loop
  }
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (isChunkLoadError(error) && !reloadedRecently()) {
      try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { /* ignore */ }
      window.location.reload();
      return;
    }
    console.error('UI crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunk = isChunkLoadError(this.state.error);
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-3xl tracking-wide text-white mb-3">
            {chunk ? 'MindInspo was updated' : 'Something went wrong'}
          </h1>
          <p className="font-body text-mi-text-secondary mb-8">
            {chunk
              ? 'A new version is available. Reload to continue.'
              : 'This page hit an unexpected error. Reloading usually fixes it.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
            <a href="/" className="btn-secondary">Go home</a>
          </div>
        </div>
      </div>
    );
  }
}
