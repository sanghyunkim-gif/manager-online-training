'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from 'plab-design-system';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-surface-secondary px-5">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-surface p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="PLAB Manager" className="h-12" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
            admin access
          </p>
          <h1 className="text-2xl font-extrabold text-text-primary">
            관리자 로그인
          </h1>
          <p className="text-sm text-text-secondary">
            관리자 계정으로 로그인해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="아이디"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디를 입력하세요"
            required
            aria-label="아이디"
          />

          <Input
            label="비밀번호"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
            aria-label="비밀번호"
          />

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-border-error bg-bg-error px-4 py-3 text-sm font-medium text-text-error"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="solid"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  );
}
