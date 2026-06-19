'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AlertCircle, Info, Check } from 'lucide-react';

// YouTube IFrame API 최소 타입 선언 (공식 @types/youtube 없이 수동 정의)
interface YTPlayerEvent {
  data: number;
  target: YTPlayer;
}
interface YTPlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}
interface YTPlayerState {
  PLAYING: number;
  PAUSED: number;
  ENDED: number;
}
interface YTNamespace {
  Player: new (
    container: HTMLElement,
    options: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, number>;
      events: {
        onReady?: (event: { target: YTPlayer }) => void;
        onError?: (event: YTPlayerEvent) => void;
        onStateChange?: (event: YTPlayerEvent) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: YTPlayerState;
}
declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  url: string;
  videoDuration: number;
  requiredPercentage: number;
  initialWatchTime?: number;
  onProgressUpdate: (watchTime: number, percentage: number) => void;
  onComplete: () => void;
}

export default function VideoPlayer({
  url,
  videoDuration,
  requiredPercentage = 60,
  initialWatchTime = 0,
  onProgressUpdate,
  onComplete,
}: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxWatchedTimeRef = useRef(initialWatchTime); // ref로 최신 값 추적

  const [maxWatchedTime, setMaxWatchedTime] = useState(initialWatchTime);
  const [currentTime, setCurrentTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);

  // YouTube URL에서 Video ID 추출
  const getVideoId = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
      return null;
    } catch (e) {
      console.error('Invalid URL:', e);
      return null;
    }
  };

  const videoId = getVideoId(url);

  // 진행률 추적 (useCallback으로 안정적 참조 확보 — useEffect deps 충족)
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) return;

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentSeconds = playerRef.current.getCurrentTime();
        const currentMaxWatchedTime = maxWatchedTimeRef.current;

        // 스킵 방지: 이미 시청한 부분을 초과하면 되돌리기
        if (currentSeconds > currentMaxWatchedTime + 1.5) {
          playerRef.current.seekTo(currentMaxWatchedTime, true);
          return;
        }

        setCurrentTime(currentSeconds);

        // 최대 시청 시간 업데이트
        if (currentSeconds > currentMaxWatchedTime) {
          maxWatchedTimeRef.current = currentSeconds; // ref 업데이트
          setMaxWatchedTime(currentSeconds); // state 업데이트
          const percentage =
            videoDuration > 0 ? (currentSeconds / videoDuration) * 100 : 0;
          onProgressUpdate(currentSeconds, percentage);
        }
      }
    }, 1000);
  }, [videoDuration, onProgressUpdate]);

  // YouTube IFrame API 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 이미 로드되어 있는지 확인
    if (window.YT && window.YT.Player) {
      setApiLoaded(true);
      return;
    }

    // 스크립트 로드
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API 준비 완료 콜백
    window.onYouTubeIframeAPIReady = () => {
      setApiLoaded(true);
    };
  }, []);

  // YouTube Player 초기화
  useEffect(() => {
    if (!apiLoaded || !videoId || !containerRef.current) return;

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => {
            setReady(true);
            setError(null);
          },
          onError: (event: YTPlayerEvent) => {
            console.error('YouTube player error:', event.data);
            setError('영상을 로드할 수 없습니다. URL을 확인해주세요.');
          },
          onStateChange: (event: YTPlayerEvent) => {
            // 재생 중일 때 진행 추적 시작
            if (event.data === window.YT.PlayerState.PLAYING) {
              startProgressTracking();
            } else {
              stopProgressTracking();
            }
          },
        },
      });
    } catch (e) {
      console.error('Failed to create YouTube player:', e);
      setError('YouTube 플레이어를 생성할 수 없습니다.');
    }

    return () => {
      stopProgressTracking();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [apiLoaded, videoId, startProgressTracking, stopProgressTracking]);

  const watchPercentage =
    videoDuration > 0 ? (maxWatchedTime / videoDuration) * 100 : 0;
  const isCompleted = watchPercentage >= requiredPercentage;

  useEffect(() => {
    if (isCompleted && !completed) {
      setCompleted(true);
      onComplete();
    }
  }, [isCompleted, completed, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoId) {
    return (
      <div className="bg-bg-error border border-border-error rounded-lg p-4">
        <p className="text-text-error font-semibold flex items-center gap-2">
          <AlertCircle size={16} aria-hidden="true" />
          유효하지 않은 YouTube URL입니다.
        </p>
        <p className="text-sm text-text-error mt-2">현재 URL: {url}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-bg-error border border-border-error rounded-lg p-4">
          <p className="text-text-error font-semibold flex items-center gap-2">
            <AlertCircle size={16} aria-hidden="true" />
            {error}
          </p>
          <p className="text-sm text-text-error mt-2">
            현재 URL: {url}
          </p>
        </div>
      )}

      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>영상 로딩 중...</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full"></div>
      </div>

      {/* 진행률 표시 */}
      <div className="bg-bg-surface-secondary rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-secondary">
            시청 진행률
          </span>
          <span
            className={`text-sm font-semibold ${
              isCompleted ? 'text-text-success' : 'text-text-brand'
            }`}
          >
            {isCompleted ? (
              <span className="flex items-center gap-1">
                <Check size={14} aria-hidden="true" />
                {Math.round(watchPercentage)}% 완료
              </span>
            ) : (
              <>{Math.round(watchPercentage)}% (필수 {requiredPercentage}%)</>
            )}
          </span>
        </div>

        <div className="w-full bg-bg-surface-tertiary rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? 'bg-[var(--text-success)]' : 'bg-bg-primary'
            }`}
            style={{ width: `${Math.min(watchPercentage, 100)}%` }}
          ></div>
        </div>

        <div className="mt-2 text-xs text-text-tertiary">
          {isCompleted ? (
            <span className="text-text-success font-semibold">
              필수 시청을 완료했습니다
            </span>
          ) : (
            <span>
              최소 {requiredPercentage}% 이상 시청해야 다음으로 넘어갈 수
              있습니다
            </span>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-bg-surface-secondary border border-border-default rounded-lg p-3">
        <p className="text-sm text-text-brand flex items-center gap-2">
          <Info size={14} aria-hidden="true" />
          영상은 1배속으로 재생되며, 이미 시청한 부분까지만 탐색할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
