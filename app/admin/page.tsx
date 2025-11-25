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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 rounded-xl border border-neutral-200 bg-white px-12 py-10 text-center shadow-lg">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-600">
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
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 pb-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(21,112,255,0.06),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,204,123,0.04),transparent_50%)]" />
      </div>

      <header className="relative border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PLAB Manager" className="h-10" />
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 font-bold">
                Admin Dashboard
              </p>
              <h1 className="text-xl font-bold text-neutral-900">플랩풋볼 매니저</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-600"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 font-bold">
              전체 학습자
            </p>
            <p className="mt-2 text-3xl font-extrabold text-neutral-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-primary-700 font-bold">
              학습 중
            </p>
            <p className="mt-2 text-3xl font-extrabold text-primary-600">
              {stats.inProgress}
            </p>
          </div>
          <div className="rounded-xl border border-success-200 bg-success-50 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-success-700 font-bold">
              완료
            </p>
            <p className="mt-2 text-3xl font-extrabold text-success-600">
              {stats.completed}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 font-bold">
              전체 완료율
            </p>
            <p className="mt-2 text-3xl font-extrabold text-success-600">
              {stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="flex flex-wrap gap-2 border-b border-neutral-200 px-4 py-3 text-sm">
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
                    ? 'bg-primary-500 text-white shadow'
                    : 'border border-neutral-300 bg-neutral-50 text-neutral-700 hover:border-primary-500 hover:text-primary-600'
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
                          ? 'bg-primary-500 text-white shadow'
                          : 'border border-neutral-300 bg-neutral-50 text-neutral-700 hover:border-primary-500 hover:text-primary-600'
                      }`}
                    >
                      {item.label} ({item.count})
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50 text-xs uppercase tracking-[0.08em] text-neutral-600 font-bold">
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
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-neutral-600"
                          >
                            사용자가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="transition hover:bg-neutral-50"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-neutral-900">
                              {user.fields.Name}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
                              {user.fields.Phone}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  user.fields.Status === 'Completed'
                                    ? 'bg-success-50 border border-success-200 text-success-700'
                                    : user.fields.Status === 'In Progress'
                                    ? 'bg-primary-50 border border-primary-200 text-primary-700'
                                    : 'bg-accent-50 border border-accent-200 text-accent-700'
                                }`}
                              >
                                {user.fields.Status === 'Completed'
                                  ? '완료'
                                  : user.fields.Status === 'In Progress'
                                  ? '진행 중'
                                  : '차단'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">
                              {user.createdTime
                                ? new Date(user.createdTime).toLocaleDateString(
                                    'ko-KR'
                                  )
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">
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
                                  className="font-bold text-primary-600 hover:text-success-600"
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
                <h3 className="text-lg font-bold text-neutral-900">
                  챕터별 완료율 및 평균 소요시간
                </h3>
                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50 text-xs uppercase tracking-[0.08em] text-neutral-600 font-bold">
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
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {chapterStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-neutral-600"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        chapterStats.map((stat) => (
                          <tr key={stat.chapterId} className="transition hover:bg-neutral-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-neutral-900">
                              {stat.order}. {stat.chapterName}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
                              {stat.totalAttempts}회
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-neutral-900">
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
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
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
                <h3 className="text-lg font-bold text-neutral-900">
                  문제별 오답률 (높은 순)
                </h3>
                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50 text-xs uppercase tracking-[0.08em] text-neutral-600 font-bold">
                      <tr>
                        {['챕터', '문제', '총 시도', '오답률', '선택 분포'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {questionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-neutral-600"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        questionStats.map((stat) => (
                          <tr key={stat.questionId} className="transition hover:bg-neutral-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
                              {stat.chapterName}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-900 font-medium">
                              {stat.questionText}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
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
                            <td className="whitespace-nowrap px-6 py-4 text-xs text-neutral-600">
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
                  <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 font-bold">
                      총 사용자
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-neutral-900">
                      {dropoffAnalysis.totalUsers}명
                    </p>
                  </div>
                  <div className="rounded-xl border border-success-200 bg-success-50 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.12em] text-success-700 font-bold">
                      완료한 사용자
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-success-600">
                      {dropoffAnalysis.completedUsers}명
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.12em] text-primary-700 font-bold">
                      전체 완료율
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-primary-600">
                      {Math.round(dropoffAnalysis.overallCompletionRate)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">
                    챕터별 이탈자 수
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-neutral-200">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50 text-xs uppercase tracking-[0.08em] text-neutral-600 font-bold">
                        <tr>
                          {['순위', '챕터', '이탈자 수', '시각화'].map((h) => (
                            <th key={h} className="px-6 py-3 text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 bg-white">
                        {dropoffAnalysis.chapterDropoffs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-8 text-center text-neutral-600"
                            >
                              데이터가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          dropoffAnalysis.chapterDropoffs.map((chapter, idx) => (
                            <tr key={chapter.chapterId} className="transition hover:bg-neutral-50">
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-neutral-900">
                                #{idx + 1}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">
                                {chapter.order}. {chapter.chapterName}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
                                {chapter.droppedCount}명
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
                <h3 className="text-lg font-bold text-neutral-900">
                  지역별 완료율 및 학습 현황
                </h3>
                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50 text-xs uppercase tracking-[0.08em] text-neutral-600 font-bold">
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
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {regionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-neutral-600"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        regionStats.map((stat) => (
                          <tr key={stat.region} className="transition hover:bg-neutral-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-neutral-900">
                              {stat.region}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
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
                                <div className="text-sm font-bold text-neutral-900">
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
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
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

        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="font-bold text-neutral-900 mb-2">
            💡 Airtable에서 더 자세한 정보 확인
          </h3>
          <p className="text-sm text-neutral-600">
            Airtable에서 개별 사용자의 상세한 학습 기록, 시도별 데이터 등 더
            자세한 정보를 확인할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
