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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8] px-6 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-lg flex-col items-center gap-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-10 shadow-lg">
        <img src="/logo.png" alt="PLAB Manager" className="h-12" />
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-white font-bold">
            admin access
          </p>
          <h1 className="text-3xl font-extrabold text-white">관리자 로그인</h1>
          <p className="mt-2 text-white">
            관리자 계정으로 로그인해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-bold text-white"
            >
              아이디
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-bold text-white"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 text-sm font-medium text-white">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-500/25 px-4 py-3 text-base font-bold text-white transition hover:opacity-90 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="relative">
              {loading ? '로그인 중...' : '로그인'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
