import base, { TABLES } from './client';
import { getActiveChapters } from './chapters';
import type { AirtableRecord, Chapter, Question, ChapterHistory } from '@/types';

/**
 * 챕터별 통계
 */
export interface ChapterStats {
  chapterId: string;
  chapterName: string;
  order: number;
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number; // 완료율 %
  avgTime: number; // 평균 소요 시간 (초)
  avgCorrectRate: number; // 평균 정답률 %
  dropoffRate: number; // 이탈률 %
}

/**
 * 문제별 통계
 */
export interface QuestionStats {
  questionId: string;
  questionText: string;
  chapterName: string;
  totalAttempts: number;
  correctCount: number;
  incorrectRate: number; // 오답률 %
  answerDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
  };
}

/**
 * 챕터별 통계 조회
 */
export async function getChapterStats(): Promise<ChapterStats[]> {
  try {
    // 챕터 목록 가져오기
    const chapters = await getActiveChapters();

    // Chapter_History 레코드 모두 가져오기
    const historyRecords = await base!(TABLES.CHAPTER_HISTORY).select().all();

    // User_Progress 레코드 모두 가져오기 (이탈률 계산용)
    const progressRecords = await base!(TABLES.USER_PROGRESS).select().all();

    const stats: ChapterStats[] = [];

    for (const chapter of chapters) {
      // 해당 챕터의 기록들 필터링
      const chapterHistories = historyRecords.filter((record) => {
        const chapterIds = record.fields.Chapter as string[] | undefined;
        return chapterIds?.includes(chapter.id);
      });

      // 완료된 기록만 필터링
      const completedHistories = chapterHistories.filter(
        (record) => record.fields.Status === 'Completed'
      );

      // 평균 소요 시간 계산
      let avgTime = 0;
      if (completedHistories.length > 0) {
        const totalTime = completedHistories.reduce((sum, record) => {
          const start = new Date(record.fields.Start_Time as string);
          const end = new Date(record.fields.End_Time as string);
          return sum + (end.getTime() - start.getTime()) / 1000;
        }, 0);
        avgTime = totalTime / completedHistories.length;
      }

      // 평균 정답률 계산
      let avgCorrectRate = 0;
      if (completedHistories.length > 0) {
        const totalCorrectRate = completedHistories.reduce((sum, record) => {
          const correct = (record.fields.Questions_Correct as number) || 0;
          const total = (record.fields.Questions_Total as number) || 1;
          return sum + (correct / total) * 100;
        }, 0);
        avgCorrectRate = totalCorrectRate / completedHistories.length;
      }

      // 이탈률 계산: 해당 챕터에 진입했지만 완료하지 못한 비율
      const progressCount = progressRecords.filter((record) => {
        const chapterIds = record.fields.Chapter as string[] | undefined;
        return chapterIds?.includes(chapter.id);
      }).length;

      const completedProgressCount = progressRecords.filter((record) => {
        const chapterIds = record.fields.Chapter as string[] | undefined;
        const isCompleted = record.fields.Chapter_Completed;
        return chapterIds?.includes(chapter.id) && isCompleted;
      }).length;

      const dropoffRate =
        progressCount > 0
          ? ((progressCount - completedProgressCount) / progressCount) * 100
          : 0;

      stats.push({
        chapterId: chapter.id,
        chapterName: chapter.fields.Name,
        order: chapter.fields.Order,
        totalAttempts: chapterHistories.length,
        completedAttempts: completedHistories.length,
        completionRate:
          chapterHistories.length > 0
            ? (completedHistories.length / chapterHistories.length) * 100
            : 0,
        avgTime: Math.round(avgTime),
        avgCorrectRate: Math.round(avgCorrectRate * 10) / 10,
        dropoffRate: Math.round(dropoffRate * 10) / 10,
      });
    }

    // Order 순으로 정렬
    return stats.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('챕터별 통계 조회 오류:', error);
    throw new Error('챕터별 통계를 불러올 수 없습니다.');
  }
}

/**
 * 문제별 통계 조회
 */
export async function getQuestionStats(): Promise<QuestionStats[]> {
  try {
    // 문제 목록 가져오기 (모든 문제)
    const questionRecords = await base!(TABLES.QUESTIONS).select().all();
    const questions = questionRecords.map((record) => ({
      id: record.id,
      fields: record.fields as unknown as Question,
      createdTime: record._rawJson.createdTime,
    }));

    // 챕터 목록 가져오기 (문제와 챕터 매핑용)
    const chapters = await getActiveChapters();

    // Question_Attempts 레코드 모두 가져오기
    const attemptRecords = await base!(TABLES.QUESTION_ATTEMPTS).select().all();

    const stats: QuestionStats[] = [];

    for (const question of questions) {
      // 해당 문제의 시도 기록들 필터링
      const questionAttempts = attemptRecords.filter((record) => {
        const questionIds = record.fields.Question as string[] | undefined;
        return questionIds?.includes(question.id);
      });

      // 정답/오답 카운트
      const correctCount = questionAttempts.filter((record) => {
        const userAnswer = record.fields.User_Answer;
        return userAnswer === question.fields.Correct_Answer;
      }).length;

      // 선택지별 분포
      const answerDistribution = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
      };

      questionAttempts.forEach((record) => {
        const userAnswer = record.fields.User_Answer as
          | '1'
          | '2'
          | '3'
          | '4'
          | undefined;
        if (userAnswer) {
          answerDistribution[userAnswer]++;
        }
      });

      // 챕터 이름 찾기
      const chapterIds = question.fields.Chapter_Category as string[] | undefined;
      const chapterId = chapterIds?.[0];
      const chapter = chapters.find((c) => c.id === chapterId);
      const chapterName = chapter?.fields.Name || '알 수 없음';

      stats.push({
        questionId: question.id,
        questionText: question.fields.Question_Text.substring(0, 50) + '...',
        chapterName,
        totalAttempts: questionAttempts.length,
        correctCount,
        incorrectRate:
          questionAttempts.length > 0
            ? ((questionAttempts.length - correctCount) /
                questionAttempts.length) *
              100
            : 0,
        answerDistribution,
      });
    }

    // 오답률 높은 순으로 정렬
    return stats.sort((a, b) => b.incorrectRate - a.incorrectRate);
  } catch (error) {
    console.error('문제별 통계 조회 오류:', error);
    throw new Error('문제별 통계를 불러올 수 없습니다.');
  }
}

/**
 * 전체 이탈 분석
 */
export interface DropoffAnalysis {
  totalUsers: number;
  completedUsers: number;
  overallCompletionRate: number;
  chapterDropoffs: {
    chapterId: string;
    chapterName: string;
    order: number;
    droppedCount: number;
  }[];
}

/**
 * 지역별 통계
 */
export interface RegionStats {
  region: string;
  totalUsers: number;
  completedUsers: number;
  inProgressUsers: number;
  completionRate: number; // 완료율 %
  avgStudyTime: number; // 평균 학습 시간 (초)
  dropoffRate: number; // 이탈률 %
}

export async function getDropoffAnalysis(): Promise<DropoffAnalysis> {
  try {
    // 챕터 목록 가져오기
    const chapters = await getActiveChapters();

    // 사용자 목록 가져오기
    const users = await base!(TABLES.USERS).select().all();
    const totalUsers = users.length;
    const completedUsers = users.filter(
      (u) => u.fields.Status === 'Completed'
    ).length;

    // User_Progress 레코드 모두 가져오기
    const progressRecords = await base!(TABLES.USER_PROGRESS).select().all();

    // 각 챕터별 이탈 사용자 수 계산
    const chapterDropoffs = chapters.map((chapter) => {
      // 해당 챕터를 시작했지만 완료하지 못한 사용자 수
      const droppedCount = progressRecords.filter((record) => {
        const chapterIds = record.fields.Chapter as string[] | undefined;
        const isCompleted = record.fields.Chapter_Completed;
        return chapterIds?.includes(chapter.id) && !isCompleted;
      }).length;

      return {
        chapterId: chapter.id,
        chapterName: chapter.fields.Name,
        order: chapter.fields.Order,
        droppedCount,
      };
    });

    // 이탈자가 많은 순으로 정렬
    chapterDropoffs.sort((a, b) => b.droppedCount - a.droppedCount);

    return {
      totalUsers,
      completedUsers,
      overallCompletionRate:
        totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0,
      chapterDropoffs,
    };
  } catch (error) {
    console.error('이탈 분석 오류:', error);
    throw new Error('이탈 분석을 불러올 수 없습니다.');
  }
}

/**
 * 지역별 통계 조회
 */
export async function getRegionStats(): Promise<RegionStats[]> {
  try {
    // 사용자 목록 가져오기
    const users = await base!(TABLES.USERS).select().all();

    // 지역별로 그룹화
    const regionMap = new Map<string, any[]>();

    users.forEach((user) => {
      const region = (user.fields.Region as string) || '미입력';
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(user);
    });

    const stats: RegionStats[] = [];

    // 각 지역별 통계 계산
    for (const [region, regionUsers] of regionMap.entries()) {
      const totalUsers = regionUsers.length;
      const completedUsers = regionUsers.filter(
        (u) => u.fields.Status === 'Completed'
      ).length;
      const inProgressUsers = regionUsers.filter(
        (u) => u.fields.Status === 'In Progress'
      ).length;

      // 평균 학습 시간 계산
      let avgStudyTime = 0;
      if (totalUsers > 0) {
        const totalStudyTime = regionUsers.reduce((sum, user) => {
          return sum + ((user.fields.Total_Study_Time as number) || 0);
        }, 0);
        avgStudyTime = totalStudyTime / totalUsers;
      }

      // 이탈률 계산: 진행 중인데 아직 완료하지 못한 비율
      const dropoffRate =
        totalUsers > 0
          ? ((totalUsers - completedUsers) / totalUsers) * 100
          : 0;

      stats.push({
        region,
        totalUsers,
        completedUsers,
        inProgressUsers,
        completionRate:
          totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0,
        avgStudyTime: Math.round(avgStudyTime),
        dropoffRate: Math.round(dropoffRate * 10) / 10,
      });
    }

    // 사용자 수가 많은 순으로 정렬
    return stats.sort((a, b) => b.totalUsers - a.totalUsers);
  } catch (error) {
    console.error('지역별 통계 조회 오류:', error);
    throw new Error('지역별 통계를 불러올 수 없습니다.');
  }
}
