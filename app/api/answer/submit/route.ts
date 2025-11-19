import { NextRequest, NextResponse } from 'next/server';
import { getQuestionById, updateQuestionStats } from '@/lib/airtable/questions';
import {
  createQuestionAttempt,
  getChapterAttemptCount,
  createChapterHistory,
  completeChapterHistory,
} from '@/lib/airtable/progress';
import { mockQuestions } from '@/lib/mock-data';
import type { ApiResponse } from '@/types';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chapterId, answers } = body;

    if (!userId || !chapterId || !answers) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 정보가 누락되었습니다.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 시도 횟수 조회 (Chapter_History와 Question_Attempts에 공통 사용)
    let attemptNumber = 1;
    let chapterHistory = null;

    if (!USE_MOCK) {
      attemptNumber = (await getChapterAttemptCount(userId, chapterId)) + 1;

      // Chapter_History 생성
      console.log('Creating Chapter_History...', { userId, chapterId, attemptNumber });
      chapterHistory = await createChapterHistory(userId, chapterId, attemptNumber);
      console.log('Chapter_History created:', chapterHistory.id);
    }

    // 채점
    const results = [];
    const incorrectQuestions = [];

    for (const [questionId, userAnswer] of Object.entries(answers)) {
      let question;

      if (USE_MOCK) {
        question = mockQuestions.find((q) => q.id === questionId);
      } else {
        question = await getQuestionById(questionId);
      }

      if (!question) continue;

      const isCorrect = userAnswer === question.fields.Correct_Answer;

      results.push({
        questionId,
        userAnswer,
        correctAnswer: question.fields.Correct_Answer,
        isCorrect,
        question: question.fields,
      });

      if (!isCorrect) {
        incorrectQuestions.push({
          questionId,
          userAnswer,
          correctAnswer: question.fields.Correct_Answer,
          questionText: question.fields.Question_Text,
          explanation: question.fields.Explanation,
          options: {
            '1': question.fields.Option_1,
            '2': question.fields.Option_2,
            '3': question.fields.Option_3,
            '4': question.fields.Option_4,
          },
        });
      }

      if (!USE_MOCK) {
        // 문제 통계 업데이트 (실제 Airtable만)
        await updateQuestionStats(questionId, isCorrect);

        // 문제 풀이 기록 생성
        console.log('Creating Question_Attempt...', { userId, questionId, chapterId, attemptNumber });
        await createQuestionAttempt(
          userId,
          questionId,
          chapterId,
          userAnswer as '1' | '2' | '3' | '4',
          attemptNumber
        );
      }
    }

    const allCorrect = incorrectQuestions.length === 0;

    // Chapter_History 완료 처리
    if (!USE_MOCK && chapterHistory) {
      const correctCount = results.filter((r) => r.isCorrect).length;
      console.log('Completing Chapter_History...', {
        historyId: chapterHistory.id,
        correctCount,
        totalCount: results.length
      });
      await completeChapterHistory(
        chapterHistory.id,
        correctCount,
        results.length,
        0 // videoWatchTime - 나중에 추가 가능
      );
    }

    // 결과 데이터
    const resultData = {
      allCorrect,
      correctCount: results.filter((r) => r.isCorrect).length,
      totalCount: results.length,
      incorrectQuestions,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: resultData,
    } as ApiResponse);
  } catch (error: any) {
    console.error('답안 제출 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || '답안을 제출할 수 없습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
