'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Badge } from 'plab-design-system';
import { User, Phone, MapPin, Megaphone, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const highlightPoints = [
    {
      title: '현장 시나리오',
      desc: '운영 체크리스트와 문제 상황을 실전처럼 경험',
    },
    {
      title: '데이터 기반',
      desc: '지원 정보 입력만으로 개인화된 학습 경로 제공',
    },
    {
      title: '빠른 완료',
      desc: '30-40분 안에 핵심 역할을 익히고 바로 매칭 준비',
    },
  ];

  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [applicationReason, setApplicationReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!phone.trim()) {
      setError('전화번호를 입력해주세요.');
      return;
    }

    // 전화번호 형식 검사 (간단한 버전)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
      return;
    }

    if (!region) {
      setError('지역을 선택해주세요.');
      return;
    }

    if (!applicationReason) {
      setError('지원동기를 선택해주세요.');
      return;
    }

    if (!agreed) {
      setError('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, region, applicationReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '오류가 발생했습니다.');
      }

      // 세션 정보를 localStorage에 저장
      localStorage.setItem('session', JSON.stringify(data.data.session));

      // 학습 페이지로 이동
      router.push('/learn');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-bg-surface-secondary">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <img src="/logo.png" alt="플랩" className="h-8" />
        <div className="flex items-center gap-2">
          <Badge tone="success" variant="soft" size="sm">실습 자동 진행</Badge>
          <Badge tone="neutral" variant="soft" size="sm">보안 전송</Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pb-6 pt-4">
        <div className="mb-2 inline-flex items-center rounded-full bg-bg-surface px-3 py-1 text-xs font-bold uppercase tracking-widest text-text-brand border border-border-subtle">
          Online Training
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-text-primary">
          현장감 넘치는<br />
          <span className="text-text-brand">플랩매니저 온라인 실습</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          경기 전/중/후 운영 체크리스트, 문제 해결 흐름, 커뮤니케이션 팁을 한 번에 체득하는 집중 과정입니다.
        </p>
      </section>

      {/* Form Card */}
      <section className="flex-1 px-5 pb-8">
        <div className="rounded-2xl border border-border-subtle bg-bg-surface px-5 py-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">지원서</p>
              <h2 className="mt-0.5 text-xl font-bold text-text-primary">매니저 등록 정보</h2>
            </div>
            <Badge tone="success" variant="soft" size="sm">암호화 전송</Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              variant="labeled"
              label="이름"
              aria-label="이름"
              leftIcon={<User className="h-4 w-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              disabled={loading}
            />

            <Input
              id="phone"
              type="tel"
              variant="labeled"
              label="전화번호"
              aria-label="전화번호"
              leftIcon={<Phone className="h-4 w-4" />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              disabled={loading}
            />

            <Select
              id="region"
              variant="labeled"
              label="지역"
              aria-label="지역"
              placeholder="선택해주세요"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={loading}
            >
              <option value="서울">서울</option>
              <option value="경기">경기</option>
              <option value="인천">인천</option>
              <option value="강원">강원</option>
              <option value="충북">충북</option>
              <option value="충남">충남</option>
              <option value="대전">대전</option>
              <option value="세종">세종</option>
              <option value="전북">전북</option>
              <option value="전남">전남</option>
              <option value="광주">광주</option>
              <option value="경북">경북</option>
              <option value="경남">경남</option>
              <option value="대구">대구</option>
              <option value="울산">울산</option>
              <option value="부산">부산</option>
              <option value="제주">제주</option>
            </Select>

            <Select
              id="applicationReason"
              variant="labeled"
              label="지원동기"
              aria-label="지원동기"
              placeholder="선택해주세요"
              value={applicationReason}
              onChange={(e) => setApplicationReason(e.target.value)}
              disabled={loading}
            >
              <option value="친구/지인 추천">친구/지인 추천</option>
              <option value="SNS/광고를 보고">SNS/광고를 보고</option>
              <option value="금전적 이유">금전적 이유</option>
              <option value="축구/풋살에 관심이 많아서">축구/풋살에 관심이 많아서</option>
              <option value="플랩 매니저에 관심이 있어서">플랩 매니저에 관심이 있어서</option>
              <option value="새로운 경험을 해보고 싶어서">새로운 경험을 해보고 싶어서</option>
            </Select>

            <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-bg-surface-secondary px-4 py-3.5">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border-subtle accent-[var(--bg-primary)] focus-visible:ring-2 disabled:opacity-60"
                disabled={loading}
              />
              <label htmlFor="agree" className="cursor-pointer text-sm font-medium leading-relaxed text-text-secondary">
                개인정보 수집 및 이용에 동의합니다 (필수)
              </label>
            </div>

            {error && (
              <div className="rounded-xl border border-border-error bg-bg-error px-4 py-3 text-sm font-medium text-text-error">
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
              {loading ? '처리 중...' : (
                <>
                  시작하기
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-text-tertiary">
            예상 소요 시간: 약 30-40분 · 모든 정보는 학습에만 사용됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
