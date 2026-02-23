import { supabase } from './client';

export interface DbChapter {
  id: string;
  name: string;
  order: number;
  video_url: string;
  video_duration: number;
  required_watch_percentage: number;
  description: string | null;
  questions_count: number;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export async function getActiveChapters(): Promise<DbChapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('status', 'Active')
    .order('order', { ascending: true });

  if (error) {
    throw new Error('챕터 목록을 불러올 수 없습니다.');
  }

  return data;
}

export async function getChapterById(chapterId: string): Promise<DbChapter | null> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function createChapter(
  chapterData: Partial<Omit<DbChapter, 'id' | 'created_at' | 'updated_at'>>
): Promise<DbChapter> {
  const { data, error } = await supabase
    .from('chapters')
    .insert(chapterData)
    .select()
    .single();

  if (error) {
    throw new Error('챕터를 생성할 수 없습니다.');
  }

  return data;
}

export async function updateChapter(
  chapterId: string,
  updates: Partial<Omit<DbChapter, 'id' | 'created_at' | 'updated_at'>>
): Promise<DbChapter> {
  const { data, error } = await supabase
    .from('chapters')
    .update(updates)
    .eq('id', chapterId)
    .select()
    .single();

  if (error) {
    throw new Error('챕터를 업데이트할 수 없습니다.');
  }

  return data;
}

export async function deleteChapter(chapterId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId);

  if (error) {
    return false;
  }

  return true;
}
