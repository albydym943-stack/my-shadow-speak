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
  X,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { YTPlayer, type YouTubePlayer } from "@/components/YTPlayer";
import { getVideo } from "@/lib/mock-data";
import { translate } from "@/lib/translations";

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

function stripWord(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
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

function tokenize(text: string): string[] {
  return text.match(/\S+/g) ?? [];
}

function speak(text: string, rate = 0.9) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    s.speak(u);
  } catch {}
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
  const [status, setStatus] = useState<string>("Listen…");
  const [error, setError] = useState<string | null>(null);
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const [wordPractice, setWordPractice] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<{ start: number; end: number; index: number } | null>(null);
  const stoppingRef = useRef(false);
  const lastPlayerStateRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<string>("");

  const line = video?.transcript[index];

  const clearSegmentTimers = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pauseAtSentenceEnd = useCallback((endTime: number) => {
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
    setStatus("Now tap the mic and repeat");
  }, []);

  const startSentenceTracker = useCallback(
    (segment: { start: number; end: number; index: number }) => {
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
    [pauseAtSentenceEnd],
  );

  const playSegment = useCallback(
    (startIndex = index) => {
      const v = video;
      const p = playerRef.current;
      if (!v || !p) return;
      const seg = v.transcript[startIndex];
      if (!seg) return;
      const segment = { start: seg.start, end: seg.end, index: startIndex };
      activeSegmentRef.current = segment;
      stoppingRef.current = false;
      try {
        p.setPlaybackRate(SPEEDS[speedIdx]);
        p.seekTo(seg.start, true);
        p.playVideo();
      } catch {}
      setStatus("Listen…");
      startSentenceTracker(segment);
      const durMs = ((seg.end - seg.start) * 1000) / SPEEDS[speedIdx] + 800;
      stopTimerRef.current = window.setTimeout(() => pauseAtSentenceEnd(seg.end), durMs);
    },
    [index, pauseAtSentenceEnd, speedIdx, startSentenceTracker, video],
  );

  const handlePlayerStateChange = useCallback(
    async (e: { data: number; target: YouTubePlayer }) => {
      const playingState = 1;
      const pausedState = 2;
      const previousState = lastPlayerStateRef.current;
      lastPlayerStateRef.current = e.data;
      if (e.data !== playingState || stoppingRef.current) return;
      const active = activeSegmentRef.current ?? (line ? { start: line.start, end: line.end, index } : null);
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
        e.target.setPlaybackRate(SPEEDS[speedIdx]);
        e.target.playVideo();
        setStatus("Listen…");
        startSentenceTracker(active);
      } catch {}
    },
    [index, line, speedIdx, startSentenceTracker],
  );

  const goPrev = () => {
    if (!video) return;
    if (index > 0) setIndex(index - 1);
  };
  const goNext = () => {
    if (!video) return;
    if (index + 1 < video.transcript.length) setIndex(index + 1);
    else setStatus("You finished! 🎉");
  };

  const setSpeed = (i: number) => {
    setSpeedIdx(i);
    try {
      playerRef.current?.setPlaybackRate(SPEEDS[i]);
    } catch {}
  };

  const SR: any = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }, []);

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    setRecording(false);
  };

  const startRecording = async () => {
    setError(null);
    setResult(null);
    setRatio(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (!SR) {
      setError("Speech recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    // Start MediaRecorder for playback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      };
      mr.start();
      mediaRecorderRef.current = mr;
    } catch (err) {
      console.error(err);
      setError("Microphone access denied.");
      return;
    }

    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.continuous = true;
      transcriptRef.current = "";
      rec.onstart = () => {
        setRecording(true);
        setStatus("Recording… tap again to stop");
      };
      rec.onerror = (e: any) => {
        if (e?.error === "no-speech" || e?.error === "aborted") return;
        setError(e?.error === "not-allowed" ? "Microphone access denied." : `Mic error: ${e?.error || "unknown"}`);
      };
      rec.onend = () => {
        // If user hasn't manually stopped, restart to keep listening despite silence.
        if (recognitionRef.current === rec && mediaRecorderRef.current?.state === "recording") {
          try {
            rec.start();
            return;
          } catch {}
        }
      };
      rec.onresult = (e: any) => {
        let finalText = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += " " + r[0].transcript;
        }
        if (finalText.trim()) {
          transcriptRef.current = (transcriptRef.current + " " + finalText).trim();
        }
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setError("Could not start speech recognition.");
    }
  };

  // When MediaRecorder stops, evaluate.
  useEffect(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    const original = mr.onstop;
    mr.onstop = (ev) => {
      if (typeof original === "function") (original as any).call(mr, ev);
      if (!line) return;
      const heard = transcriptRef.current;
      const { words, ratio: r } = scoreWords(line.text, heard);
      setResult(words);
      setRatio(r);
      setStatus(`${Math.round(r * 100)}% match — review below`);
    };
  }, [recording, line]);

  useEffect(() => {
    setResult(null);
    setRatio(null);
    setActiveWord(null);
    setStatus("Listen…");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    const t = window.setTimeout(() => playSegment(index), 250);
    // sync URL param
    if (video) navigate({ to: "/practice/$id/$idx", params: { id: video.id, idx: String(index) }, replace: true });
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (activeWord === null) return;
    const onDown = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-word-token]")) setActiveWord(null);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
    };
  }, [activeWord]);

  useEffect(() => {
    return () => {
      clearSegmentTimers();
      try {
        recognitionRef.current?.abort();
      } catch {}
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!video || !line) return <div className="p-8">Video not found</div>;

  const tokens = tokenize(line.text);
  const total = video.transcript.length;

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
              playerRef.current = e.target;
              playSegment(index);
            }}
            onStateChange={handlePlayerStateChange}
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
              {tokens.map((tok, i) => {
                const meaning = translate(tok);
                const isActive = activeWord === i;
                return (
                  <span key={i} className="relative inline-block" data-word-token>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveWord((cur) => (cur === i ? null : i));
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setWordPractice(stripWord(tok));
                      }}
                      className={
                        "px-1 rounded-md transition-colors cursor-pointer " +
                        (isActive ? "bg-primary-soft text-primary" : "hover:bg-primary-soft/60")
                      }
                    >
                      {tok}
                    </button>
                    {isActive && (
                      <span
                        role="tooltip"
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30 whitespace-nowrap rounded-lg bg-foreground text-background text-xs font-medium px-3 py-2 shadow-lg flex flex-col items-center gap-1.5"
                      >
                        <span dir="rtl">{meaning ?? "— لا توجد ترجمة —"}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWord(null);
                            setWordPractice(stripWord(tok));
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold"
                        >
                          <Sparkles className="h-3 w-3" /> Practice word
                        </button>
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-foreground" />
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
          )}

          {showIpa && line.ipa && (
            <p className="mt-6 text-base text-muted-foreground italic font-mono">/{line.ipa}/</p>
          )}
          {error && <p className="mt-6 text-center text-xs text-destructive">{error}</p>}
        </div>

        {/* Review panel */}
        {(audioUrl || result) && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Review your voice</h3>
              {ratio !== null && (
                <span
                  className={
                    "text-xs font-bold px-2 py-0.5 rounded-full " +
                    (ratio >= 0.7 ? "bg-primary-soft text-primary" : "bg-destructive/10 text-destructive")
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
                  {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
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
                    <span className="text-xs text-primary font-semibold">All words correct 🎉</span>
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

      {/* Bottom controls */}
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
            onClick={() => setSpeed((speedIdx + 1) % SPEEDS.length)}
            className="flex flex-col items-center gap-0.5 w-14"
          >
            <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center">
              <Gauge className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-[10px] font-bold text-foreground">{SPEEDS[speedIdx]}x</span>
          </button>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={
              "h-20 w-20 rounded-full grid place-items-center shadow-xl transition-all active:scale-95 " +
              (recording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground shadow-primary/40")
            }
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? <Square className="h-7 w-7 fill-current" /> : <Mic className="h-8 w-8" />}
          </button>

          <button onClick={() => playSegment(index)} className="flex flex-col items-center gap-0.5 w-14">
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
        <WordPracticeModal word={wordPractice} onClose={() => setWordPractice(null)} SR={SR} />
      )}
    </div>
  );
}

function WordPracticeModal({
  word,
  onClose,
  SR,
}: {
  word: string;
  onClose: () => void;
  SR: any;
}) {
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [heard, setHeard] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {}
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    };
  }, []);

  const start = () => {
    setErr(null);
    setFeedback(null);
    setHeard("");
    if (!SR) {
      setErr("Speech recognition not supported.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.continuous = false;
    rec.onstart = () => setRecording(true);
    rec.onend = () => setRecording(false);
    rec.onerror = (e: any) => {
      setRecording(false);
      if (e?.error !== "no-speech") setErr(e?.error || "mic error");
    };
    rec.onresult = (e: any) => {
      let best = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        for (let j = 0; j < r.length; j++) {
          if (r[j].transcript.length > best.length) best = r[j].transcript;
        }
      }
      setHeard(best);
      const target = stripWord(word);
      const ok = normalize(best).some((w) => w === target);
      setFeedback(ok ? "ok" : "bad");
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {}
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-9 w-9 rounded-full grid place-items-center hover:bg-secondary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-[11px] font-bold uppercase tracking-widest text-primary text-center mb-3">
          Word practice
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground break-words">{word}</div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => speak(word)}
            className="inline-flex items-center gap-2 rounded-full bg-secondary text-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary-soft"
          >
            <Volume2 className="h-4 w-4" /> Native audio
          </button>
          <button
            onClick={recording ? stop : start}
            className={
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-md active:scale-95 " +
              (recording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground")
            }
          >
            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {recording ? "Stop" : "Try it"}
          </button>
        </div>

        {feedback && (
          <div
            className={
              "mt-6 rounded-2xl p-4 text-center " +
              (feedback === "ok"
                ? "bg-primary-soft text-primary"
                : "bg-destructive/10 text-destructive")
            }
          >
            <div className="text-sm font-bold">
              {feedback === "ok" ? "Correct! 🎉" : "Not quite — try again"}
            </div>
            {heard && (
              <div className="mt-1 text-xs opacity-80">
                Heard: <span className="font-semibold">"{heard}"</span>
              </div>
            )}
          </div>
        )}
        {err && <div className="mt-4 text-xs text-destructive text-center">{err}</div>}
      </div>
    </div>
  );
}
