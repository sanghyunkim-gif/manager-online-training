import { supabase } from './client';

export interface ChapterStats {
  chapterId: string;
  chapterName: string;
  order: number;
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number;
  avgTime: number;
  avgCorrectRate: number;
  dropoffRate: number;
}

export interface QuestionStats {
  questionId: string;
  questionText: string;
  chapterName: string;
  totalAttempts: number;
  correctCount: number;
  incorrectRate: number;
  answerDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
  };
}

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

export interface RegionStats {
  region: string;
  totalUsers: number;
  completedUsers: number;
  inProgressUsers: number;
  completionRate: number;
  avgStudyTime: number;
  dropoffRate: number;
}

export async function getChapterStats(): Promise<ChapterStats[]> {
  // Get active chapters
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, name, "order"')
    .eq('status', 'Active')
    .order('order', { ascending: true });

  if (chaptersError || !chapters) {
    throw new Error('챕터별 통계를 불러올 수 없습니다.');
  }

  // Get chapter history aggregates grouped by chapter_id
  const { data: historyStats, error: historyError } = await supabase
    .from('chapter_history')
    .select('chapter_id, status, start_time, end_time, questions_correct, questions_total');

  if (historyError) {
    throw new Error('챕터별 통계를 불러올 수 없습니다.');
  }

  // Get progress data for dropoff calculation
  const { data: progressData, error: progressError } = await supabase
    .from('user_progress')
    .select('chapter_id, chapter_completed');

  if (progressError) {
    throw new Error('챕터별 통계를 불러올 수 없습니다.');
  }

  // Build lookup maps
  const historyByChapter = new Map<string, typeof historyStats>();
  for (const h of historyStats) {
    const arr = historyByChapter.get(h.chapter_id) || [];
    arr.push(h);
    historyByChapter.set(h.chapter_id, arr);
  }

  const progressByChapter = new Map<string, typeof progressData>();
  for (const p of progressData) {
    const arr = progressByChapter.get(p.chapter_id) || [];
    arr.push(p);
    progressByChapter.set(p.chapter_id, arr);
  }

  const stats: ChapterStats[] = [];

  for (const chapter of chapters) {
    const histories = historyByChapter.get(chapter.id) || [];
    const completed = histories.filter((h) => h.status === 'Completed');

    // Average time for completed histories
    let avgTime = 0;
    if (completed.length > 0) {
      const totalTime = completed.reduce((sum, h) => {
        if (!h.start_time || !h.end_time) return sum;
        const start = new Date(h.start_time).getTime();
        const end = new Date(h.end_time).getTime();
        return sum + (end - start) / 1000;
      }, 0);
      avgTime = totalTime / completed.length;
    }

    // Average correct rate
    let avgCorrectRate = 0;
    if (completed.length > 0) {
      const totalRate = completed.reduce((sum, h) => {
        const correct = h.questions_correct || 0;
        const total = h.questions_total || 1;
        return sum + (correct / total) * 100;
      }, 0);
      avgCorrectRate = totalRate / completed.length;
    }

    // Dropoff rate
    const progress = progressByChapter.get(chapter.id) || [];
    const progressCount = progress.length;
    const completedProgressCount = progress.filter((p) => p.chapter_completed).length;
    const dropoffRate =
      progressCount > 0
        ? ((progressCount - completedProgressCount) / progressCount) * 100
        : 0;

    stats.push({
      chapterId: chapter.id,
      chapterName: chapter.name,
      order: chapter.order,
      totalAttempts: histories.length,
      completedAttempts: completed.length,
      completionRate:
        histories.length > 0
          ? (completed.length / histories.length) * 100
          : 0,
      avgTime: Math.round(avgTime),
      avgCorrectRate: Math.round(avgCorrectRate * 10) / 10,
      dropoffRate: Math.round(dropoffRate * 10) / 10,
    });
  }

  return stats;
}

export async function getQuestionStats(): Promise<QuestionStats[]> {
  // Get all active questions with their chapter info
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_text, chapter_id, correct_answer, chapters(name)')
    .eq('status', 'Active');

  if (questionsError || !questions) {
    throw new Error('문제별 통계를 불러올 수 없습니다.');
  }

  // Get all question attempts
  const { data: attempts, error: attemptsError } = await supabase
    .from('question_attempts')
    .select('question_id, user_answer');

  if (attemptsError) {
    throw new Error('문제별 통계를 불러올 수 없습니다.');
  }

  // Build attempts lookup map
  const attemptsByQuestion = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const arr = attemptsByQuestion.get(a.question_id) || [];
    arr.push(a);
    attemptsByQuestion.set(a.question_id, arr);
  }

  const stats: QuestionStats[] = [];

  for (const question of questions) {
    const questionAttempts = attemptsByQuestion.get(question.id) || [];

    const correctCount = questionAttempts.filter(
      (a) => a.user_answer === question.correct_answer
    ).length;

    const answerDistribution = { '1': 0, '2': 0, '3': 0, '4': 0 };
    for (const a of questionAttempts) {
      const answer = a.user_answer as '1' | '2' | '3' | '4';
      if (answer in answerDistribution) {
        answerDistribution[answer]++;
      }
    }

    const chapterInfo = question.chapters as unknown as { name: string } | null;

    stats.push({
      questionId: question.id,
      questionText: question.question_text.substring(0, 50) + '...',
      chapterName: chapterInfo?.name || '알 수 없음',
      totalAttempts: questionAttempts.length,
      correctCount,
      incorrectRate:
        questionAttempts.length > 0
          ? ((questionAttempts.length - correctCount) / questionAttempts.length) * 100
          : 0,
      answerDistribution,
    });
  }

  return stats.sort((a, b) => b.incorrectRate - a.incorrectRate);
}

export async function getDropoffAnalysis(): Promise<DropoffAnalysis> {
  // Get user counts using aggregation
  const { count: totalUsers, error: totalError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw new Error('이탈 분석을 불러올 수 없습니다.');
  }

  const { count: completedUsers, error: completedError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Completed');

  if (completedError) {
    throw new Error('이탈 분석을 불러올 수 없습니다.');
  }

  // Get active chapters
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, name, "order"')
    .eq('status', 'Active')
    .order('order', { ascending: true });

  if (chaptersError || !chapters) {
    throw new Error('이탈 분석을 불러올 수 없습니다.');
  }

  // Get incomplete progress per chapter
  const { data: progressData, error: progressError } = await supabase
    .from('user_progress')
    .select('chapter_id, chapter_completed');

  if (progressError) {
    throw new Error('이탈 분석을 불러올 수 없습니다.');
  }

  const progressByChapter = new Map<string, { total: number; dropped: number }>();
  for (const p of progressData) {
    const entry = progressByChapter.get(p.chapter_id) || { total: 0, dropped: 0 };
    entry.total++;
    if (!p.chapter_completed) {
      entry.dropped++;
    }
    progressByChapter.set(p.chapter_id, entry);
  }

  const chapterDropoffs = chapters.map((chapter) => {
    const entry = progressByChapter.get(chapter.id);
    return {
      chapterId: chapter.id,
      chapterName: chapter.name,
      order: chapter.order,
      droppedCount: entry?.dropped || 0,
    };
  });

  chapterDropoffs.sort((a, b) => b.droppedCount - a.droppedCount);

  const total = totalUsers || 0;
  const completed = completedUsers || 0;

  return {
    totalUsers: total,
    completedUsers: completed,
    overallCompletionRate: total > 0 ? (completed / total) * 100 : 0,
    chapterDropoffs,
  };
}

export async function getRegionStats(): Promise<RegionStats[]> {
  // Get all users with region info
  const { data: users, error } = await supabase
    .from('users')
    .select('region, status, total_study_time');

  if (error || !users) {
    throw new Error('지역별 통계를 불러올 수 없습니다.');
  }

  // Group by region
  const regionMap = new Map<
    string,
    { total: number; completed: number; inProgress: number; totalStudyTime: number }
  >();

  for (const user of users) {
    const region = user.region || '미입력';
    const entry = regionMap.get(region) || {
      total: 0,
      completed: 0,
      inProgress: 0,
      totalStudyTime: 0,
    };

    entry.total++;
    if (user.status === 'Completed') entry.completed++;
    if (user.status === 'In Progress') entry.inProgress++;
    entry.totalStudyTime += user.total_study_time || 0;

    regionMap.set(region, entry);
  }

  const stats: RegionStats[] = [];

  for (const [region, entry] of regionMap.entries()) {
    const avgStudyTime =
      entry.total > 0 ? entry.totalStudyTime / entry.total : 0;
    const dropoffRate =
      entry.total > 0
        ? ((entry.total - entry.completed) / entry.total) * 100
        : 0;

    stats.push({
      region,
      totalUsers: entry.total,
      completedUsers: entry.completed,
      inProgressUsers: entry.inProgress,
      completionRate:
        entry.total > 0 ? (entry.completed / entry.total) * 100 : 0,
      avgStudyTime: Math.round(avgStudyTime),
      dropoffRate: Math.round(dropoffRate * 10) / 10,
    });
  }

  return stats.sort((a, b) => b.totalUsers - a.totalUsers);
}
