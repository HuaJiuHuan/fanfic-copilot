'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('注册失败，请重试');
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
          <p className="text-xs text-academia-muted">创建你的账户，开启创作之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              昵称（可选）
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
              placeholder="你的昵称"
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
              placeholder="至少 6 位"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-academia-muted uppercase tracking-widest">
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
              placeholder="再次输入密码"
              required
            />
          </div>

          {error && <p className="text-academia-crimson text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-academia-gold text-academia-bg py-3 rounded-lg text-sm font-bold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(232,125,155,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '注册中...' : '注 册'}
          </button>

          <p className="text-center text-xs text-academia-muted">
            已有账号？{' '}
            <a href="/login" className="text-academia-gold hover:underline">
              去登录
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
