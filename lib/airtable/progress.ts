import base, { TABLES } from './client';
import type {
  UserProgress,
  ChapterHistory,
  QuestionAttempt,
  AirtableRecord,
} from '@/types';

/**
 * 사용자의 특정 챕터 진행 상황 가져오기
 */
export async function getUserProgress(
  userId: string,
  chapterId: string
): Promise<AirtableRecord<UserProgress> | null> {
  try {
    console.log('=== getUserProgress 호출 ===');
    console.log('userId:', userId);
    console.log('chapterId:', chapterId);

    // Link 필드의 Record ID로는 Airtable formula 필터링 불가능
    // 모든 레코드를 가져와서 JavaScript에서 필터링
    const records = await base!(TABLES.USER_PROGRESS).select().all();

    console.log('전체 User_Progress 레코드 수:', records.length);

    // JavaScript에서 User와 Chapter 배열에 해당 ID가 포함되어 있는지 확인
    const matchedRecord = records.find((record) => {
      const userIds = record.fields.User as string[] | undefined;
      const chapterIds = record.fields.Chapter as string[] | undefined;

      return (
        userIds?.includes(userId) &&
        chapterIds?.includes(chapterId)
      );
    });

    if (matchedRecord) {
      console.log('✅ 찾은 레코드:', {
        id: matchedRecord.id,
        User: matchedRecord.fields.User,
        Chapter: matchedRecord.fields.Chapter,
      });

      return {
        id: matchedRecord.id,
        fields: matchedRecord.fields as UserProgress,
        createdTime: matchedRecord._rawJson.createdTime,
      };
    }

    console.log('⚠️  매칭되는 progress 레코드 없음');
    return null;
  } catch (error) {
    console.error('진행 상황 조회 오류:', error);
    return null;
  }
}

/**
 * 사용자의 모든 진행 상황 가져오기
 */
export async function getAllUserProgress(
  userId: string
): Promise<AirtableRecord<UserProgress>[]> {
  try {
    // Link 필드의 Record ID로는 Airtable formula 필터링 불가능
    // 모든 레코드를 가져와서 JavaScript에서 필터링
    const records = await base!(TABLES.USER_PROGRESS).select().all();

    const matchedRecords = records.filter((record) => {
      const userIds = record.fields.User as string[] | undefined;
      return userIds?.includes(userId);
    });

    return matchedRecords.map((record) => ({
      id: record.id,
      fields: record.fields as UserProgress,
      createdTime: record._rawJson.createdTime,
    }));
  } catch (error) {
    console.error('전체 진행 상황 조회 오류:', error);
    return [];
  }
}

/**
 * 진행 상황 생성
 */
export async function createProgress(
  userId: string,
  chapterId: string,
  questionsAssigned: string[]
): Promise<AirtableRecord<UserProgress>> {
  try {
    const record: any = await base!(TABLES.USER_PROGRESS).create({
      User: [userId],
      Chapter: [chapterId],
      Video_Watched: false,
      Video_Watch_Time: 0,
      Questions_Assigned: JSON.stringify(questionsAssigned),
      Questions_Answered: 0,
      All_Correct: false,
      Chapter_Completed: false,
      Started_At: new Date().toISOString(),
    } as any);

    return {
      id: record.id,
      fields: record.fields as UserProgress,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('진행 상황 생성 오류:', error);
    throw new Error('진행 상황을 생성할 수 없습니다.');
  }
}

/**
 * 영상 시청 시간 업데이트
 */
export async function updateVideoWatchTime(
  progressId: string,
  watchTime: number,
  isWatched: boolean
): Promise<void> {
  try {
    await base!(TABLES.USER_PROGRESS).update(progressId, {
      Video_Watch_Time: watchTime,
      Video_Watched: isWatched,
    } as any);
  } catch (error) {
    console.error('영상 시청 시간 업데이트 오류:', error);
  }
}

/**
 * 챕터 완료 처리
 */
export async function completeChapter(
  progressId: string,
  allCorrect: boolean
): Promise<void> {
  try {
    await base!(TABLES.USER_PROGRESS).update(progressId, {
      All_Correct: allCorrect,
      Chapter_Completed: allCorrect,
    } as any);
  } catch (error) {
    console.error('챕터 완료 처리 오류:', error);
    throw new Error('챕터 완료 처리를 할 수 없습니다.');
  }
}

/**
 * 챕터 학습 기록 생성
 */
export async function createChapterHistory(
  userId: string,
  chapterId: string,
  attemptNumber: number
): Promise<AirtableRecord<ChapterHistory>> {
  try {
    const record: any = await base!(TABLES.CHAPTER_HISTORY).create({
      User: [userId],
      Chapter: [chapterId],
      Attempt_Number: attemptNumber,
      Start_Time: new Date().toISOString(),
      Video_Watch_Time: 0,
      Status: 'In Progress',
    } as any);

    return {
      id: record.id,
      fields: record.fields as ChapterHistory,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('챕터 기록 생성 오류:', error);
    throw new Error('챕터 기록을 생성할 수 없습니다.');
  }
}

/**
 * 챕터 학습 기록 완료
 */
export async function completeChapterHistory(
  historyId: string,
  questionsCorrect: number,
  questionsTotal: number,
  videoWatchTime: number
): Promise<void> {
  try {
    await base!(TABLES.CHAPTER_HISTORY).update(historyId, {
      End_Time: new Date().toISOString(),
      Questions_Correct: questionsCorrect,
      Questions_Total: questionsTotal,
      Video_Watch_Time: videoWatchTime,
      Status: 'Completed',
    } as any);
  } catch (error) {
    console.error('챕터 기록 완료 처리 오류:', error);
  }
}

/**
 * 문제 풀이 기록 생성
 */
export async function createQuestionAttempt(
  userId: string,
  questionId: string,
  chapterId: string,
  userAnswer: '1' | '2' | '3' | '4',
  attemptNumber: number,
  timeSpent?: number
): Promise<void> {
  try {
    await base!(TABLES.QUESTION_ATTEMPTS).create({
      User: [userId],
      Question: [questionId],
      Chapter: [chapterId],
      User_Answer: userAnswer,
      Attempt_Number: attemptNumber,
      Time_Spent: timeSpent || 0,
    } as any);
  } catch (error) {
    console.error('문제 풀이 기록 생성 오류:', error);
  }
}

/**
 * 사용자의 챕터별 시도 횟수 조회
 */
export async function getChapterAttemptCount(
  userId: string,
  chapterId: string
): Promise<number> {
  try {
    // Link 필드의 Record ID로는 Airtable formula 필터링 불가능
    // 모든 레코드를 가져와서 JavaScript에서 필터링
    const records = await base!(TABLES.CHAPTER_HISTORY).select().all();

    const matchedRecords = records.filter((record) => {
      const userIds = record.fields.User as string[] | undefined;
      const chapterIds = record.fields.Chapter as string[] | undefined;

      return (
        userIds?.includes(userId) &&
        chapterIds?.includes(chapterId)
      );
    });

    return matchedRecords.length;
  } catch (error) {
    console.error('시도 횟수 조회 오류:', error);
    return 0;
  }
}
