'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AirtableRecord, User } from '@/types';
import type {
  ChapterStats,
  QuestionStats,
  DropoffAnalysis,
  RegionStats,
} from '@/lib/airtable/stats';

type TabType = 'users' | 'chapters' | 'questions' | 'dropoff' | 'regions';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AirtableRecord<User>[]>([]);
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

  // 인증 체크
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
        // 사용자 목록 가져오기
        const usersRes = await fetch('/api/admin/users');
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data);
        }

        // 챕터별 통계 가져오기
        const chapterStatsRes = await fetch('/api/admin/stats/chapters');
        const chapterStatsData = await chapterStatsRes.json();
        if (chapterStatsData.success) {
          setChapterStats(chapterStatsData.data);
        }

        // 문제별 통계 가져오기
        const questionStatsRes = await fetch('/api/admin/stats/questions');
        const questionStatsData = await questionStatsRes.json();
        if (questionStatsData.success) {
          setQuestionStats(questionStatsData.data);
        }

        // 이탈 분석 가져오기
        const dropoffRes = await fetch('/api/admin/stats/dropoff');
        const dropoffData = await dropoffRes.json();
        if (dropoffData.success) {
          setDropoffAnalysis(dropoffData.data);
        }

        // 지역별 통계 가져오기
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
    if (filter === 'in_progress')
      return user.fields.Status === 'In Progress';
    if (filter === 'completed') return user.fields.Status === 'Completed';
    return true;
  });

  const stats = {
    total: users.length,
    inProgress: users.filter((u) => u.fields.Status === 'In Progress').length,
    completed: users.filter((u) => u.fields.Status === 'Completed').length,
    blocked: users.filter((u) => u.fields.Status === 'Blocked').length,
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-10 py-8 text-center text-white shadow-2xl backdrop-blur">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/30 border-t-emerald-300" />
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-100">
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 pb-12 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[460px] w-[460px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(34,197,94,0.12),transparent_30%)]" />
      </div>

      <header className="relative border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg">
              ⚽
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-200">
                Admin Dashboard
              </p>
              <h1 className="text-xl font-bold">PLAB FOOTBALL 매니저</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-300/40 hover:text-emerald-100"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-300">
              전체 학습자
            </p>
            <p className="mt-2 text-3xl font-extrabold">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-5 shadow-lg backdrop-blur">
            <p className="text-xs uppercase tracking-[0.12em] text-emerald-100">
              학습 중
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-50">
              {stats.inProgress}
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-300/40 bg-cyan-500/10 p-5 shadow-lg backdrop-blur">
            <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">
              완료
            </p>
            <p className="mt-2 text-3xl font-extrabold text-cyan-50">
              {stats.completed}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-300">
              전체 완료율
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-100">
              {stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3 text-sm">
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
                className={`rounded-2xl px-4 py-2 font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-slate-950 shadow'
                    : 'border border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/40 hover:text-emerald-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 text-slate-100">
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
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        filter === item.key
                          ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-slate-950 shadow'
                          : 'border border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/40 hover:text-emerald-100'
                      }`}
                    >
                      {item.label} ({item.count})
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5 text-xs uppercase tracking-[0.08em] text-slate-300">
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
                    <tbody className="divide-y divide-white/5 bg-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-slate-300"
                          >
                            사용자가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="transition hover:bg-white/5"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                              {user.fields.Name}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-200">
                              {user.fields.Phone}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  user.fields.Status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-100'
                                    : user.fields.Status === 'In Progress'
                                    ? 'bg-cyan-500/20 text-cyan-100'
                                    : 'bg-rose-500/20 text-rose-100'
                                }`}
                              >
                                {user.fields.Status === 'Completed'
                                  ? '완료'
                                  : user.fields.Status === 'In Progress'
                                  ? '진행 중'
                                  : '차단'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                              {user.createdTime
                                ? new Date(user.createdTime).toLocaleDateString(
                                    'ko-KR'
                                  )
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                              {user.fields.Completed_At
                                ? new Date(
                                    user.fields.Completed_At
                                  ).toLocaleDateString('ko-KR')
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              {user.fields.Status === 'In Progress' && (
                                <button
                                  onClick={async () => {
                                    if (confirm(`${user.fields.Name} 님을 완료 처리하시겠습니까?`)) {
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
                                  className="font-semibold text-cyan-200 hover:text-emerald-100"
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
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5 text-xs uppercase tracking-[0.08em] text-slate-300">
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
                    <tbody className="divide-y divide-white/5 bg-white/5">
                      {chapterStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-slate-300"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        chapterStats.map((stat) => (
                          <tr key={stat.chapterId} className="transition hover:bg-white/5">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                              {stat.order}. {stat.chapterName}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-200">
                              {stat.totalAttempts}회
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-white">
                                  {Math.round(stat.completionRate)}%
                                </div>
                                <div className="h-2 w-20 rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                                    style={{ width: `${stat.completionRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-200">
                              {Math.floor(stat.avgTime / 60)}분 {stat.avgTime % 60}초
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  stat.avgCorrectRate >= 80
                                    ? 'bg-emerald-500/20 text-emerald-100'
                                    : stat.avgCorrectRate >= 60
                                    ? 'bg-amber-500/20 text-amber-100'
                                    : 'bg-rose-500/20 text-rose-100'
                                }`}
                              >
                                {stat.avgCorrectRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  stat.dropoffRate >= 50
                                    ? 'bg-rose-500/20 text-rose-100'
                                    : stat.dropoffRate >= 30
                                    ? 'bg-amber-500/20 text-amber-100'
                                    : 'bg-emerald-500/20 text-emerald-100'
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
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5 text-xs uppercase tracking-[0.08em] text-slate-300">
                      <tr>
                        {['챕터', '문제', '총 시도', '오답률', '선택 분포'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-white/5">
                      {questionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-slate-300"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        questionStats.map((stat) => (
                          <tr key={stat.questionId} className="transition hover:bg-white/5">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-200">
                              {stat.chapterName}
                            </td>
                            <td className="px-6 py-4 text-sm text-white">
                              {stat.questionText}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-200">
                              {stat.totalAttempts}회
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    stat.incorrectRate >= 70
                                      ? 'bg-rose-500/20 text-rose-100'
                                      : stat.incorrectRate >= 50
                                      ? 'bg-amber-500/20 text-amber-100'
                                      : 'bg-emerald-500/20 text-emerald-100'
                                  }`}
                                >
                                  {Math.round(stat.incorrectRate)}%
                                </span>
                                <div className="h-2 w-20 rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-300"
                                    style={{ width: `${stat.incorrectRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-300">
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
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-300">
                      총 사용자
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {dropoffAnalysis.totalUsers}명
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-emerald-100">
                      완료한 사용자
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-50">
                      {dropoffAnalysis.completedUsers}명
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-300/40 bg-cyan-500/10 p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">
                      전체 완료율
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-cyan-50">
                      {Math.round(dropoffAnalysis.overallCompletionRate)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    챕터별 이탈자 수
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/5 text-xs uppercase tracking-[0.08em] text-slate-300">
                        <tr>
                          {['순위', '챕터', '이탈자 수', '시각화'].map((h) => (
                            <th key={h} className="px-6 py-3 text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-white/5">
                        {dropoffAnalysis.chapterDropoffs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-8 text-center text-slate-300"
                            >
                              데이터가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          dropoffAnalysis.chapterDropoffs.map((chapter, idx) => (
                            <tr key={chapter.chapterId} className="transition hover:bg-white/5">
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                                #{idx + 1}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                                {chapter.order}. {chapter.chapterName}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-200">
                                {chapter.droppedCount}명
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="h-4 w-52 rounded-full bg-white/10">
                                  <div
                                    className={`h-full rounded-full ${
                                      idx === 0
                                        ? 'bg-rose-400'
                                        : idx === 1
                                        ? 'bg-amber-400'
                                        : idx === 2
                                        ? 'bg-yellow-300'
                                        : 'bg-emerald-400'
                                    }`}
                                    style={{
                                      width: `${
                                        dropoffAnalysis.chapterDropoffs[0]
                                          .droppedCount > 0
                                          ? (chapter.droppedCount /
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
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5 text-xs uppercase tracking-[0.08em] text-slate-300">
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
                    <tbody className="divide-y divide-white/5 bg-white/5">
                      {regionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-slate-300"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        regionStats.map((stat) => (
                          <tr key={stat.region} className="transition hover:bg-white/5">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                              {stat.region}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-200">
                              {stat.totalUsers}명
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-emerald-100">
                              {stat.completedUsers}명
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-cyan-100">
                              {stat.inProgressUsers}명
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-white">
                                  {Math.round(stat.completionRate)}%
                                </div>
                                <div className="h-2 w-20 rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                                    style={{ width: `${stat.completionRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-200">
                              {Math.floor(stat.avgStudyTime / 60)}분{' '}
                              {stat.avgStudyTime % 60}초
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  stat.dropoffRate >= 70
                                    ? 'bg-rose-500/20 text-rose-100'
                                    : stat.dropoffRate >= 50
                                    ? 'bg-amber-500/20 text-amber-100'
                                    : 'bg-emerald-500/20 text-emerald-100'
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

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 backdrop-blur">
          <h3 className="font-semibold text-white mb-2">
            💡 Airtable에서 더 자세한 정보 확인
          </h3>
          <p className="text-sm text-slate-200/80">
            Airtable에서 개별 사용자의 상세한 학습 기록, 시도별 데이터 등 더
            자세한 정보를 확인할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
