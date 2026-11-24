import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="section-label mb-4">404</p>
        <h1 className="font-heading text-4xl tracking-wide text-white mb-3">Page not found</h1>
        <p className="font-body text-mi-text-secondary mb-8">
          This page doesn't exist, or the idea was unpublished.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary">Go home</Link>
          <Link to="/community" className="btn-secondary">Browse community</Link>
        </div>
      </div>
    </div>
  );
}
