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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.15),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.15),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="mb-12 lg:mb-16 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-400/20 bg-gradient-to-br from-primary-500/10 to-cyan-500/10 text-3xl shadow-glow-sm">
              ⚽
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary-300/80 font-medium">
                Flap Football
              </p>
              <p className="text-base font-bold text-slate-50">
                Manager Online Training
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-primary-400/30 bg-gradient-to-r from-primary-500/15 to-emerald-500/15 px-4 py-2 text-xs font-bold text-primary-100 shadow-glow-sm backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-300 shadow-glow-sm" />
            실습 세션 자동 진행 · 보안 전송
          </div>
        </div>

        <div className="grid items-start gap-12 lg:gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-10">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100 shadow-glow-cyan backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
              Night Pitch Edition
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-display font-bold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
                현장감 넘치는{' '}
                <span className="bg-gradient-to-r from-primary-300 via-cyan-300 to-accent-400 bg-clip-text text-transparent animate-fade-in">
                  매니저 온라인 실습
                </span>
                <br />
                으로 바로 연결되세요.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-300/90">
                경기 전/중/후에 필요한 운영 체크리스트, 문제 해결 흐름, 커뮤니케이션 팁을 한 번에 체득하는 집중 과정입니다. 입력한 정보로 맞춤 챕터가 자동 배정됩니다.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="group rounded-2xl border border-primary-400/20 bg-gradient-to-br from-primary-500/5 to-emerald-500/5 p-5 shadow-xl shadow-primary-500/5 transition-all hover:scale-105 hover:shadow-glow-emerald">
                <p className="text-sm font-medium text-primary-200/70">예상 소요</p>
                <p className="mt-2 text-4xl font-bold text-white">30-40<span className="text-2xl text-primary-300">분</span></p>
                <p className="mt-1 text-xs text-slate-300/80">집중 모듈 3개</p>
              </div>
              <div className="group rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-5 shadow-xl shadow-cyan-500/5 transition-all hover:scale-105 hover:shadow-glow-cyan">
                <p className="text-sm font-medium text-cyan-200/70">학습 방식</p>
                <p className="mt-2 text-4xl font-bold text-white">실습형</p>
                <p className="mt-1 text-xs text-slate-300/80">영상 + 체크포인트</p>
              </div>
              <div className="group rounded-2xl border border-accent-400/20 bg-gradient-to-br from-accent-500/5 to-purple-500/5 p-5 shadow-xl shadow-accent-500/5 transition-all hover:scale-105 hover:shadow-glow-cyan">
                <p className="text-sm font-medium text-accent-200/70">즉시 시작</p>
                <p className="mt-2 text-4xl font-bold text-white">자동 인증</p>
                <p className="mt-1 text-xs text-slate-300/80">지원 후 바로 진입</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary-300/70 font-medium mb-1">
                    Learning Path
                  </p>
                  <p className="text-lg font-bold text-white">
                    진행 흐름 미리보기
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500/20 to-emerald-500/20 border border-primary-400/30 px-3.5 py-1.5 text-[11px] font-bold text-primary-100">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary-300 shadow-glow-sm" />
                  실시간 체크
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {highlightPoints.map((point, index) => (
                  <div
                    key={point.title}
                    className="group rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-4 transition-all hover:border-primary-400/30 hover:shadow-glow-sm"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/20 to-cyan-500/20 border border-primary-400/30 text-xs font-bold text-primary-200">
                        0{index + 1}
                      </span>
                      <p className="text-sm font-bold text-cyan-100">{point.title}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300/80">
                      {point.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-primary-400/15 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-primary-500/5" />
              </div>

              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-primary-200 font-medium mb-1">
                      지원서
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                      매니저 등록 정보
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-primary-300/40 bg-gradient-to-r from-primary-500/20 to-emerald-500/20 px-4 py-2 text-[11px] font-bold text-primary-100 shadow-glow-sm">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary-300 shadow-glow-sm" />
                    암호화 전송
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2.5">
                    <label
                      htmlFor="name"
                      className="block text-sm font-bold text-slate-100"
                    >
                      이름 <span className="text-primary-300">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3.5 text-white shadow-lg shadow-black/10 placeholder:text-slate-400 outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 focus:shadow-glow-sm disabled:opacity-60"
                      placeholder="홍길동"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-bold text-slate-100"
                    >
                      전화번호 <span className="text-primary-300">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3.5 text-white shadow-lg shadow-black/10 placeholder:text-slate-400 outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 focus:shadow-glow-sm disabled:opacity-60"
                      placeholder="010-1234-5678"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="region"
                      className="block text-sm font-bold text-slate-100"
                    >
                      지역 <span className="text-primary-300">*</span>
                    </label>
                    <select
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3.5 text-white shadow-lg shadow-black/10 outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 focus:shadow-glow-sm disabled:opacity-60"
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
                      className="block text-sm font-bold text-slate-100"
                    >
                      지원동기 <span className="text-primary-300">*</span>
                    </label>
                    <select
                      id="applicationReason"
                      value={applicationReason}
                      onChange={(e) => setApplicationReason(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3.5 text-white shadow-lg shadow-black/10 outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 focus:shadow-glow-sm disabled:opacity-60"
                      disabled={loading}
                    >
                      <option value="">선택해주세요</option>
                      <option value="친구/지인 추천">친구/지인 추천</option>
                      <option value="SNS/광고를 보고">SNS/광고를 보고</option>
                      <option value="금전적 이유">금전적 이유</option>
                      <option value="축구/풋살에 관심이 많아서">
                        축구/풋살에 관심이 많아서
                      </option>
                      <option value="플랩 매니저에 관심이 있어서">
                        플랩 매니저에 관심이 있어서
                      </option>
                      <option value="새로운 경험을 해보고 싶어서">
                        새로운 경험을 해보고 싶어서
                      </option>
                    </select>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-gradient-to-br from-slate-900/80 to-slate-800/80 px-4 py-4 shadow-lg backdrop-blur-sm">
                    <input
                      type="checkbox"
                      id="agree"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-primary-400/40 bg-slate-800 text-primary-500 outline-none transition-all focus:ring-2 focus:ring-primary-500/50 disabled:opacity-60"
                      disabled={loading}
                    />
                    <label htmlFor="agree" className="text-sm font-medium text-slate-100 leading-relaxed">
                      개인정보 수집 및 이용에 동의합니다 (필수)
                    </label>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-400/50 bg-gradient-to-r from-rose-500/15 to-pink-500/15 px-4 py-3.5 text-sm font-medium text-rose-100 shadow-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-400 via-cyan-400 to-accent-500 px-6 py-4 text-base font-bold text-slate-950 shadow-xl shadow-primary-500/30 transition-all hover:shadow-glow-md hover:scale-[1.02] focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    <span className="absolute inset-0 bg-white/25 opacity-0 transition duration-300 group-hover:opacity-100" />
                    <span className="relative font-bold tracking-wide">
                      {loading ? '처리 중...' : '시작하기'}
                    </span>
                    {!loading && <span className="relative text-xl">→</span>}
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-300/80 leading-relaxed">
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
