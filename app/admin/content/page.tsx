'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, HelpCircle, ArrowLeft, RefreshCw, X } from 'lucide-react';
import type { DbChapter, DbQuestion, ApiResponse } from '@/types';
import type { QuestionCreateInput } from '@/lib/supabase/questions';
import { ChapterTable } from '@/components/admin/ChapterTable';
import { QuestionTable } from '@/components/admin/QuestionTable';
import { ChapterFormModal } from '@/components/admin/ChapterFormModal';
import { QuestionFormModal } from '@/components/admin/QuestionFormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

// ────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────

type TabType = 'chapters' | 'questions';

interface ChaptersApiData {
  chapters: DbChapter[];
  questionCounts: Record<string, number>;
}

type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'error'; message: string };

// 챕터 payload 타입 (ChapterFormModal 에서 받아오는 것과 일치)
type ChapterPayload = {
  name: string;
  order: number;
  video_url: string;
  video_duration: number;
  required_watch_percentage: number;
  description: string | null;
  questions_count: number;
  status: 'Active' | 'Inactive';
};

// ────────────────────────────────────────
// 상수
// ────────────────────────────────────────

const CASCADE_CHAPTER_WARNING =
  '이 챕터를 영구 삭제하면 소속된 모든 문제와 전체 학습자의 진행 기록이 함께 삭제됩니다. 복구할 수 없습니다.';

const CASCADE_QUESTION_WARNING =
  '이 문제와 관련된 모든 학습자 시도 기록이 함께 삭제됩니다. 복구할 수 없습니다.';

// ────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────

export default function ContentManagementPage() {
  const router = useRouter();

  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 탭
  const [activeTab, setActiveTab] = useState<TabType>('chapters');

  // 챕터 데이터
  const [chaptersState, setChaptersState] = useState<LoadState<ChaptersApiData>>(
    { status: 'idle' }
  );

  // 문제 데이터
  const [questionsState, setQuestionsState] = useState<LoadState<DbQuestion[]>>(
    { status: 'idle' }
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');

  // 챕터 모달 상태
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<DbChapter | undefined>();

  // 문제 모달 상태
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DbQuestion | undefined>();

  // 삭제 다이얼로그 상태
  type DeleteTarget =
    | { kind: 'chapter-soft'; chapter: DbChapter }
    | { kind: 'chapter-hard'; chapter: DbChapter }
    | { kind: 'question-soft'; question: DbQuestion }
    | { kind: 'question-hard'; question: DbQuestion };

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 인라인 에러 메시지
  const [actionError, setActionError] = useState<string | null>(null);

  // ──────────────────────────────────────
  // 인증 체크
  // ──────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/auth/session');
        const data = (await res.json()) as { authenticated: boolean };
        if (!data.authenticated) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (err) {
        console.error('인증 확인 오류:', err);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  // ──────────────────────────────────────
  // 데이터 로드 함수
  // ──────────────────────────────────────

  const loadChapters = useCallback(async () => {
    setChaptersState({ status: 'loading' });
    try {
      const res = await fetch('/api/admin/chapters');
      const json = (await res.json()) as ApiResponse<ChaptersApiData>;
      if (!json.success || !json.data) {
        setChaptersState({
          status: 'error',
          message: json.error ?? '챕터 목록을 불러올 수 없습니다.',
        });
        return;
      }
      setChaptersState({ status: 'loaded', data: json.data });
    } catch (err) {
      console.error('챕터 로드 오류:', err);
      setChaptersState({ status: 'error', message: '네트워크 오류가 발생했습니다.' });
    }
  }, []);

  const loadQuestions = useCallback(async (chapterId: string) => {
    setQuestionsState({ status: 'loading' });
    try {
      const url = chapterId
        ? `/api/admin/questions?chapterId=${chapterId}`
        : '/api/admin/questions';
      const res = await fetch(url);
      const json = (await res.json()) as ApiResponse<DbQuestion[]>;
      if (!json.success || !json.data) {
        setQuestionsState({
          status: 'error',
          message: json.error ?? '문제 목록을 불러올 수 없습니다.',
        });
        return;
      }
      setQuestionsState({ status: 'loaded', data: json.data });
    } catch (err) {
      console.error('문제 로드 오류:', err);
      setQuestionsState({ status: 'error', message: '네트워크 오류가 발생했습니다.' });
    }
  }, []);

  // ──────────────────────────────────────
  // 인증 후 초기 로드
  // ──────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    loadChapters();
  }, [isAuthenticated, loadChapters]);

  // 탭 전환 시 문제 탭이면 챕터 목록도 필요하므로 로드
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'questions' && chaptersState.status === 'idle') {
      loadChapters();
    }
  }, [activeTab, isAuthenticated, chaptersState.status, loadChapters]);

  // 챕터 선택 변경 시 문제 로드
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'questions') return;
    loadQuestions(selectedChapterId);
  }, [isAuthenticated, activeTab, selectedChapterId, loadQuestions]);

  // ──────────────────────────────────────
  // 챕터 CRUD 핸들러
  // ──────────────────────────────────────

  const handleChapterAdd = () => {
    setEditingChapter(undefined);
    setChapterModalOpen(true);
  };

  const handleChapterEdit = (chapter: DbChapter) => {
    setEditingChapter(chapter);
    setChapterModalOpen(true);
  };

  const handleChapterSubmit = async (payload: ChapterPayload): Promise<void> => {
    setActionError(null);
    try {
      if (editingChapter) {
        const res = await fetch(`/api/admin/chapters/${editingChapter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as ApiResponse<DbChapter>;
        if (!json.success) {
          setActionError(json.error ?? '챕터 수정에 실패했습니다.');
          throw new Error(json.error);
        }
      } else {
        const res = await fetch('/api/admin/chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as ApiResponse<DbChapter>;
        if (!json.success) {
          setActionError(json.error ?? '챕터 추가에 실패했습니다.');
          throw new Error(json.error);
        }
      }
      await loadChapters();
    } catch (err) {
      console.error('챕터 저장 오류:', err);
      throw err;
    }
  };

  const handleChapterSoftDelete = (chapter: DbChapter) => {
    setDeleteTarget({ kind: 'chapter-soft', chapter });
  };

  const handleChapterHardDelete = (chapter: DbChapter) => {
    setDeleteTarget({ kind: 'chapter-hard', chapter });
  };

  // ──────────────────────────────────────
  // 문제 CRUD 핸들러
  // ──────────────────────────────────────

  const handleQuestionAdd = () => {
    setEditingQuestion(undefined);
    setQuestionModalOpen(true);
  };

  const handleQuestionEdit = (question: DbQuestion) => {
    setEditingQuestion(question);
    setQuestionModalOpen(true);
  };

  const handleQuestionSubmit = async (
    payload: QuestionCreateInput
  ): Promise<void> => {
    setActionError(null);
    try {
      if (editingQuestion) {
        const res = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as ApiResponse<DbQuestion>;
        if (!json.success) {
          setActionError(json.error ?? '문제 수정에 실패했습니다.');
          throw new Error(json.error);
        }
      } else {
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as ApiResponse<DbQuestion>;
        if (!json.success) {
          setActionError(json.error ?? '문제 추가에 실패했습니다.');
          throw new Error(json.error);
        }
      }
      await loadQuestions(selectedChapterId);
      // questionCounts 갱신을 위해 챕터도 재조회
      await loadChapters();
    } catch (err) {
      console.error('문제 저장 오류:', err);
      throw err;
    }
  };

  const handleQuestionSoftDelete = (question: DbQuestion) => {
    setDeleteTarget({ kind: 'question-soft', question });
  };

  const handleQuestionHardDelete = (question: DbQuestion) => {
    setDeleteTarget({ kind: 'question-hard', question });
  };

  // ──────────────────────────────────────
  // 삭제 확인 핸들러
  // ──────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      if (deleteTarget.kind === 'chapter-soft') {
        const res = await fetch(
          `/api/admin/chapters/${deleteTarget.chapter.id}`,
          { method: 'DELETE' }
        );
        const json = (await res.json()) as ApiResponse<DbChapter>;
        if (!json.success) {
          setActionError(json.error ?? '챕터 비활성화에 실패했습니다.');
          return;
        }
        await loadChapters();
      } else if (deleteTarget.kind === 'chapter-hard') {
        const res = await fetch(
          `/api/admin/chapters/${deleteTarget.chapter.id}?mode=hard`,
          { method: 'DELETE' }
        );
        const json = (await res.json()) as ApiResponse<unknown>;
        if (!json.success) {
          setActionError(json.error ?? '챕터 영구 삭제에 실패했습니다.');
          return;
        }
        await loadChapters();
      } else if (deleteTarget.kind === 'question-soft') {
        const res = await fetch(
          `/api/admin/questions/${deleteTarget.question.id}`,
          { method: 'DELETE' }
        );
        const json = (await res.json()) as ApiResponse<DbQuestion>;
        if (!json.success) {
          setActionError(json.error ?? '문제 비활성화에 실패했습니다.');
          return;
        }
        await loadQuestions(selectedChapterId);
        await loadChapters();
      } else if (deleteTarget.kind === 'question-hard') {
        const res = await fetch(
          `/api/admin/questions/${deleteTarget.question.id}?mode=hard`,
          { method: 'DELETE' }
        );
        const json = (await res.json()) as ApiResponse<unknown>;
        if (!json.success) {
          setActionError(json.error ?? '문제 영구 삭제에 실패했습니다.');
          return;
        }
        await loadQuestions(selectedChapterId);
        await loadChapters();
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('삭제 오류:', err);
      setActionError('작업 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ──────────────────────────────────────
  // 삭제 다이얼로그 메타
  // ──────────────────────────────────────

  const deleteDialogMeta = deleteTarget
    ? (() => {
        switch (deleteTarget.kind) {
          case 'chapter-soft':
            return {
              title: '챕터 비활성화',
              message: `"${deleteTarget.chapter.name}" 챕터를 비활성화하시겠습니까? 학습자에게 노출되지 않지만 데이터는 보존됩니다.`,
              confirmLabel: '비활성화',
              variant: 'default' as const,
            };
          case 'chapter-hard':
            return {
              title: '챕터 영구 삭제',
              message: CASCADE_CHAPTER_WARNING,
              confirmLabel: '영구 삭제',
              variant: 'danger' as const,
            };
          case 'question-soft':
            return {
              title: '문제 비활성화',
              message: `이 문제를 비활성화하시겠습니까? 학습자에게 노출되지 않지만 데이터는 보존됩니다.`,
              confirmLabel: '비활성화',
              variant: 'default' as const,
            };
          case 'question-hard':
            return {
              title: '문제 영구 삭제',
              message: CASCADE_QUESTION_WARNING,
              confirmLabel: '영구 삭제',
              variant: 'danger' as const,
            };
        }
      })()
    : null;

  // ──────────────────────────────────────
  // 로딩 / 미인증 화면
  // ──────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-surface-secondary">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-bg-surface px-12 py-10">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
          <p className="text-sm font-bold text-text-secondary">
            인증 확인 중...
          </p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // 챕터 선택 옵션 (문제 탭용)
  // ──────────────────────────────────────

  const chapterSelectOptions =
    chaptersState.status === 'loaded'
      ? [
          { value: '', label: '전체 챕터' },
          ...chaptersState.data.chapters.map((c) => ({
            value: c.id,
            label: `${c.order}. ${c.name}`,
          })),
        ]
      : [{ value: '', label: '챕터 로딩 중...' }];

  // ──────────────────────────────────────
  // 렌더
  // ──────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-bg-surface-secondary">
      {/* 헤더 */}
      <header className="border-b border-border-subtle bg-bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PLAB Manager" className="h-8" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                Admin
              </p>
              <h1 className="text-base font-bold text-text-primary">
                콘텐츠 관리
              </h1>
            </div>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)]"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            대시보드로
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 pb-12">
        {/* 인라인 에러 영역 */}
        {actionError && (
          <div
            role="alert"
            className="flex items-center justify-between rounded-lg border border-border-error bg-bg-error px-4 py-3 text-sm font-medium text-text-error"
          >
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              aria-label="오류 닫기"
              className="ml-3 rounded p-0.5 text-text-error hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-error)]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* 콘텐츠 카드 */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface">
          {/* 탭 */}
          <div className="flex gap-1 border-b border-border-subtle px-4 pt-4">
            <button
              onClick={() => setActiveTab('chapters')}
              className={[
                'flex items-center gap-2 rounded-t-md px-4 py-2.5 text-sm font-semibold transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)] focus-visible:ring-offset-1',
                activeTab === 'chapters'
                  ? 'border-b-2 border-border-focused text-text-brand -mb-px bg-bg-surface'
                  : 'text-text-secondary hover:bg-bg-surface-secondary',
              ].join(' ')}
              aria-selected={activeTab === 'chapters'}
              role="tab"
            >
              <BookOpen size={16} aria-hidden="true" />
              챕터 구성
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={[
                'flex items-center gap-2 rounded-t-md px-4 py-2.5 text-sm font-semibold transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)] focus-visible:ring-offset-1',
                activeTab === 'questions'
                  ? 'border-b-2 border-border-focused text-text-brand -mb-px bg-bg-surface'
                  : 'text-text-secondary hover:bg-bg-surface-secondary',
              ].join(' ')}
              aria-selected={activeTab === 'questions'}
              role="tab"
            >
              <HelpCircle size={16} aria-hidden="true" />
              문제 관리
            </button>
          </div>

          {/* 탭 본문 */}
          <div className="p-5">
            {/* ── 챕터 구성 탭 ── */}
            {activeTab === 'chapters' && (
              <section aria-label="챕터 구성">
                {chaptersState.status === 'loading' && (
                  <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
                      <p className="text-sm text-text-secondary">
                        챕터 목록 로딩 중...
                      </p>
                    </div>
                  </div>
                )}

                {chaptersState.status === 'error' && (
                  <div className="flex flex-col items-center gap-4 py-16">
                    <p className="text-sm text-text-error">
                      {chaptersState.message}
                    </p>
                    <Button
                      variant="secondary"
                      leftIcon={<RefreshCw size={15} />}
                      onClick={loadChapters}
                    >
                      다시 시도
                    </Button>
                  </div>
                )}

                {chaptersState.status === 'loaded' && (
                  <ChapterTable
                    chapters={chaptersState.data.chapters}
                    questionCounts={chaptersState.data.questionCounts}
                    onEdit={handleChapterEdit}
                    onDelete={handleChapterSoftDelete}
                    onHardDelete={handleChapterHardDelete}
                    onAdd={handleChapterAdd}
                  />
                )}
              </section>
            )}

            {/* ── 문제 관리 탭 ── */}
            {activeTab === 'questions' && (
              <section aria-label="문제 관리">
                <div className="mb-4 flex flex-wrap items-end gap-4">
                  <div className="w-56">
                    <Select
                      label="챕터 선택"
                      options={chapterSelectOptions}
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      aria-label="문제 조회할 챕터 선택"
                    />
                  </div>
                </div>

                {questionsState.status === 'idle' && (
                  <div className="flex flex-col items-center gap-4 rounded-lg border border-border-subtle bg-bg-surface-secondary py-16 text-center">
                    <p className="text-sm text-text-secondary">
                      위에서 챕터를 선택하거나, 전체 챕터를 선택하면 문제 목록이 표시됩니다.
                    </p>
                  </div>
                )}

                {questionsState.status === 'loading' && (
                  <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-subtle border-t-bg-primary" />
                      <p className="text-sm text-text-secondary">
                        문제 목록 로딩 중...
                      </p>
                    </div>
                  </div>
                )}

                {questionsState.status === 'error' && (
                  <div className="flex flex-col items-center gap-4 py-16">
                    <p className="text-sm text-text-error">
                      {questionsState.message}
                    </p>
                    <Button
                      variant="secondary"
                      leftIcon={<RefreshCw size={15} />}
                      onClick={() => loadQuestions(selectedChapterId)}
                    >
                      다시 시도
                    </Button>
                  </div>
                )}

                {questionsState.status === 'loaded' && (
                  <QuestionTable
                    questions={questionsState.data}
                    onEdit={handleQuestionEdit}
                    onDelete={handleQuestionSoftDelete}
                    onHardDelete={handleQuestionHardDelete}
                    onAdd={handleQuestionAdd}
                  />
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      {/* 챕터 폼 모달 */}
      <ChapterFormModal
        open={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
        chapter={editingChapter}
        activeQuestionCount={
          editingChapter && chaptersState.status === 'loaded'
            ? chaptersState.data.questionCounts[editingChapter.id] ?? 0
            : undefined
        }
        onSubmit={handleChapterSubmit}
      />

      {/* 문제 폼 모달 */}
      {chaptersState.status === 'loaded' && (
        <QuestionFormModal
          open={questionModalOpen}
          onClose={() => setQuestionModalOpen(false)}
          question={editingQuestion}
          chapters={chaptersState.data.chapters}
          defaultChapterId={selectedChapterId || undefined}
          onSubmit={handleQuestionSubmit}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteDialogMeta && (
        <ConfirmDialog
          open={deleteTarget !== null}
          title={deleteDialogMeta.title}
          message={deleteDialogMeta.message}
          confirmLabel={deleteDialogMeta.confirmLabel}
          variant={deleteDialogMeta.variant}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
