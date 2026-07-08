import { Mic, Square, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { translate, definition } from "@/lib/translations";
import { stripWord } from "@/hooks/useShadowRecording";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
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

export interface WordPracticeModalProps {
  word: string;
  onClose: () => void;
  SR: any;
}

export function WordPracticeModal({ word, onClose, SR }: WordPracticeModalProps) {
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

  const meaning = translate(word);
  const def = definition(word);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background p-6 pb-8 shadow-2xl relative animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
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
          <div className="text-4xl font-black text-foreground break-words">{word}</div>
          {meaning && (
            <div dir="rtl" className="mt-2 text-lg font-semibold text-foreground/80">
              {meaning}
            </div>
          )}
          {def && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {def}
            </p>
          )}
          {!meaning && !def && (
            <p className="mt-3 text-xs text-muted-foreground italic">
              No dictionary entry — try the audio and mic below.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => speak(word)}
            className="inline-flex items-center gap-2 rounded-full bg-secondary text-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary-soft transition-colors"
          >
            <Volume2 className="h-4 w-4" /> Listen
          </button>
          <button
            onClick={recording ? stop : start}
            className={
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-md active:scale-95 transition-all " +
              (recording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground shadow-primary/30")
            }
          >
            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {recording ? "Stop" : "Practice"}
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
