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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8] text-white">
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
      </div>

      {/* Decorative elements */}
      <div className="pointer-events-none absolute bottom-20 right-20 h-96 w-96 rounded-full bg-[#5dd9d1]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-40 left-20 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 min-h-screen flex flex-col justify-center">
        {/* Header */}
        <div className="absolute top-6 sm:top-8 lg:top-12 right-4 sm:right-6 lg:right-8">
          <div className="flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-xs font-semibold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success-400" />
            실습 세션 자동 진행 · 보안 전송
          </div>
        </div>

        {/* Main Content */}
        <div className="grid items-start gap-8 lg:gap-12 lg:grid-cols-[1fr_0.85fr]">
          {/* Left Section - Hero Content */}
          <section className="space-y-8 lg:space-y-10">
            <div className="space-y-4">
              <img src="/logo.png" alt="플랩" className="h-12 sm:h-14 brightness-0 invert" />
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
                Online Training
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-3xl font-display font-bold leading-[1.2] text-white sm:text-4xl lg:text-5xl xl:text-6xl">
                현장감 넘치는
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5dd9d1] to-[#7bbcff]">
                  플랩매니저 온라인 실습
                </span>
              </h1>
              <p className="max-w-2xl text-base lg:text-lg leading-relaxed text-white/80">
                경기 전/중/후에 필요한 운영 체크리스트, 문제 해결 흐름, 커뮤니케이션 팁을 한 번에 체득하는 집중 과정입니다.
              </p>
            </div>
          </section>

          {/* Right Section - Form */}
          <section className="relative">
            {/* Glassmorphism Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <div className="relative p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60 font-bold mb-1">
                      지원서
                    </p>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                      매니저 등록 정보
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-success-500/20 backdrop-blur-sm border border-success-400/30 px-3 py-1.5 text-[10px] font-bold text-success-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
                    암호화 전송
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-bold text-white/90"
                    >
                      이름
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 pl-12 pr-4 py-3.5 text-white placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/15 disabled:opacity-60"
                        placeholder=""
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-bold text-white/90"
                    >
                      전화번호
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 pl-12 pr-4 py-3.5 text-white placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/15 disabled:opacity-60"
                        placeholder=""
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="region"
                      className="block text-sm font-bold text-white/90"
                    >
                      지역
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <select
                        id="region"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 pl-12 pr-4 py-3.5 text-white outline-none transition-all focus:border-white/40 focus:bg-white/15 disabled:opacity-60 appearance-none cursor-pointer"
                        disabled={loading}
                      >
                        <option value="" className="bg-neutral-800 text-white">선택해주세요</option>
                        <option value="서울" className="bg-neutral-800 text-white">서울</option>
                        <option value="경기" className="bg-neutral-800 text-white">경기</option>
                        <option value="인천" className="bg-neutral-800 text-white">인천</option>
                        <option value="강원" className="bg-neutral-800 text-white">강원</option>
                        <option value="충북" className="bg-neutral-800 text-white">충북</option>
                        <option value="충남" className="bg-neutral-800 text-white">충남</option>
                        <option value="대전" className="bg-neutral-800 text-white">대전</option>
                        <option value="세종" className="bg-neutral-800 text-white">세종</option>
                        <option value="전북" className="bg-neutral-800 text-white">전북</option>
                        <option value="전남" className="bg-neutral-800 text-white">전남</option>
                        <option value="광주" className="bg-neutral-800 text-white">광주</option>
                        <option value="경북" className="bg-neutral-800 text-white">경북</option>
                        <option value="경남" className="bg-neutral-800 text-white">경남</option>
                        <option value="대구" className="bg-neutral-800 text-white">대구</option>
                        <option value="울산" className="bg-neutral-800 text-white">울산</option>
                        <option value="부산" className="bg-neutral-800 text-white">부산</option>
                        <option value="제주" className="bg-neutral-800 text-white">제주</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="applicationReason"
                      className="block text-sm font-bold text-white/90"
                    >
                      지원동기
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      </div>
                      <select
                        id="applicationReason"
                        value={applicationReason}
                        onChange={(e) => setApplicationReason(e.target.value)}
                        className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 pl-12 pr-4 py-3.5 text-white outline-none transition-all focus:border-white/40 focus:bg-white/15 disabled:opacity-60 appearance-none cursor-pointer"
                        disabled={loading}
                      >
                        <option value="" className="bg-neutral-800 text-white">선택해주세요</option>
                        <option value="친구/지인 추천" className="bg-neutral-800 text-white">친구/지인 추천</option>
                        <option value="SNS/광고를 보고" className="bg-neutral-800 text-white">SNS/광고를 보고</option>
                        <option value="금전적 이유" className="bg-neutral-800 text-white">금전적 이유</option>
                        <option value="축구/풋살에 관심이 많아서" className="bg-neutral-800 text-white">
                          축구/풋살에 관심이 많아서
                        </option>
                        <option value="플랩풋볼 매니저에 관심이 있어서" className="bg-neutral-800 text-white">
                          플랩풋볼 매니저에 관심이 있어서
                        </option>
                        <option value="새로운 경험을 해보고 싶어서" className="bg-neutral-800 text-white">
                          새로운 경험을 해보고 싶어서
                        </option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-4">
                    <input
                      type="checkbox"
                      id="agree"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-white/30 bg-white/10 text-primary-500 outline-none transition-all focus:ring-2 focus:ring-white/30 disabled:opacity-60 cursor-pointer"
                      disabled={loading}
                    />
                    <label htmlFor="agree" className="text-sm font-medium text-white/80 leading-relaxed cursor-pointer">
                      개인정보 수집 및 이용에 동의합니다 (필수)
                    </label>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 backdrop-blur-sm px-4 py-3.5 text-sm font-medium text-red-200">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    <span className="relative font-bold">
                      {loading ? '처리 중...' : '시작하기'}
                    </span>
                    {!loading && <span className="relative text-xl">→</span>}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-white/60 leading-relaxed">
                  예상 소요 시간: 약 30-40분 · 모든 정보는 학습에만 사용됩니다.
                </p>
              </div>
            </div>

            {/* Decorative sparkle */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 opacity-50">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 0L54.5 45.5L100 50L54.5 54.5L50 100L45.5 54.5L0 50L45.5 45.5L50 0Z" fill="url(#sparkle-gradient)"/>
                <defs>
                  <linearGradient id="sparkle-gradient" x1="0" y1="0" x2="100" y2="100">
                    <stop offset="0%" stopColor="#5dd9d1" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#7bbcff" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
