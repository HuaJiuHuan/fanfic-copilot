'use client';

import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  function handleLogout() {
    setLoading(true);
    window.location.assign('/api/auth/signout?callbackUrl=/login');
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-xs text-academia-muted hover:text-red-400 px-3 py-2 transition-colors border border-academia-border rounded-lg hover:bg-academia-surface disabled:opacity-50"
    >
      {loading ? '退出中...' : '退出'}
    </button>
  );
}
