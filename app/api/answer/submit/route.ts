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
import type { ApiResponse } from '@/types';

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '답안을 제출할 수 없습니다.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
