import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type WordResult = { word: string; ok: boolean };

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function stripWord(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}

export function scoreWords(
  target: string,
  heard: string,
): { words: WordResult[]; ratio: number } {
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

export interface UseShadowRecordingOptions {
  onScore?: (words: WordResult[], ratio: number) => void;
}

export function useShadowRecording(opts: UseShadowRecordingOptions = {}) {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<WordResult[] | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const targetTextRef = useRef<string>("");
  const optsRef = useRef(opts);
  const sessionRef = useRef(0);

  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const SR: any = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }, []);

  const cleanupAll = useCallback(() => {
    try {
      recognitionRef.current?.abort();
    } catch {}
    recognitionRef.current = null;
  }, []);

  const reset = useCallback(() => {
    sessionRef.current++;
    cleanupAll();
    setResult(null);
    setRatio(null);
    setError(null);
    setRecording(false);
  }, [cleanupAll]);

  const start = useCallback(
    (targetText: string) => {
      cleanupAll();
      sessionRef.current++;
      const sessionId = sessionRef.current;

      setError(null);
      setResult(null);
      setRatio(null);
      targetTextRef.current = targetText;
      transcriptRef.current = "";

      if (!SR) {
        setError("Speech recognition is not supported in this browser.");
        return;
      }

      let scored = false;
      const finish = () => {
        if (scored) {
          setRecording(false);
          return;
        }
        if (sessionRef.current !== sessionId) {
          setRecording(false);
          return;
        }
        scored = true;
        const heard = transcriptRef.current;
        const { words, ratio: r } = scoreWords(targetTextRef.current, heard);
        setResult(words);
        setRatio(r);
        optsRef.current.onScore?.(words, r);
        setRecording(false);
      };

      try {
        const rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = true;
        rec.maxAlternatives = 3;
        rec.continuous = false;

        rec.onerror = (e: any) => {
          const kind = e?.error;
          if (kind === "no-speech" || kind === "aborted") return;
          if (kind === "not-allowed" || kind === "service-not-allowed") {
            setError(
              "Speech recognition was blocked by the browser. Please allow microphone access.",
            );
          } else {
            console.warn("SpeechRecognition error", kind);
          }
        };

        rec.onresult = (e: any) => {
          let finalText = "";
          for (let i = 0; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalText += " " + r[0].transcript;
            else if (!finalText) finalText += " " + r[0].transcript;
          }
          const candidate = finalText.trim();
          if (!candidate) return;

          const current = transcriptRef.current || "";
          const lastResult = e.results[e.results.length - 1];
          const isFinal = lastResult?.isFinal;

          if (candidate.length > current.length || (candidate.length === current.length && isFinal)) {
            transcriptRef.current = candidate;
          }
        };

        rec.onend = () => {
          if (recognitionRef.current !== rec) return;
          recognitionRef.current = null;
          finish();
        };

        recognitionRef.current = rec;
        rec.start();
        setRecording(true);
      } catch (err) {
        console.warn("SpeechRecognition failed to start", err);
        setError("Could not start speech recognition.");
      }
    },
    [SR, cleanupAll],
  );

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        try {
          rec.abort();
        } catch {}
      }
    } else {
      setRecording(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return {
    recording,
    result,
    ratio,
    error,
    SR,
    start,
    stop,
    reset,
  };
}
