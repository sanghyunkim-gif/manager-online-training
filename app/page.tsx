'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-blue-600 mb-2">⚽</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            플랩풋볼 매니저 온라인 실습
          </h1>
          <p className="text-gray-600">
            매니저로 활동하기 위한 기초 교육을 시작합니다
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="홍길동"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="010-1234-5678"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                지역 <span className="text-red-500">*</span>
              </label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
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

            <div>
              <label
                htmlFor="applicationReason"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                지원동기 <span className="text-red-500">*</span>
              </label>
              <select
                id="applicationReason"
                value={applicationReason}
                onChange={(e) => setApplicationReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
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

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="agree" className="ml-2 text-sm text-gray-700">
                개인정보 수집 및 이용에 동의합니다 (필수)
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <span>처리 중...</span>
              ) : (
                <>
                  시작하기
                  <span className="ml-2">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            예상 소요 시간: 약 30-40분
          </div>
        </div>
      </div>
    </div>
  );
}
