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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            ⚽ 플랩풋볼 관리자 대시보드
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition font-medium text-sm"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 전체 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              전체 학습자
            </h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              학습 중
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.inProgress}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">완료</h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.completed}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              전체 완료율
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                사용자 목록
              </button>
              <button
                onClick={() => setActiveTab('chapters')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'chapters'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                챕터별 통계
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'questions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                문제별 통계
              </button>
              <button
                onClick={() => setActiveTab('dropoff')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'dropoff'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                이탈 분석
              </button>
              <button
                onClick={() => setActiveTab('regions')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'regions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                지역별 통계
              </button>
            </nav>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-6">
            {/* 사용자 목록 탭 */}
            {activeTab === 'users' && (
              <div>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    전체 ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('in_progress')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filter === 'in_progress'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    진행 중 ({stats.inProgress})
                  </button>
                  <button
                    onClick={() => setFilter('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filter === 'completed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    완료 ({stats.completed})
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          전화번호
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          시작일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          완료일
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            사용자가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fields.Name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.fields.Phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.fields.Status === 'Completed'
                                    ? 'bg-green-100 text-green-800'
                                    : user.fields.Status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {user.fields.Status === 'Completed'
                                  ? '완료'
                                  : user.fields.Status === 'In Progress'
                                  ? '진행 중'
                                  : '차단'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.createdTime
                                ? new Date(user.createdTime).toLocaleDateString(
                                    'ko-KR'
                                  )
                                : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.fields.Completed_At
                                ? new Date(
                                    user.fields.Completed_At
                                  ).toLocaleDateString('ko-KR')
                                : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 챕터별 통계 탭 */}
            {activeTab === 'chapters' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  챕터별 완료율 및 평균 소요시간
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          챕터
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          총 시도
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          완료율
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          평균 소요시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          평균 정답률
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이탈률
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {chapterStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        chapterStats.map((stat) => (
                          <tr key={stat.chapterId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {stat.order}. {stat.chapterName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stat.totalAttempts}회
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900 mr-2">
                                  {Math.round(stat.completionRate)}%
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                      width: `${stat.completionRate}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.floor(stat.avgTime / 60)}분{' '}
                              {stat.avgTime % 60}초
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  stat.avgCorrectRate >= 80
                                    ? 'bg-green-100 text-green-800'
                                    : stat.avgCorrectRate >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {stat.avgCorrectRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  stat.dropoffRate >= 50
                                    ? 'bg-red-100 text-red-800'
                                    : stat.dropoffRate >= 30
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
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

            {/* 문제별 통계 탭 */}
            {activeTab === 'questions' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  문제별 오답률 (높은 순)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          챕터
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          문제
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          총 시도
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          오답률
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          선택 분포
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {questionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        questionStats.map((stat) => (
                          <tr key={stat.questionId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {stat.chapterName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {stat.questionText}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stat.totalAttempts}회
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                                    stat.incorrectRate >= 70
                                      ? 'bg-red-100 text-red-800'
                                      : stat.incorrectRate >= 50
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {Math.round(stat.incorrectRate)}%
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{
                                      width: `${stat.incorrectRate}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
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

            {/* 이탈 분석 탭 */}
            {activeTab === 'dropoff' && dropoffAnalysis && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-blue-700 mb-2">
                      총 사용자
                    </h4>
                    <p className="text-3xl font-bold text-blue-900">
                      {dropoffAnalysis.totalUsers}명
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-green-700 mb-2">
                      완료한 사용자
                    </h4>
                    <p className="text-3xl font-bold text-green-900">
                      {dropoffAnalysis.completedUsers}명
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-purple-700 mb-2">
                      전체 완료율
                    </h4>
                    <p className="text-3xl font-bold text-purple-900">
                      {Math.round(dropoffAnalysis.overallCompletionRate)}%
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">
                  챕터별 이탈자 수
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          순위
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          챕터
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이탈자 수
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          시각화
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dropoffAnalysis.chapterDropoffs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        dropoffAnalysis.chapterDropoffs.map((chapter, idx) => (
                          <tr key={chapter.chapterId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{idx + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {chapter.order}. {chapter.chapterName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {chapter.droppedCount}명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-48 bg-gray-200 rounded-full h-4">
                                <div
                                  className={`h-4 rounded-full ${
                                    idx === 0
                                      ? 'bg-red-500'
                                      : idx === 1
                                      ? 'bg-orange-500'
                                      : idx === 2
                                      ? 'bg-yellow-500'
                                      : 'bg-blue-500'
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
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 지역별 통계 탭 */}
            {activeTab === 'regions' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  지역별 완료율 및 학습 현황
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          지역
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          총 사용자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          완료자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          진행 중
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          완료율
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          평균 학습시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이탈률
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {regionStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        regionStats.map((stat) => (
                          <tr key={stat.region} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {stat.region}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stat.totalUsers}명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {stat.completedUsers}명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                              {stat.inProgressUsers}명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900 mr-2">
                                  {Math.round(stat.completionRate)}%
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                      width: `${stat.completionRate}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.floor(stat.avgStudyTime / 60)}분{' '}
                              {stat.avgStudyTime % 60}초
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  stat.dropoffRate >= 70
                                    ? 'bg-red-100 text-red-800'
                                    : stat.dropoffRate >= 50
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
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

        {/* 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 Airtable에서 더 자세한 정보 확인
          </h3>
          <p className="text-sm text-blue-800">
            Airtable에서 개별 사용자의 상세한 학습 기록, 시도별 데이터 등 더
            자세한 정보를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
