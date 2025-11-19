import base, { TABLES } from './client';
import type { Question, AirtableRecord } from '@/types';
import { getChapterById } from './chapters';

/**
 * 특정 챕터의 활성화된 문제들 가져오기
 */
export async function getQuestionsByChapter(
  chapterId: string
): Promise<AirtableRecord<Question>[]> {
  try {
    console.log('=== Questions 조회 시작 ===');
    console.log('ChapterId:', chapterId);

    // 챕터 정보 먼저 가져오기
    const chapter = await getChapterById(chapterId);
    if (!chapter) {
      console.error('챕터를 찾을 수 없음:', chapterId);
      return [];
    }

    const chapterName = chapter.fields.Name;
    console.log('Chapter Name:', chapterName);

    const formula = `AND(FIND('${chapterName}', ARRAYJOIN({Chapter_Category})) > 0, {Status} = 'Active')`;
    console.log('Filter Formula:', formula);

    const records = await base!(TABLES.QUESTIONS)
      .select({
        filterByFormula: formula,
      })
      .all();

    console.log('조회된 문제 수:', records.length);
    if (records.length > 0) {
      console.log('첫 번째 문제:', records[0].fields);
    } else {
      // 필터 없이 모든 문제 조회해서 디버깅
      const allRecords = await base!(TABLES.QUESTIONS).select().all();
      console.log('전체 문제 수:', allRecords.length);
      if (allRecords.length > 0) {
        console.log('첫 번째 문제 (필터 없음):', allRecords[0].fields);
      }
    }

    return records.map((record) => ({
      id: record.id,
      fields: record.fields as unknown as Question,
      createdTime: record._rawJson.createdTime,
    }));
  } catch (error) {
    console.error('문제 조회 오류:', error);
    throw new Error('문제를 불러올 수 없습니다.');
  }
}

/**
 * 특정 챕터에서 랜덤으로 N개의 문제 선택
 */
export async function getRandomQuestions(
  chapterId: string,
  count: number
): Promise<AirtableRecord<Question>[]> {
  const allQuestions = await getQuestionsByChapter(chapterId);

  // Fisher-Yates 셔플 알고리즘으로 랜덤 선택
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 특정 문제 가져오기
 */
export async function getQuestionById(
  questionId: string
): Promise<AirtableRecord<Question> | null> {
  try {
    const record = await base!(TABLES.QUESTIONS).find(questionId);

    return {
      id: record.id,
      fields: record.fields as unknown as Question,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('문제 조회 오류:', error);
    return null;
  }
}

/**
 * 여러 문제를 한 번에 가져오기
 */
export async function getQuestionsByIds(
  questionIds: string[]
): Promise<Record<string, AirtableRecord<Question>>> {
  const result: Record<string, AirtableRecord<Question>> = {};
  if (!questionIds.length) {
    return result;
  }

  const chunkSize = 50;
  const chunks: string[][] = [];
  for (let i = 0; i < questionIds.length; i += chunkSize) {
    chunks.push(questionIds.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const formula = `OR(${chunk
      .map((id) => `RECORD_ID() = '${id}'`)
      .join(',')})`;

    const records = await base!(TABLES.QUESTIONS)
      .select({ filterByFormula: formula })
      .all();

    records.forEach((record) => {
      result[record.id] = {
        id: record.id,
        fields: record.fields as unknown as Question,
        createdTime: record._rawJson.createdTime,
      };
    });
  }

  return result;
}

/**
 * 문제 통계 업데이트
 */
export async function updateQuestionStats(
  questionId: string,
  isCorrect: boolean,
  cachedQuestion?: AirtableRecord<Question> | null
): Promise<void> {
  try {
    const question = cachedQuestion || (await getQuestionById(questionId));
    if (!question) return;

    const totalAttempts = (question.fields.Total_Attempts || 0) + 1;
    const correctCount = isCorrect
      ? (question.fields.Correct_Count || 0) + 1
      : question.fields.Correct_Count || 0;
    const incorrectCount = !isCorrect
      ? (question.fields.Incorrect_Count || 0) + 1
      : question.fields.Incorrect_Count || 0;

    await base!(TABLES.QUESTIONS).update(questionId, {
      Total_Attempts: totalAttempts,
      Correct_Count: correctCount,
      Incorrect_Count: incorrectCount,
    } as any);
  } catch (error) {
    console.error('문제 통계 업데이트 오류:', error);
  }
}

/**
 * 모든 문제의 통계 가져오기 (관리자용)
 */
export async function getAllQuestionsStats(): Promise<AirtableRecord<Question>[]> {
  try {
    const records = await base!(TABLES.QUESTIONS)
      .select({
        filterByFormula: "{Status} = 'Active'",
        sort: [{ field: 'Total_Attempts', direction: 'desc' }],
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      fields: record.fields as unknown as Question,
      createdTime: record._rawJson.createdTime,
    }));
  } catch (error) {
    console.error('문제 통계 조회 오류:', error);
    throw new Error('문제 통계를 불러올 수 없습니다.');
  }
}
