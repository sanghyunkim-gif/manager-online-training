'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    } catch (err: any) {
      setError(err.message);
  } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[700px] w-[700px] rounded-full bg-success-500/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="mb-12 lg:mb-16 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="PLAB Manager" className="h-10 sm:h-12" />
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
            실습 세션 자동 진행 · 보안 전송
          </div>
        </div>

        <div className="grid items-start gap-12 lg:gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-10">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary-200 bg-primary-50 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-600">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
              Online Training
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-display font-bold leading-[1.15] text-neutral-900 sm:text-5xl lg:text-6xl">
                현장감 넘치는{' '}
                <span className="text-primary-500">
                  매니저 온라인 실습
                </span>
                <br />
                으로 바로 연결되세요.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-neutral-600">
                경기 전/중/후에 필요한 운영 체크리스트, 문제 해결 흐름, 커뮤니케이션 팁을 한 번에 체득하는 집중 과정입니다. 입력한 정보로 맞춤 챕터가 자동 배정됩니다.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-primary-300">
                <p className="text-sm font-medium text-neutral-500">예상 소요</p>
                <p className="mt-2 text-4xl font-bold text-neutral-900">30-40<span className="text-2xl text-primary-500">분</span></p>
                <p className="mt-1 text-xs text-neutral-600">집중 모듈 3개</p>
              </div>
              <div className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-primary-300">
                <p className="text-sm font-medium text-neutral-500">학습 방식</p>
                <p className="mt-2 text-4xl font-bold text-neutral-900">실습형</p>
                <p className="mt-1 text-xs text-neutral-600">영상 + 체크포인트</p>
              </div>
              <div className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-primary-300">
                <p className="text-sm font-medium text-neutral-500">즉시 시작</p>
                <p className="mt-2 text-4xl font-bold text-neutral-900">자동 인증</p>
                <p className="mt-1 text-xs text-neutral-600">지원 후 바로 진입</p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                    Learning Path
                  </p>
                  <p className="text-lg font-bold text-neutral-900">
                    진행 흐름 미리보기
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-success-200 bg-success-50 px-3.5 py-1.5 text-[11px] font-bold text-success-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
                  실시간 체크
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {highlightPoints.map((point, index) => (
                  <div
                    key={point.title}
                    className="group rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-all hover:border-primary-300 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500 text-xs font-bold text-white">
                        0{index + 1}
                      </span>
                      <p className="text-sm font-bold text-neutral-900">{point.title}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-600">
                      {point.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-bold mb-1">
                      지원서
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900">
                      매니저 등록 정보
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-success-200 bg-success-50 px-4 py-2 text-[11px] font-bold text-success-700">
                    <span className="h-2 w-2 rounded-full bg-success-500" />
                    암호화 전송
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2.5">
                    <label
                      htmlFor="name"
                      className="block text-sm font-bold text-neutral-700"
                    >
                      이름 <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:bg-neutral-100"
                      placeholder="홍길동"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-bold text-neutral-700"
                    >
                      전화번호 <span className="text-accent-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:bg-neutral-100"
                      placeholder="010-1234-5678"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="region"
                      className="block text-sm font-bold text-neutral-700"
                    >
                      지역 <span className="text-accent-500">*</span>
                    </label>
                    <select
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:bg-neutral-100"
                      disabled={loading}
                    >
                      <option value="">선택해주세요</option>
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
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="applicationReason"
                      className="block text-sm font-bold text-neutral-700"
                    >
                      지원동기 <span className="text-accent-500">*</span>
                    </label>
                    <select
                      id="applicationReason"
                      value={applicationReason}
                      onChange={(e) => setApplicationReason(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:bg-neutral-100"
                      disabled={loading}
                    >
                      <option value="">선택해주세요</option>
                      <option value="친구/지인 추천">친구/지인 추천</option>
                      <option value="SNS/광고를 보고">SNS/광고를 보고</option>
                      <option value="금전적 이유">금전적 이유</option>
                      <option value="축구/풋살에 관심이 많아서">
                        축구/풋살에 관심이 많아서
                      </option>
                      <option value="플랩풋볼 매니저에 관심이 있어서">
                        플랩풋볼 매니저에 관심이 있어서
                      </option>
                      <option value="새로운 경험을 해보고 싶어서">
                        새로운 경험을 해보고 싶어서
                      </option>
                    </select>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <input
                      type="checkbox"
                      id="agree"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-neutral-300 text-primary-500 outline-none transition-all focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60"
                      disabled={loading}
                    />
                    <label htmlFor="agree" className="text-sm font-medium text-neutral-700 leading-relaxed">
                      개인정보 수집 및 이용에 동의합니다 (필수)
                    </label>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-3.5 text-sm font-medium text-accent-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-primary-500 px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-primary-600 hover:shadow-xl focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="relative font-bold">
                      {loading ? '처리 중...' : '시작하기'}
                    </span>
                    {!loading && <span className="relative text-xl">→</span>}
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-neutral-600 leading-relaxed">
                  예상 소요 시간: 약 30-40분 · 모든 정보는 인증 후 학습에만 사용됩니다.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
