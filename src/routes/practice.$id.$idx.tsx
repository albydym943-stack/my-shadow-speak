import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Mic,
  Square,
  RotateCcw,
  Gauge,
  Volume2,
  Play,
  Pause,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { YTPlayer, type YouTubePlayer } from "@/components/YTPlayer";
import { WordPracticeModal } from "@/components/WordPracticeModal";
import { getVideo } from "@/lib/mock-data";
import { SPEEDS, useSentencePlayer } from "@/hooks/useSentencePlayer";
import { stripWord, useShadowRecording } from "@/hooks/useShadowRecording";

export const Route = createFileRoute("/practice/$id/$idx")({
  head: () => ({ meta: [{ title: "Practice — Shadowly" }] }),
  component: PracticeScreen,
});

function tokenize(text: string): string[] {
  return text.match(/\S+/g) ?? [];
}

function PracticeScreen() {
  const { id, idx } = Route.useParams();
  const navigate = useNavigate();
  const video = getVideo(id);
  const [index, setIndex] = useState(Number(idx) || 0);
  const [showIpa, setShowIpa] = useState(false);
  const [status, setStatus] = useState<string>("Listen…");
  const [wordPractice, setWordPractice] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const line = video?.transcript[index];

  const player = useSentencePlayer({
    onPauseAtEnd: () => setStatus("Now tap the mic and repeat"),
  });

  const recording = useShadowRecording({
    onScore: (_words, r) => setStatus(`${Math.round(r * 100)}% match — review below`),
  });

  const playCurrentSegment = useCallback(() => {
    if (!line) return;
    setStatus("Listen…");
    player.playSegment({ start: line.start, end: line.end }, index);
  }, [line, index, player]);

  const goPrev = () => {
    if (!video) return;
    if (index > 0) setIndex(index - 1);
  };
  const goNext = () => {
    if (!video) return;
    if (index + 1 < video.transcript.length) setIndex(index + 1);
    else setStatus("You finished! 🎉");
  };

  const toggleRecording = () => {
    if (!line) return;
    if (recording.recording) return; // single-tap: auto-stops on silence
    recording.start(line.text);
    setStatus("Listening… speak now");
  };

  // Reset on sentence change and sync URL.
  useEffect(() => {
    recording.reset();
    setStatus("Listen…");
    setAudioPlaying(false);
    const t = window.setTimeout(() => playCurrentSegment(), 250);
    if (video)
      navigate({
        to: "/practice/$id/$idx",
        params: { id: video.id, idx: String(index) },
        replace: true,
      });
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!video || !line) return <div className="p-8">Video not found</div>;

  const tokens = tokenize(line.text);
  const total = video.transcript.length;
  const { result, ratio, audioUrl, error, debugLog, SR } = recording;

  const playMyVoice = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (audioPlaying) {
      el.pause();
      setAudioPlaying(false);
    } else {
      el.play();
      setAudioPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-56">
      {/* TEMPORARY on-screen debug log for mobile testing */}
      <div className="fixed top-16 inset-x-2 z-50 max-h-[120px] overflow-y-auto rounded-lg border border-border bg-secondary/95 text-secondary-foreground p-2 font-mono text-[10px] shadow-lg">
        <div className="font-bold uppercase tracking-wider mb-1 text-[9px] text-muted-foreground">
          DEBUG (temporary)
        </div>
        {debugLog.length === 0 ? (
          <span className="opacity-70">No logs yet.</span>
        ) : (
          debugLog.map((line, i) => <div key={i}>{line}</div>)
        )}
      </div>

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
            {index + 1} / {total}
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
              player.playerRef.current = e.target;
              playCurrentSegment();
            }}
            onStateChange={player.handlePlayerStateChange}
          />
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-2xl w-full px-6 pt-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-xs font-semibold text-foreground mb-5">
            <Volume2 className="h-3 w-3" />
            {status}
          </div>

          {result ? (
            <p className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight">
              {result.map((w, i) => (
                <span key={i} className={w.ok ? "text-primary" : "text-destructive"}>
                  {w.word}
                  {i < result.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-2xl sm:text-3xl font-semibold leading-snug text-foreground tracking-tight flex flex-wrap justify-center gap-x-2 gap-y-3">
              {tokens.map((tok, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWordPractice(stripWord(tok));
                  }}
                  className="px-1 rounded-md transition-colors cursor-pointer hover:bg-primary-soft/60 active:bg-primary-soft"
                >
                  {tok}
                </button>
              ))}
            </p>
          )}

          {showIpa && line.ipa && (
            <p className="mt-6 text-base text-muted-foreground italic font-mono">/{line.ipa}/</p>
          )}
          {error && <p className="mt-6 text-center text-xs text-destructive">{error}</p>}
        </div>

        {(audioUrl || result) && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Review your voice</h3>
              {ratio !== null && (
                <span
                  className={
                    "text-xs font-bold px-2 py-0.5 rounded-full " +
                    (ratio >= 0.7
                      ? "bg-primary-soft text-primary"
                      : "bg-destructive/10 text-destructive")
                  }
                >
                  {Math.round(ratio * 100)}%
                </span>
              )}
            </div>

            {audioUrl && (
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={playMyVoice}
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-md active:scale-95"
                >
                  {audioPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </button>
                <div className="text-xs text-muted-foreground">Listen to your recording</div>
                <audio
                  ref={audioElRef}
                  src={audioUrl}
                  onEnded={() => setAudioPlaying(false)}
                  onPause={() => setAudioPlaying(false)}
                  className="hidden"
                />
              </div>
            )}

            {result && (
              <div>
                <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Missed words
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.filter((w) => !w.ok).length === 0 ? (
                    <span className="text-xs text-primary font-semibold">
                      All words correct 🎉
                    </span>
                  ) : (
                    result
                      .filter((w) => !w.ok)
                      .map((w, i) => (
                        <button
                          key={i}
                          onClick={() => setWordPractice(w.word)}
                          className="rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-semibold hover:bg-destructive/20"
                        >
                          {w.word}
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between gap-2">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="h-12 w-12 rounded-full bg-secondary grid place-items-center disabled:opacity-40"
            aria-label="Previous sentence"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>

          <button
            onClick={() => player.setSpeed((player.speedIdx + 1) % SPEEDS.length)}
            className="flex flex-col items-center gap-0.5 w-14"
          >
            <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center">
              <Gauge className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-[10px] font-bold text-foreground">
              {SPEEDS[player.speedIdx]}x
            </span>
          </button>

          <button
            onClick={toggleRecording}
            className={
              "h-20 w-20 rounded-full grid place-items-center shadow-xl transition-all active:scale-95 " +
              (recording.recording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground shadow-primary/40")
            }
            aria-label={recording.recording ? "Stop recording" : "Start recording"}
          >
            {recording.recording ? (
              <Square className="h-7 w-7 fill-current" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>

          <button
            onClick={playCurrentSegment}
            className="flex flex-col items-center gap-0.5 w-14"
          >
            <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center">
              <RotateCcw className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-[10px] font-bold text-foreground">Replay</span>
          </button>

          <button
            onClick={goNext}
            disabled={index + 1 >= total}
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 shadow-md shadow-primary/30"
            aria-label="Next sentence"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {wordPractice && (
        <WordPracticeModal
          word={wordPractice}
          onClose={() => setWordPractice(null)}
          SR={SR}
        />
      )}
    </div>
  );
}
