'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(34,197,94,0.12),transparent_30%)]" />
      </div>

      <div className="relative mx-auto flex max-w-lg flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-white shadow-2xl backdrop-blur">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
          🔐
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">
            admin access
          </p>
          <h1 className="text-3xl font-extrabold">관리자 로그인</h1>
          <p className="mt-2 text-slate-200/80">
            관리자 계정으로 로그인해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-semibold text-slate-100"
            >
              아이디
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-slate-100"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-4 py-3 text-base font-bold text-slate-950 shadow-lg transition focus:ring-2 focus:ring-emerald-400 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 transition duration-300 group-hover:opacity-100" />
            <span className="relative">
              {loading ? '로그인 중...' : '로그인'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
