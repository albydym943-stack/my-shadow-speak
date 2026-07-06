import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mic, Square, RotateCcw, Gauge, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { YTPlayer, type YouTubePlayer } from "@/components/YTPlayer";
import { getVideo } from "@/lib/mock-data";

export const Route = createFileRoute("/practice/$id/$idx")({
  head: () => ({ meta: [{ title: "Practice — Shadowly" }] }),
  component: PracticeScreen,
});

const SPEEDS = [1, 0.75, 0.5];

type WordResult = { word: string; ok: boolean };

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreWords(target: string, heard: string): { words: WordResult[]; ratio: number } {
  const tgt = normalize(target);
  const heardSet = new Set(normalize(heard));
  let ok = 0;
  const words = tgt.map((w) => {
    const good = heardSet.has(w);
    if (good) ok++;
    return { word: w, ok: good };
  });
  return { words, ratio: tgt.length ? ok / tgt.length : 0 };
}

function PracticeScreen() {
  const { id, idx } = Route.useParams();
  const navigate = useNavigate();
  const video = getVideo(id);
  const [index, setIndex] = useState(Number(idx) || 0);
  const [showIpa, setShowIpa] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<WordResult[] | null>(null);
  const [status, setStatus] = useState<string>("Tap replay or record to begin");
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const line = video?.transcript[index];

  const pollRef = useRef<number | null>(null);
  const clearSegmentTimers = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const playSegment = useCallback(
    (startIndex = index) => {
      const v = video;
      const p = playerRef.current;
      if (!v || !p) return;
      const seg = v.transcript[startIndex];
      if (!seg) return;
      clearSegmentTimers();
      p.setPlaybackRate(SPEEDS[speedIdx]);
      p.seekTo(seg.start, true);
      p.playVideo();

      const stopAt = seg.end;
      const doStop = () => {
        clearSegmentTimers();
        try {
          p.pauseVideo();
          // snap back to end to prevent bleed into next line's audio
          p.seekTo(stopAt, true);
        } catch {}
        setStatus("Now tap the mic and repeat");
      };

      // Poll getCurrentTime frequently for a tight cutoff at endTime,
      // independent of playback rate or buffering.
      pollRef.current = window.setInterval(async () => {
        try {
          const t = await p.getCurrentTime();
          if (typeof t === "number" && t >= stopAt) doStop();
        } catch {}
      }, 60);

      // Safety fallback timeout in case polling stalls.
      const durMs = ((seg.end - seg.start) * 1000) / SPEEDS[speedIdx] + 400;
      stopTimerRef.current = window.setTimeout(doStop, durMs);
    },
    [index, speedIdx, video],
  );

  const setSpeed = (i: number) => {
    setSpeedIdx(i);
    playerRef.current?.setPlaybackRate(SPEEDS[i]);
  };

  const SR: any = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }, []);

  const startRecording = () => {
    setError(null);
    setResult(null);
    if (!SR) {
      setError("Speech recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      rec.continuous = false;
      rec.onstart = () => {
        setRecording(true);
        setStatus("Listening…");
      };
      rec.onerror = (e: any) => {
        setRecording(false);
        setError(e?.error === "not-allowed" ? "Microphone access denied." : `Mic error: ${e?.error || "unknown"}`);
      };
      rec.onend = () => setRecording(false);
      rec.onresult = (e: any) => {
        let best = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          for (let j = 0; j < r.length; j++) {
            if (r[j].transcript.length > best.length) best = r[j].transcript;
          }
        }
        if (!line) return;
        const { words, ratio } = scoreWords(line.text, best);
        setResult(words);
        if (ratio >= 0.7) {
          setStatus(`Nice! ${Math.round(ratio * 100)}% match — advancing…`);
          if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
          advanceTimerRef.current = window.setTimeout(() => {
            const next = index + 1;
            if (video && next < video.transcript.length) {
              setIndex(next);
            } else {
              setStatus("You finished! 🎉");
            }
          }, 1000);
        } else {
          setStatus(`${Math.round(ratio * 100)}% match — try again`);
        }
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setError("Could not start speech recognition.");
    }
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setRecording(false);
  };

  // When index changes: reset result and auto-play new segment
  useEffect(() => {
    setResult(null);
    setStatus("Listen…");
    const t = window.setTimeout(() => playSegment(index), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  if (!video || !line) return <div className="p-8">Video not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-56">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
          <Link
            to="/video/$id"
            params={{ id: video.id }}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div className="text-xs font-medium text-muted-foreground">
            {index + 1} / {video.transcript.length}
          </div>
          <button
            onClick={() => setShowIpa((s) => !s)}
            className={
              "text-xs font-bold px-3 py-1.5 rounded-full transition-colors " +
              (showIpa ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")
            }
          >
            IPA
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl w-full">
        <div className="aspect-video w-full bg-black">
          <YTPlayer
            videoId={video.youtubeId}
            className="h-full w-full"
            iframeClassName="h-full w-full"
            opts={{
              width: "100%",
              height: "100%",
              playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1 },
            }}
            onReady={(e: { target: YouTubePlayer }) => {
              playerRef.current = e.target;
              playSegment(index);
            }}
          />
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-2xl w-full px-6 pt-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-xs font-semibold text-foreground mb-6">
            <Volume2 className="h-3 w-3" />
            {status}
          </div>
          {result ? (
            <p className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight">
              {result.map((w, i) => (
                <span
                  key={i}
                  className={w.ok ? "text-primary" : "text-destructive"}
                >
                  {w.word}
                  {i < result.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-2xl sm:text-3xl font-semibold leading-snug text-foreground tracking-tight">
              {line.text}
            </p>
          )}
          {showIpa && line.ipa && (
            <p className="mt-6 text-base text-muted-foreground italic font-mono">/{line.ipa}/</p>
          )}
          {error && <p className="mt-6 text-center text-xs text-destructive">{error}</p>}
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-6 flex items-center justify-between gap-4">
          <button
            onClick={() => setSpeed((speedIdx + 1) % SPEEDS.length)}
            className="flex flex-col items-center gap-1 w-16"
          >
            <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center">
              <Gauge className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-[11px] font-bold text-foreground">{SPEEDS[speedIdx]}x</span>
          </button>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={
              "h-20 w-20 rounded-full grid place-items-center shadow-xl transition-all active:scale-95 " +
              (recording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground shadow-primary/40")
            }
          >
            {recording ? <Square className="h-7 w-7 fill-current" /> : <Mic className="h-8 w-8" />}
          </button>

          <button onClick={() => playSegment(index)} className="flex flex-col items-center gap-1 w-16">
            <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center">
              <RotateCcw className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-[11px] font-bold text-foreground">Replay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
