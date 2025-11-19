import base, { TABLES, checkAirtableConfig } from './client';
import type { Chapter, AirtableRecord } from '@/types';

/**
 * 활성화된 모든 챕터를 순서대로 가져오기
 */
export async function getActiveChapters(): Promise<AirtableRecord<Chapter>[]> {
  try {
    checkAirtableConfig();
    const records = await base!(TABLES.CHAPTERS)
      .select({
        filterByFormula: "{Status} = 'Active'",
        sort: [{ field: 'Order', direction: 'asc' }],
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      fields: record.fields as unknown as Chapter,
      createdTime: record._rawJson.createdTime,
    }));
  } catch (error) {
    console.error('챕터 목록 조회 오류:', error);
    throw new Error('챕터 목록을 불러올 수 없습니다.');
  }
}

/**
 * 특정 챕터 가져오기
 */
export async function getChapterById(
  chapterId: string
): Promise<AirtableRecord<Chapter> | null> {
  try {
    const record = await base!(TABLES.CHAPTERS).find(chapterId);

    return {
      id: record.id,
      fields: record.fields as unknown as Chapter,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('챕터 조회 오류:', error);
    return null;
  }
}

/**
 * 챕터 생성
 */
export async function createChapter(
  chapterData: Partial<Chapter>
): Promise<AirtableRecord<Chapter>> {
  try {
    const record: any = await base!(TABLES.CHAPTERS).create(chapterData as any);

    return {
      id: record.id,
      fields: record.fields as unknown as Chapter,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('챕터 생성 오류:', error);
    throw new Error('챕터를 생성할 수 없습니다.');
  }
}

/**
 * 챕터 업데이트
 */
export async function updateChapter(
  chapterId: string,
  updates: Partial<Chapter>
): Promise<AirtableRecord<Chapter>> {
  try {
    const record: any = await base!(TABLES.CHAPTERS).update(chapterId, updates as any);

    return {
      id: record.id,
      fields: record.fields as unknown as Chapter,
      createdTime: record._rawJson.createdTime,
    };
  } catch (error) {
    console.error('챕터 업데이트 오류:', error);
    throw new Error('챕터를 업데이트할 수 없습니다.');
  }
}

/**
 * 챕터 삭제
 */
export async function deleteChapter(chapterId: string): Promise<boolean> {
  try {
    await base!(TABLES.CHAPTERS).destroy(chapterId);
    return true;
  } catch (error) {
    console.error('챕터 삭제 오류:', error);
    return false;
  }
}
