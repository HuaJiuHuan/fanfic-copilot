'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const registered = searchParams.get('registered');
  const urlError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(urlError === 'CredentialsSignin' ? '邮箱或密码错误' : '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const csrfRes = await fetch('/api/auth/csrf');
      const csrfData = await csrfRes.json();

      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          callbackUrl,
          csrfToken: csrfData.csrfToken,
        }),
      });

      const resUrl = new URL(res.url);
      if (resUrl.pathname === '/login') {
        setError('邮箱或密码错误');
        return;
      }

      if (res.ok) {
        window.location.href = callbackUrl;
      } else {
        setError('登录失败，请重试');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment flex items-center justify-center p-6 selection:bg-academia-gold/20">
      <div className="w-full max-w-md bg-academia-surface/50 border border-academia-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-academia-gold/50 to-transparent"></div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-serif font-bold text-academia-gold">同人小说平台</h1>
          <p className="text-xs text-academia-muted">登录你的账户，继续创作之旅</p>
        </div>

        {registered && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400 text-center">
            注册成功，请登录
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-academia-muted uppercase tracking-widest">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-academia-muted uppercase tracking-widest">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-academia-crimson text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-academia-gold text-academia-bg py-3 rounded-lg text-sm font-bold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(232,125,155,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登 录'}
          </button>

          <p className="text-center text-xs text-academia-muted">
            还没有账号？{' '}
            <a href="/register" className="text-academia-gold hover:underline">
              立即注册
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
