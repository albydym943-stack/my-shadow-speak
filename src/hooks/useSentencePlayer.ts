import { useCallback, useEffect, useRef, useState } from "react";
import type { YouTubePlayer } from "@/components/YTPlayer";

export const SPEEDS = [1, 0.75, 0.5];

export interface Segment {
  start: number;
  end: number;
  index: number;
}

export interface UseSentencePlayerOptions {
  onPauseAtEnd?: () => void;
}

export function useSentencePlayer(opts: UseSentencePlayerOptions = {}) {
  const [speedIdx, setSpeedIdx] = useState(0);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<Segment | null>(null);
  const stoppingRef = useRef(false);
  const lastPlayerStateRef = useRef<number | null>(null);
  const speedIdxRef = useRef(0);
  const onPauseAtEndRef = useRef(opts.onPauseAtEnd);

  useEffect(() => {
    speedIdxRef.current = speedIdx;
  }, [speedIdx]);

  useEffect(() => {
    onPauseAtEndRef.current = opts.onPauseAtEnd;
  }, [opts.onPauseAtEnd]);

  const clearSegmentTimers = useCallback(() => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pauseAtSentenceEnd = useCallback(
    (endTime: number) => {
      if (stoppingRef.current) return;
      stoppingRef.current = true;
      clearSegmentTimers();
      try {
        const p = playerRef.current;
        p?.pauseVideo();
        p?.seekTo(endTime, true);
      } catch {}
      window.setTimeout(() => {
        stoppingRef.current = false;
      }, 80);
      onPauseAtEndRef.current?.();
    },
    [clearSegmentTimers],
  );

  const startSentenceTracker = useCallback(
    (segment: Segment) => {
      clearSegmentTimers();
      activeSegmentRef.current = segment;
      intervalRef.current = window.setInterval(async () => {
        const active = activeSegmentRef.current;
        const p = playerRef.current;
        if (!active || !p || stoppingRef.current) return;
        try {
          const t = await p.getCurrentTime();
          if (typeof t !== "number") return;
          if (t < active.start - 0.15) {
            p.seekTo(active.start, true);
            return;
          }
          if (t >= active.end) pauseAtSentenceEnd(active.end);
        } catch {}
      }, 40);
    },
    [clearSegmentTimers, pauseAtSentenceEnd],
  );

  const playSegment = useCallback(
    (seg: { start: number; end: number }, index: number) => {
      const p = playerRef.current;
      if (!p) return;
      const segment: Segment = { start: seg.start, end: seg.end, index };
      activeSegmentRef.current = segment;
      stoppingRef.current = false;
      const rate = SPEEDS[speedIdxRef.current];
      try {
        p.setPlaybackRate(rate);
        p.seekTo(seg.start, true);
        p.playVideo();
      } catch {}
      startSentenceTracker(segment);
      const durMs = ((seg.end - seg.start) * 1000) / rate + 800;
      stopTimerRef.current = window.setTimeout(() => pauseAtSentenceEnd(seg.end), durMs);
    },
    [pauseAtSentenceEnd, startSentenceTracker],
  );

  const handlePlayerStateChange = useCallback(
    async (e: { data: number; target: YouTubePlayer }) => {
      const playingState = 1;
      const pausedState = 2;
      const previousState = lastPlayerStateRef.current;
      lastPlayerStateRef.current = e.data;
      if (e.data !== playingState || stoppingRef.current) return;
      const active = activeSegmentRef.current;
      if (!active) return;
      try {
        const t = await e.target.getCurrentTime();
        if (
          previousState === pausedState ||
          typeof t !== "number" ||
          t >= active.end - 0.05 ||
          t < active.start - 0.15
        ) {
          e.target.seekTo(active.start, true);
        }
        e.target.setPlaybackRate(SPEEDS[speedIdxRef.current]);
        e.target.playVideo();
        startSentenceTracker(active);
      } catch {}
    },
    [startSentenceTracker],
  );

  const setSpeed = useCallback((i: number) => {
    setSpeedIdx(i);
    try {
      playerRef.current?.setPlaybackRate(SPEEDS[i]);
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      clearSegmentTimers();
    };
  }, [clearSegmentTimers]);

  return {
    playerRef,
    speedIdx,
    setSpeed,
    playSegment,
    handlePlayerStateChange,
    pauseAtSentenceEnd,
    clearSegmentTimers,
  };
}
