import { NextRequest, NextResponse } from 'next/server';
import {
  getQuestionsByIds,
  updateQuestionStats,
} from '@/lib/supabase/questions';
import {
  createQuestionAttempt,
  getChapterAttemptCount,
  createChapterHistory,
  completeChapterHistory,
} from '@/lib/supabase/progress';
import { getUserBySessionToken } from '@/lib/supabase/users';
import type { ApiResponse } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // X-Session-Token 헤더로 사용자를 식별한다. body.userId는 신뢰하지 않는다(IDOR 방어).
  const sessionToken = request.headers.get('X-Session-Token') ?? '';
  const authUser = await getUserBySessionToken(sessionToken);
  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'unauthorized' } as ApiResponse,
      { status: 401 }
    );
  }
  const userId = authUser.id;

  try {
    const body = await request.json();
    const { chapterId, answers } = body;

    if (!chapterId || !answers) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 정보가 누락되었습니다.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const attemptNumber = (await getChapterAttemptCount(userId, chapterId)) + 1;
    const chapterHistory = await createChapterHistory(userId, chapterId, attemptNumber);

    const results = [];
    const incorrectQuestions = [];
    const statUpdateTasks: Promise<void>[] = [];
    const attemptTasks: Promise<void>[] = [];

    const answerEntries = Object.entries(answers);
    const questionMap = await getQuestionsByIds(answerEntries.map(([id]) => id));

    for (const [questionId, userAnswer] of answerEntries) {
      const question = questionMap[questionId];
      if (!question) continue;

      const isCorrect = userAnswer === question.correct_answer;

      results.push({
        questionId,
        userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        question,
      });

      if (!isCorrect) {
        incorrectQuestions.push({
          questionId,
          userAnswer,
          correctAnswer: question.correct_answer,
          questionText: question.question_text,
          explanation: question.explanation,
          options: {
            '1': question.option_1,
            '2': question.option_2,
            '3': question.option_3,
            '4': question.option_4,
          },
        });
      }

      statUpdateTasks.push(updateQuestionStats(questionId, isCorrect, question));
      attemptTasks.push(
        createQuestionAttempt(
          userId,
          questionId,
          chapterId,
          userAnswer as '1' | '2' | '3' | '4',
          attemptNumber
        )
      );
    }

    await Promise.all([...statUpdateTasks, ...attemptTasks]);

    const allCorrect = incorrectQuestions.length === 0;

    const correctCount = results.filter((r) => r.isCorrect).length;
    await completeChapterHistory(
      chapterHistory.id,
      correctCount,
      results.length,
      0
    );

    const resultData = {
      allCorrect,
      correctCount,
      totalCount: results.length,
      incorrectQuestions,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: resultData,
    } as ApiResponse);
  } catch (err: unknown) {
    // 내부 오류는 서버 로그에만 기록하고 클라이언트에는 generic 메시지 반환
    console.error(
      '[POST /api/answer/submit] 답안 제출 실패:',
      err instanceof Error ? err.message : err,
      { userId }
    );
    return NextResponse.json(
      {
        success: false,
        error: '처리 중 오류가 발생했습니다.',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
