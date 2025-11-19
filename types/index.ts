// Airtable 레코드 타입
export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

// 챕터 타입
export interface Chapter {
  Name: string;
  Order: number;
  Video_URL: string;
  Video_Duration: number;
  Required_Watch_Percentage?: number;
  Description?: string;
  Questions_Count: number;
  Status: 'Active' | 'Inactive';
}

// 문제 타입
export interface Question {
  Chapter_Category: string[];
  Question_Text: string;
  Question_Image?: Array<{ url: string }>;
  Option_1: string;
  Option_2: string;
  Option_3: string;
  Option_4: string;
  Correct_Answer: '1' | '2' | '3' | '4';
  Explanation?: string;
  Difficulty?: 'Easy' | 'Medium' | 'Hard';
  Total_Attempts?: number;
  Correct_Count?: number;
  Incorrect_Count?: number;
  Status: 'Active' | 'Inactive';
}

// 사용자 타입
export interface User {
  Name: string;
  Phone: string;
  Email?: string;
  Region?: string;
  Application_Reason?: string;
  Status: 'In Progress' | 'Completed' | 'Blocked';
  Session_Token?: string;
  Current_Chapter?: string[];
  Total_Study_Time?: number;
  Created_At?: string;
  Completed_At?: string;
}

// 학습 진행 상황 타입
export interface UserProgress {
  User: string[];
  Chapter: string[];
  Video_Watched: boolean;
  Video_Watch_Time: number;
  Questions_Assigned?: string;
  Questions_Answered?: number;
  All_Correct: boolean;
  Chapter_Completed: boolean;
  Started_At?: string;
}

// 챕터 학습 기록 타입
export interface ChapterHistory {
  User: string[];
  Chapter: string[];
  Attempt_Number: number;
  Start_Time: string;
  End_Time?: string;
  Video_Watch_Time: number;
  Questions_Correct?: number;
  Questions_Total?: number;
  Status: 'In Progress' | 'Completed';
}

// 문제 풀이 기록 타입
export interface QuestionAttempt {
  User: string[];
  Question: string[];
  Chapter: string[];
  User_Answer: '1' | '2' | '3' | '4';
  Attempt_Number: number;
  Time_Spent?: number;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 세션 타입
export interface Session {
  userId: string;
  userName: string;
  userPhone: string;
  sessionToken: string;
}

// 챕터 진행 상태 타입
export interface ChapterProgressState {
  chapterId: string;
  chapterName: string;
  order: number;
  videoWatched: boolean;
  videoWatchPercentage: number;
  questionsCompleted: boolean;
  allCorrect: boolean;
  completed: boolean;
}
