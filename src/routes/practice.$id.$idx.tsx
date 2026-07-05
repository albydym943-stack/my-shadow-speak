import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mic, Square, Play, RotateCcw, Gauge, Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubePlayer } from "react-youtube";
import { getVideo } from "@/lib/mock-data";

export const Route = createFileRoute("/practice/$id/$idx")({
  head: () => ({ meta: [{ title: "Practice — Shadowly" }] }),
  component: PracticeScreen,
});

const SPEEDS = [1, 0.75, 0.5];

function PracticeScreen() {
  const { id, idx } = Route.useParams();
  const video = getVideo(id);
  const [index, setIndex] = useState(Number(idx) || 0);
  const [showIpa, setShowIpa] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const stopTimerRef = useRef<number | null>(null);

  if (!video) return <div className="p-8">Video not found</div>;

  const line = video.transcript[index];

  const setSpeed = (i: number) => {
    setSpeedIdx(i);
    playerRef.current?.setPlaybackRate(SPEEDS[i]);
  };

  const replaySegment = () => {
    const p = playerRef.current;
    if (!p) return;
    p.setPlaybackRate(SPEEDS[speedIdx]);
    p.seekTo(line.start, true);
    p.playVideo();
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    const duration = (line.end - line.start) * 1000 / SPEEDS[speedIdx];
    stopTimerRef.current = window.setTimeout(() => {
      p.pauseVideo();
    }, duration);
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      setError("Microphone access denied. Please allow mic permissions.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const playRecording = () => {
    if (!recordedUrl) return;
    new Audio(recordedUrl).play();
  };

  useEffect(() => {
    setRecordedUrl(null);
  }, [index]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    };
  }, []);

  const canPrev = index > 0;
  const canNext = index < video.transcript.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
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
              (showIpa
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground")
            }
          >
            IPA
          </button>
        </div>
      </header>

      {/* Hidden YouTube player used for segment replay */}
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden>
        <YouTube
          videoId={video.youtubeId}
          opts={{
            width: "1",
            height: "1",
            playerVars: { playsinline: 1, controls: 0 },
          }}
          onReady={(e) => {
            playerRef.current = e.target;
          }}
        />
      </div>

      <main className="flex-1 mx-auto max-w-2xl w-full px-6 flex flex-col justify-center pb-52">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-xs font-semibold text-foreground mb-8">
            <Volume2 className="h-3 w-3" />
            Listen & repeat
          </div>
          <p className="text-2xl sm:text-3xl font-semibold leading-snug text-foreground tracking-tight">
            {line.text}
          </p>
          {showIpa && line.ipa && (
            <p className="mt-6 text-base text-muted-foreground italic font-mono">
              /{line.ipa}/
            </p>
          )}
        </div>

        {recordedUrl && (
          <div className="mt-10 mx-auto flex items-center gap-3 rounded-full bg-secondary px-4 py-2">
            <button
              onClick={playRecording}
              className="h-8 w-8 rounded-full bg-primary grid place-items-center text-primary-foreground"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
            </button>
            <span className="text-xs font-medium text-foreground">Your recording</span>
          </div>
        )}

        {error && (
          <p className="mt-6 text-center text-xs text-destructive">{error}</p>
        )}
      </main>

      {/* Sentence nav */}
      <div className="fixed bottom-44 inset-x-0 flex justify-center gap-2 px-4 pointer-events-none">
        <button
          disabled={!canPrev}
          onClick={() => canPrev && setIndex(index - 1)}
          className="pointer-events-auto h-10 w-10 rounded-full bg-background border border-border grid place-items-center disabled:opacity-30 shadow-sm"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <button
          disabled={!canNext}
          onClick={() => canNext && setIndex(index + 1)}
          className="pointer-events-auto h-10 w-10 rounded-full bg-background border border-border grid place-items-center disabled:opacity-30 shadow-sm"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      </div>

      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-6 flex items-center justify-between gap-4">
          <button
            onClick={() => setSpeed((speedIdx + 1) % SPEEDS.length)}
            className="flex flex-col items-center gap-1 w-16"
          >
            <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center">
              <Gauge className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-[11px] font-bold text-foreground">
              {SPEEDS[speedIdx]}x
            </span>
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
            {recording ? (
              <Square className="h-7 w-7 fill-current" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>

          <button
            onClick={replaySegment}
            className="flex flex-col items-center gap-1 w-16"
          >
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
