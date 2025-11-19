import Airtable from 'airtable';

// Airtable 클라이언트 초기화 (환경 변수가 없으면 null 반환)
let base: ReturnType<Airtable['base']> | null = null;

if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
  const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
  base = airtable.base(process.env.AIRTABLE_BASE_ID);
}

export function checkAirtableConfig() {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
  }
  if (!process.env.AIRTABLE_BASE_ID) {
    throw new Error('AIRTABLE_BASE_ID 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
  }
  if (!base) {
    throw new Error('Airtable 연결에 실패했습니다.');
  }
}

// 테이블 이름 상수
export const TABLES = {
  CHAPTERS: 'Chapters',
  QUESTIONS: 'Questions',
  USERS: 'Users',
  USER_PROGRESS: 'User_Progress',
  CHAPTER_HISTORY: 'Chapter_History',
  QUESTION_ATTEMPTS: 'Question_Attempts',
} as const;

export default base;
