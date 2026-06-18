'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Tabs, TabItem } from 'plab-design-system';
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-surface-secondary">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface px-12 py-10 text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
          <p className="text-sm font-bold text-text-secondary">
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
    <div className="flex min-h-screen flex-col bg-bg-surface-secondary">
      {/* 헤더 */}
      <header className="bg-bg-surface border-b border-border-subtle">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PLAB Manager" className="h-8" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-tertiary">
                Admin Dashboard
              </p>
              <h1 className="text-base font-bold text-text-primary">
                플랩풋볼 매니저
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/content"
              className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)]"
            >
              콘텐츠 관리
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 pb-12">
        {/* 통계 카드 4개 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <p className="text-xs text-text-secondary">전체 학습자</p>
            <p className="mt-1 text-2xl font-extrabold text-text-primary">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <p className="text-xs text-text-secondary">학습 중</p>
            <p className="mt-1 text-2xl font-extrabold text-text-primary">
              {stats.inProgress}
            </p>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <p className="text-xs text-text-secondary">완료</p>
            <p className="mt-1 text-2xl font-extrabold text-text-primary">
              {stats.completed}
            </p>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <p className="text-xs text-text-secondary">전체 완료율</p>
            <p className="mt-1 text-2xl font-extrabold text-text-primary">
              {stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* 탭 + 콘텐츠 카드 */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface">
          {/* 탭 헤더 */}
          <div className="overflow-x-auto border-b border-border-subtle">
            <Tabs variant="underline" className="min-w-max px-2 pt-1">
              {(
                [
                  { key: 'users', label: '사용자 목록' },
                  { key: 'chapters', label: '챕터별 통계' },
                  { key: 'questions', label: '문제별 통계' },
                  { key: 'dropoff', label: '이탈 분석' },
                  { key: 'regions', label: '지역별 통계' },
                ] as { key: TabType; label: string }[]
              ).map((tab) => (
                <TabItem
                  key={tab.key}
                  active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </TabItem>
              ))}
            </Tabs>
          </div>

          <div className="p-4">
            {/* ── 사용자 목록 ── */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* 필터 칩 */}
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: 'all', label: '전체', count: stats.total },
                      { key: 'in_progress', label: '진행 중', count: stats.inProgress },
                      { key: 'completed', label: '완료', count: stats.completed },
                    ] as { key: 'all' | 'in_progress' | 'completed'; label: string; count: number }[]
                  ).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFilter(item.key)}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)] ${
                        filter === item.key
                          ? 'bg-bg-primary text-text-on-primary'
                          : 'border border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-surface-secondary'
                      }`}
                    >
                      {item.label} ({item.count})
                    </button>
                  ))}
                </div>

                {/* 테이블 */}
                <div className="overflow-x-auto rounded-lg border border-border-subtle">
                  <table className="min-w-full divide-y divide-[color:var(--border-subtle)]">
                    <thead className="bg-bg-surface-secondary">
                      <tr>
                        {['이름', '전화번호', '상태', '시작일', '완료일', '작업'].map(
                          (header) => (
                            <th
                              key={header}
                              className="px-4 py-3 text-left text-xs font-semibold text-text-secondary"
                            >
                              {header}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border-subtle)]">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-sm text-text-secondary"
                          >
                            사용자가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="transition hover:bg-bg-surface-secondary"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-text-primary">
                              {user.name}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {user.phone}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <Badge
                                tone={
                                  user.status === 'Completed'
                                    ? 'success'
                                    : user.status === 'In Progress'
                                    ? 'brand'
                                    : 'neutral'
                                }
                                variant="soft"
                                size="sm"
                              >
                                {user.status === 'Completed'
                                  ? '완료'
                                  : user.status === 'In Progress'
                                  ? '진행 중'
                                  : '차단'}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {user.created_at
                                ? new Date(user.created_at).toLocaleDateString(
                                    'ko-KR'
                                  )
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {user.completed_at
                                ? new Date(
                                    user.completed_at
                                  ).toLocaleDateString('ko-KR')
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
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
                                  className="text-sm font-semibold text-text-brand hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)]"
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

            {/* ── 챕터별 통계 ── */}
            {activeTab === 'chapters' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-primary">
                  챕터별 완료율 및 평균 소요시간
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border-subtle">
                  <table className="min-w-full divide-y divide-[color:var(--border-subtle)]">
                    <thead className="bg-bg-surface-secondary">
                      <tr>
                        {['챕터', '총 시도', '완료율', '평균 소요시간', '평균 정답률', '이탈률'].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-text-secondary"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border-subtle)]">
                      {chapterStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-sm text-text-secondary"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        chapterStats.map((stat) => (
                          <tr
                            key={stat.chapterId}
                            className="transition hover:bg-bg-surface-secondary"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-text-primary">
                              {stat.order}. {stat.chapterName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {stat.totalAttempts}회
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary">
                                  {Math.round(stat.completionRate)}%
                                </span>
                                <div className="h-2 w-16 rounded-full bg-bg-surface-secondary">
                                  <div
                                    className="h-full rounded-full bg-bg-primary"
                                    style={{ width: `${stat.completionRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {Math.floor(stat.avgTime / 60)}분 {stat.avgTime % 60}초
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <Badge
                                tone={
                                  stat.avgCorrectRate >= 80
                                    ? 'success'
                                    : stat.avgCorrectRate >= 60
                                    ? 'warning'
                                    : 'error'
                                }
                                variant="soft"
                                size="sm"
                              >
                                {stat.avgCorrectRate.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <Badge
                                tone={
                                  stat.dropoffRate >= 50
                                    ? 'error'
                                    : stat.dropoffRate >= 30
                                    ? 'warning'
                                    : 'success'
                                }
                                variant="soft"
                                size="sm"
                              >
                                {stat.dropoffRate.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 문제별 통계 ── */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-primary">
                  문제별 오답률 (높은 순)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border-subtle">
                  <table className="min-w-full divide-y divide-[color:var(--border-subtle)]">
                    <thead className="bg-bg-surface-secondary">
                      <tr>
                        {['챕터', '문제', '총 시도', '오답률', '선택 분포'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold text-text-secondary"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border-subtle)]">
                      {questionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-sm text-text-secondary"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        questionStats.map((stat) => (
                          <tr
                            key={stat.questionId}
                            className="transition hover:bg-bg-surface-secondary"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {stat.chapterName}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-text-primary">
                              {stat.questionText}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {stat.totalAttempts}회
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Badge
                                  tone={
                                    stat.incorrectRate >= 70
                                      ? 'error'
                                      : stat.incorrectRate >= 50
                                      ? 'warning'
                                      : 'success'
                                  }
                                  variant="soft"
                                  size="sm"
                                >
                                  {Math.round(stat.incorrectRate)}%
                                </Badge>
                                <div className="h-2 w-16 rounded-full bg-bg-surface-secondary">
                                  <div
                                    className="h-full rounded-full bg-[var(--text-error)]"
                                    style={{ width: `${stat.incorrectRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-text-secondary">
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

            {/* ── 이탈 분석 ── */}
            {activeTab === 'dropoff' && dropoffAnalysis && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-4">
                    <p className="text-xs text-text-secondary">총 사용자</p>
                    <p className="mt-1 text-2xl font-extrabold text-text-primary">
                      {dropoffAnalysis.totalUsers}명
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-4">
                    <p className="text-xs text-text-secondary">완료한 사용자</p>
                    <p className="mt-1 text-2xl font-extrabold text-text-primary">
                      {dropoffAnalysis.completedUsers}명
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-bg-surface-secondary p-4">
                    <p className="text-xs text-text-secondary">전체 완료율</p>
                    <p className="mt-1 text-2xl font-extrabold text-text-primary">
                      {Math.round(dropoffAnalysis.overallCompletionRate)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold text-text-primary">
                    챕터별 이탈자 수
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-border-subtle">
                    <table className="min-w-full divide-y divide-[color:var(--border-subtle)]">
                      <thead className="bg-bg-surface-secondary">
                        <tr>
                          {['순위', '챕터', '이탈자 수', '시각화'].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-text-secondary"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:var(--border-subtle)]">
                        {dropoffAnalysis.chapterDropoffs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-sm text-text-secondary"
                            >
                              데이터가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          dropoffAnalysis.chapterDropoffs.map((ch, idx) => (
                            <tr
                              key={ch.chapterId}
                              className="transition hover:bg-bg-surface-secondary"
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-text-primary">
                                #{idx + 1}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-text-primary">
                                {ch.order}. {ch.chapterName}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                                {ch.droppedCount}명
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <div className="h-3 w-36 rounded-full bg-bg-surface-secondary">
                                  <div
                                    className={`h-full rounded-full ${
                                      idx === 0
                                        ? 'bg-[var(--text-error)]'
                                        : idx === 1
                                        ? 'bg-[var(--text-warning)]'
                                        : idx === 2
                                        ? 'bg-[var(--text-warning)]'
                                        : 'bg-[var(--text-success)]'
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

            {/* ── 지역별 통계 ── */}
            {activeTab === 'regions' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-primary">
                  지역별 완료율 및 학습 현황
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border-subtle">
                  <table className="min-w-full divide-y divide-[color:var(--border-subtle)]">
                    <thead className="bg-bg-surface-secondary">
                      <tr>
                        {['지역', '총 사용자', '완료자', '진행 중', '완료율', '평균 학습시간', '이탈률'].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-text-secondary"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border-subtle)]">
                      {regionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-sm text-text-secondary"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        regionStats.map((stat) => (
                          <tr
                            key={stat.region}
                            className="transition hover:bg-bg-surface-secondary"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-text-primary">
                              {stat.region}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {stat.totalUsers}명
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-[var(--text-success)]">
                              {stat.completedUsers}명
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-text-brand">
                              {stat.inProgressUsers}명
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary">
                                  {Math.round(stat.completionRate)}%
                                </span>
                                <div className="h-2 w-16 rounded-full bg-bg-surface-secondary">
                                  <div
                                    className="h-full rounded-full bg-bg-primary"
                                    style={{ width: `${stat.completionRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                              {Math.floor(stat.avgStudyTime / 60)}분{' '}
                              {stat.avgStudyTime % 60}초
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <Badge
                                tone={
                                  stat.dropoffRate >= 70
                                    ? 'error'
                                    : stat.dropoffRate >= 50
                                    ? 'warning'
                                    : 'success'
                                }
                                variant="soft"
                                size="sm"
                              >
                                {stat.dropoffRate.toFixed(1)}%
                              </Badge>
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

        {/* Supabase 안내 */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
          <h3 className="mb-1 font-bold text-text-primary">
            Supabase에서 더 자세한 정보 확인
          </h3>
          <p className="text-sm text-text-secondary">
            Supabase 대시보드에서 개별 사용자의 상세한 학습 기록, 시도별 데이터 등 더
            자세한 정보를 확인할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
