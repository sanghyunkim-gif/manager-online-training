'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { DbUser } from '@/types';
import type {
  ChapterStats,
  QuestionStats,
  DropoffAnalysis,
  RegionStats,
} from '@/lib/supabase/stats';

type TabType = 'users' | 'chapters' | 'questions' | 'dropoff' | 'regions';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [chapterStats, setChapterStats] = useState<ChapterStats[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  const [dropoffAnalysis, setDropoffAnalysis] =
    useState<DropoffAnalysis | null>(null);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>(
    'all'
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth/session');
        const data = await response.json();

        if (!data.authenticated) {
          router.push('/admin/login');
          return;
        }

        setAuthenticated(true);
      } catch (err) {
        console.error('인증 확인 오류:', err);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      console.error('로그아웃 오류:', err);
    }
  };

  useEffect(() => {
    if (!authenticated) return;

    const fetchData = async () => {
      try {
        const usersRes = await fetch('/api/admin/users');
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data);
        }

        const chapterStatsRes = await fetch('/api/admin/stats/chapters');
        const chapterStatsData = await chapterStatsRes.json();
        if (chapterStatsData.success) {
          setChapterStats(chapterStatsData.data);
        }

        const questionStatsRes = await fetch('/api/admin/stats/questions');
        const questionStatsData = await questionStatsRes.json();
        if (questionStatsData.success) {
          setQuestionStats(questionStatsData.data);
        }

        const dropoffRes = await fetch('/api/admin/stats/dropoff');
        const dropoffData = await dropoffRes.json();
        if (dropoffData.success) {
          setDropoffAnalysis(dropoffData.data);
        }

        const regionStatsRes = await fetch('/api/admin/stats/regions');
        const regionStatsData = await regionStatsRes.json();
        if (regionStatsData.success) {
          setRegionStats(regionStatsData.data);
        }
      } catch (err) {
        console.error('데이터 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authenticated]);

  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true;
    if (filter === 'in_progress') return user.status === 'In Progress';
    if (filter === 'completed') return user.status === 'Completed';
    return true;
  });

  const stats = {
    total: users.length,
    inProgress: users.filter((u) => u.status === 'In Progress').length,
    completed: users.filter((u) => u.status === 'Completed').length,
    blocked: users.filter((u) => u.status === 'Blocked').length,
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-12 py-10 text-center shadow-lg">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">
            관리자 데이터 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#3b2f87] to-[#4a5ea8] pb-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-bl from-[#5dd9d1]/30 via-[#7b9ad9]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-[#8b5cbb]/20 to-transparent" />
      </div>

      <header className="relative border-b border-white/20 bg-white/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PLAB Manager" className="h-10" />
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-white font-bold">
                Admin Dashboard
              </p>
              <h1 className="text-xl font-bold text-white">플랩풋볼 매니저</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/content"
              className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-500/25 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              콘텐츠 관리
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-500/25 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-white font-bold">
              전체 학습자
            </p>
            <p className="mt-2 text-3xl font-extrabold text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-white font-bold">
              학습 중
            </p>
            <p className="mt-2 text-3xl font-extrabold text-white">
              {stats.inProgress}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-white font-bold">
              완료
            </p>
            <p className="mt-2 text-3xl font-extrabold text-white">
              {stats.completed}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-white font-bold">
              전체 완료율
            </p>
            <p className="mt-2 text-3xl font-extrabold text-white">
              {stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
          <div className="flex flex-wrap gap-2 border-b border-white/20 px-4 py-3 text-sm">
            {[
              { key: 'users', label: '사용자 목록' },
              { key: 'chapters', label: '챕터별 통계' },
              { key: 'questions', label: '문제별 통계' },
              { key: 'dropoff', label: '이탈 분석' },
              { key: 'regions', label: '지역별 통계' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`rounded-full px-4 py-2 font-bold transition ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-500/25 text-white'
                    : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:border-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'all', label: '전체', count: stats.total },
                    { key: 'in_progress', label: '진행 중', count: stats.inProgress },
                    { key: 'completed', label: '완료', count: stats.completed },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() =>
                        setFilter(item.key as 'all' | 'in_progress' | 'completed')
                      }
                      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                        filter === item.key
                          ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-500/25 text-white'
                          : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:border-white/30'
                      }`}
                    >
                      {item.label} ({item.count})
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10 text-xs uppercase tracking-[0.08em] text-white font-bold">
                      <tr>
                        {['이름', '전화번호', '상태', '시작일', '완료일', '작업'].map(
                          (header) => (
                            <th key={header} className="px-6 py-3 text-left">
                              {header}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20 bg-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-white"
                          >
                            사용자가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="transition hover:bg-white/10"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-white">
                              {user.name}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {user.phone}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  user.status === 'Completed'
                                    ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white'
                                    : user.status === 'In Progress'
                                    ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white'
                                    : 'bg-white/10 backdrop-blur-md border border-white/20 text-white'
                                }`}
                              >
                                {user.status === 'Completed'
                                  ? '완료'
                                  : user.status === 'In Progress'
                                  ? '진행 중'
                                  : '차단'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {user.created_at
                                ? new Date(user.created_at).toLocaleDateString(
                                    'ko-KR'
                                  )
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {user.completed_at
                                ? new Date(
                                    user.completed_at
                                  ).toLocaleDateString('ko-KR')
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              {user.status === 'In Progress' && (
                                <button
                                  onClick={async () => {
                                    if (confirm(`${user.name} 님을 완료 처리하시겠습니까?`)) {
                                      try {
                                        const res = await fetch('/api/admin/users/complete', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ userId: user.id }),
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                          alert('완료 처리되었습니다.');
                                          window.location.reload();
                                        } else {
                                          alert('오류: ' + data.error);
                                        }
                                      } catch (err) {
                                        alert('완료 처리 중 오류가 발생했습니다.');
                                      }
                                    }
                                  }}
                                  className="font-bold text-white hover:opacity-80"
                                >
                                  완료 처리
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'chapters' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  챕터별 완료율 및 평균 소요시간
                </h3>
                <div className="overflow-hidden rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10 text-xs uppercase tracking-[0.08em] text-white font-bold">
                      <tr>
                        {['챕터', '총 시도', '완료율', '평균 소요시간', '평균 정답률', '이탈률'].map(
                          (h) => (
                            <th key={h} className="px-6 py-3 text-left">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20 bg-white/5">
                      {chapterStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-white"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        chapterStats.map((stat) => (
                          <tr key={stat.chapterId} className="transition hover:bg-white/10">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-white">
                              {stat.order}. {stat.chapterName}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {stat.totalAttempts}회
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-white">
                                  {Math.round(stat.completionRate)}%
                                </div>
                                <div className="h-2 w-20 rounded-full bg-neutral-200">
                                  <div
                                    className="h-full rounded-full bg-primary-500"
                                    style={{ width: `${stat.completionRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {Math.floor(stat.avgTime / 60)}분 {stat.avgTime % 60}초
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  stat.avgCorrectRate >= 80
                                    ? 'bg-success-50 border border-success-200 text-success-700'
                                    : stat.avgCorrectRate >= 60
                                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                                    : 'bg-accent-50 border border-accent-200 text-accent-700'
                                }`}
                              >
                                {stat.avgCorrectRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  stat.dropoffRate >= 50
                                    ? 'bg-accent-50 border border-accent-200 text-accent-700'
                                    : stat.dropoffRate >= 30
                                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                                    : 'bg-success-50 border border-success-200 text-success-700'
                                }`}
                              >
                                {stat.dropoffRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  문제별 오답률 (높은 순)
                </h3>
                <div className="overflow-hidden rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10 text-xs uppercase tracking-[0.08em] text-white font-bold">
                      <tr>
                        {['챕터', '문제', '총 시도', '오답률', '선택 분포'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20 bg-white/5">
                      {questionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-white"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        questionStats.map((stat) => (
                          <tr key={stat.questionId} className="transition hover:bg-white/10">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {stat.chapterName}
                            </td>
                            <td className="px-6 py-4 text-sm text-white font-medium">
                              {stat.questionText}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {stat.totalAttempts}회
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    stat.incorrectRate >= 70
                                      ? 'bg-accent-50 border border-accent-200 text-accent-700'
                                      : stat.incorrectRate >= 50
                                      ? 'bg-amber-50 border border-amber-200 text-amber-700'
                                      : 'bg-success-50 border border-success-200 text-success-700'
                                  }`}
                                >
                                  {Math.round(stat.incorrectRate)}%
                                </span>
                                <div className="h-2 w-20 rounded-full bg-neutral-200">
                                  <div
                                    className="h-full rounded-full bg-accent-500"
                                    style={{ width: `${stat.incorrectRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-xs text-white">
                              1:{stat.answerDistribution['1']} | 2:
                              {stat.answerDistribution['2']} | 3:
                              {stat.answerDistribution['3']} | 4:
                              {stat.answerDistribution['4']}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'dropoff' && dropoffAnalysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.12em] text-white font-bold">
                      총 사용자
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {dropoffAnalysis.totalUsers}명
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.12em] text-white font-bold">
                      완료한 사용자
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {dropoffAnalysis.completedUsers}명
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.12em] text-white font-bold">
                      전체 완료율
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {Math.round(dropoffAnalysis.overallCompletionRate)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    챕터별 이탈자 수
                  </h3>
                  <div className="overflow-hidden rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                    <table className="min-w-full divide-y divide-white/20">
                      <thead className="bg-white/10 text-xs uppercase tracking-[0.08em] text-white font-bold">
                        <tr>
                          {['순위', '챕터', '이탈자 수', '시각화'].map((h) => (
                            <th key={h} className="px-6 py-3 text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/20 bg-white/5">
                        {dropoffAnalysis.chapterDropoffs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-8 text-center text-white"
                            >
                              데이터가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          dropoffAnalysis.chapterDropoffs.map((ch, idx) => (
                            <tr key={ch.chapterId} className="transition hover:bg-white/10">
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-white">
                                #{idx + 1}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                                {ch.order}. {ch.chapterName}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                                {ch.droppedCount}명
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="h-4 w-52 rounded-full bg-neutral-200">
                                  <div
                                    className={`h-full rounded-full ${
                                      idx === 0
                                        ? 'bg-accent-500'
                                        : idx === 1
                                        ? 'bg-amber-500'
                                        : idx === 2
                                        ? 'bg-amber-300'
                                        : 'bg-success-500'
                                    }`}
                                    style={{
                                      width: `${
                                        dropoffAnalysis.chapterDropoffs[0]
                                          .droppedCount > 0
                                          ? (ch.droppedCount /
                                              dropoffAnalysis.chapterDropoffs[0]
                                                .droppedCount) *
                                            100
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'regions' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  지역별 완료율 및 학습 현황
                </h3>
                <div className="overflow-hidden rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10 text-xs uppercase tracking-[0.08em] text-white font-bold">
                      <tr>
                        {['지역', '총 사용자', '완료자', '진행 중', '완료율', '평균 학습시간', '이탈률'].map(
                          (h) => (
                            <th key={h} className="px-6 py-3 text-left">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20 bg-white/5">
                      {regionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-white"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        regionStats.map((stat) => (
                          <tr key={stat.region} className="transition hover:bg-white/10">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-white">
                              {stat.region}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {stat.totalUsers}명
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-success-600">
                              {stat.completedUsers}명
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-primary-600">
                              {stat.inProgressUsers}명
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-white">
                                  {Math.round(stat.completionRate)}%
                                </div>
                                <div className="h-2 w-20 rounded-full bg-neutral-200">
                                  <div
                                    className="h-full rounded-full bg-primary-500"
                                    style={{ width: `${stat.completionRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                              {Math.floor(stat.avgStudyTime / 60)}분{' '}
                              {stat.avgStudyTime % 60}초
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  stat.dropoffRate >= 70
                                    ? 'bg-accent-50 border border-accent-200 text-accent-700'
                                    : stat.dropoffRate >= 50
                                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                                    : 'bg-success-50 border border-success-200 text-success-700'
                                }`}
                              >
                                {stat.dropoffRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-6">
          <h3 className="font-bold text-white mb-2">
            Supabase에서 더 자세한 정보 확인
          </h3>
          <p className="text-sm text-white">
            Supabase 대시보드에서 개별 사용자의 상세한 학습 기록, 시도별 데이터 등 더
            자세한 정보를 확인할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
