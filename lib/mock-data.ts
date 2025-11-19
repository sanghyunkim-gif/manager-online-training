import type { AirtableRecord, Chapter, Question, User } from '@/types';

// Mock 챕터 데이터
export const mockChapters: AirtableRecord<Chapter>[] = [
  {
    id: 'chapter1',
    fields: {
      Name: '매치 진행 기본 규칙',
      Order: 1,
      Video_URL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      Video_Duration: 180, // 3분
      Required_Watch_Percentage: 60,
      Description: `매치를 시작하기 전 반드시 확인해야 할 사항들:

• 참가자 명단 확인 및 출석 체크
• 경기장 안전 점검
• 필요한 장비 준비 (공, 조끼 등)
• 응급처치 키트 확인`,
      Questions_Count: 3,
      Status: 'Active',
    },
    createdTime: new Date().toISOString(),
  },
  {
    id: 'chapter2',
    fields: {
      Name: '팀 구성 및 관리',
      Order: 2,
      Video_URL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      Video_Duration: 150,
      Required_Watch_Percentage: 60,
      Description: `효과적인 팀 구성 방법:

• 실력에 따른 균등 배분
• 포지션별 배치
• 팀워크 고려사항`,
      Questions_Count: 3,
      Status: 'Active',
    },
    createdTime: new Date().toISOString(),
  },
];

// Mock 문제 데이터
export const mockQuestions: AirtableRecord<Question>[] = [
  // 챕터 1 문제
  {
    id: 'q1',
    fields: {
      Chapter_Category: ['chapter1'],
      Question_Text: '매치 시작 전 가장 먼저 해야 할 일은?',
      Option_1: '공기압 확인',
      Option_2: '참가자 명단 확인 및 출석 체크',
      Option_3: '날씨 확인',
      Option_4: '주차 공간 확인',
      Correct_Answer: '2',
      Explanation:
        '매치 시작 전 가장 중요한 것은 참가자 명단을 확인하고 출석을 체크하는 것입니다. 이를 통해 안전하고 원활한 경기 진행이 가능합니다.',
      Status: 'Active',
    },
    createdTime: new Date().toISOString(),
  },
  {
    id: 'q2',
    fields: {
      Chapter_Category: ['chapter1'],
      Question_Text: '매치 중 부상자가 발생했을 때 가장 먼저 해야 할 일은?',
      Option_1: '안전 확인 및 응급 조치',
      Option_2: '경기 중단',
      Option_3: '다른 참가자들에게 알림',
      Option_4: '119에 신고',
      Correct_Answer: '1',
      Explanation:
        '부상자 발생 시 가장 우선은 부상자의 안전을 확인하고 필요시 응급 조치를 하는 것입니다. 경기 중단은 그 다음입니다.',
      Status: 'Active',
    },
    createdTime: new Date().toISOString(),
  },
  {
    id: 'q3',
    fields: {
      Chapter_Category: ['chapter1'],
      Question_Text: '경기 시작 전 점검해야 할 장비가 아닌 것은?',
      Option_1: '축구공',
      Option_2: '조끼',
      Option_3: '응급처치 키트',
      Option_4: '개인 물병',
      Correct_Answer: '4',
      Explanation:
        '개인 물병은 각 참가자가 개별적으로 준비하는 것이며, 매니저가 점검할 필수 장비가 아닙니다.',
      Status: 'Active',
    },
    createdTime: new Date().toISOString(),
  },
  // 챕터 2 문제
  {
    id: 'q4',
    fields: {
      Chapter_Category: ['chapter2'],
      Question_Text: '팀을 구성할 때 가장 중요한 원칙은?',
      Option_1: '친한 사람끼리 묶기',
      Option_2: '실력에 따른 균등 배분',
      Option_3: '빠른 순서대로 배치',
      Option_4: '나이순으로 배치',
      Correct_Answer: '2',
      Explanation:
        '공정하고 재미있는 경기를 위해서는 양 팀의 실력이 균등하게 배분되어야 합니다.',
      Status: 'Active',
    },
    createdTime: new Date().toISOString(),
  },
  {
    id: 'q5',
    fields: {
      Chapter_Category: ['chapter2'],
      Question_Text: '팀 구성 시 고려해야 할 사항이 아닌 것은?',
      Option_1: '포지션별 배치',
      Option_2: '실력 균형',
      Option_3: '개인의 직업',
      Option_4: '팀워크',
      Correct_Answer: '3',
      Explanation: '개인의 직업은 팀 구성과 관련이 없습니다.',
      Status: 'Active',
    },
    createdTime: new Date().toISOString(),
  },
  {
    id: 'q6',
    fields: {
      Chapter_Category: ['chapter2'],
      Question_Text: '팀 배치 후 반드시 확인해야 할 것은?',
      Option_1: '양 팀 인원수',
      Option_2: '조끼 색상',
      Option_3: '경기장 크기',
      Option_4: '날씨',
      Correct_Answer: '1',
      Explanation:
        '팀 배치 후에는 양 팀의 인원수가 동일한지 반드시 확인해야 합니다.',
      Status: 'Active',
    },
    createdTime: new Date().toISOString(),
  },
];

// Mock 사용자 저장소 (메모리)
export const mockUsers: Map<
  string,
  AirtableRecord<User>
> = new Map();

// Mock 진행 상황 저장소
export const mockProgress: Map<string, any> = new Map();

// Mock 챕터 기록 저장소
export const mockChapterHistory: Map<string, any> = new Map();

// 전화번호로 mock 사용자 찾기
export function findMockUserByPhone(phone: string) {
  for (const [id, user] of mockUsers.entries()) {
    if (user.fields.Phone === phone) {
      return user;
    }
  }
  return null;
}

// Mock 사용자 생성
export function createMockUser(name: string, phone: string) {
  const userId = `user_${Date.now()}`;
  const user: AirtableRecord<User> = {
    id: userId,
    fields: {
      Name: name,
      Phone: phone,
      Status: 'In Progress',
      Session_Token: `token_${userId}`,
      Total_Study_Time: 0,
    },
    createdTime: new Date().toISOString(),
  };
  mockUsers.set(userId, user);
  return user;
}

// 챕터별 mock 문제 가져오기
export function getMockQuestionsByChapter(chapterId: string) {
  return mockQuestions.filter((q) =>
    q.fields.Chapter_Category.includes(chapterId)
  );
}
