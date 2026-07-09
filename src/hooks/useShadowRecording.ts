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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<string>("");
  const targetTextRef = useRef<string>("");
  const audioUrlRef = useRef<string | null>(null);
  const optsRef = useRef(opts);
  const onEndTimeoutRef = useRef<number | null>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const SR: any = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }, []);

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  // Fully release every resource. Safe to call multiple times.
  const cleanupAll = useCallback(() => {
    if (onEndTimeoutRef.current) {
      clearTimeout(onEndTimeoutRef.current);
      onEndTimeoutRef.current = null;
    }
    try {
      recognitionRef.current?.abort();
    } catch {}
    recognitionRef.current = null;
    try {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") mr.stop();
    } catch {}
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    sessionRef.current++;
    if (onEndTimeoutRef.current) {
      clearTimeout(onEndTimeoutRef.current);
      onEndTimeoutRef.current = null;
    }
    setResult(null);
    setRatio(null);
    setError(null);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      setAudioUrl(null);
    }
  }, []);

  const start = useCallback(
    async (targetText: string) => {
      // Ensure no leftovers from any previous run.
      cleanupAll();
      sessionRef.current++;
      const sessionId = sessionRef.current;

      setError(null);
      setResult(null);
      setRatio(null);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
        setAudioUrl(null);
      }
      targetTextRef.current = targetText;
      transcriptRef.current = "";

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        console.error(err);
        if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
          setError("Microphone access was blocked. Please allow it in your browser settings.");
        } else if (err?.name === "NotFoundError") {
          setError("No microphone was found on this device.");
        } else {
          setError("Could not access the microphone. Please check your device.");
        }
        return;
      }

      mediaStreamRef.current = stream;

      // Score once, when everything has fully ended.
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
        console.log("[SR DEBUG] finish() heard =", heard);
        const { words, ratio: r } = scoreWords(targetTextRef.current, heard);
        setResult(words);
        setRatio(r);
        optsRef.current.onScore?.(words, r);
        setRecording(false);
      };

      // Stops recognition + recorder together. Cleanup happens in mr.onstop.
      const stopAll = () => {
        try {
          recognitionRef.current?.stop();
        } catch {}
        try {
          recognitionRef.current?.abort();
        } catch {}
        recognitionRef.current = null;
        const mr = mediaRecorderRef.current;
        if (mr && mr.state !== "inactive") {
          try {
            mr.stop();
          } catch {}
        } else {
          // No recorder to fire onstop — release stream + score now.
          mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          finish();
        }
      };

      try {
        chunksRef.current = [];
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunksRef.current.push(ev.data);
        };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          setAudioUrl(url);
          // Full release of mic every time recording ends.
          mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          finish();
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setRecording(true);
      } catch (err) {
        console.error(err);
        cleanupAll();
        setError("Recording is not supported in this browser.");
        return;
      }

      if (!SR) {
        // No speech recognition — user will need to tap stop via… nothing.
        // Without SR we cannot auto-stop; end after a short window.
        return;
      }

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
        console.log("[SR DEBUG] candidate:", candidate, "isFinal:", e.results[e.results.length - 1]?.isFinal, "resultsCount:", e.results.length);
        if (!candidate) return;

          const current = transcriptRef.current || "";
          const lastResult = e.results[e.results.length - 1];
          const isFinal = lastResult?.isFinal;

          if (candidate.length > current.length || (candidate.length === current.length && isFinal)) {
            transcriptRef.current = candidate;
          }
        };

        // Native silence detection: browser fires onend on its own.
        // Do NOT restart — stop the recorder so scoring runs.
        rec.onend = () => {
          console.log("[SR DEBUG] onend fired. transcriptRef.current =", transcriptRef.current);
          if (recognitionRef.current !== rec) return;
          recognitionRef.current = null;
          if (onEndTimeoutRef.current) {
            clearTimeout(onEndTimeoutRef.current);
          }
          onEndTimeoutRef.current = window.setTimeout(() => {
            onEndTimeoutRef.current = null;
            stopAll();
          }, 250);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn("SpeechRecognition failed to start", err);
      }
    },
    [SR, cleanupAll],
  );

  // Manual stop (used only on unmount / sentence change / reset).
  const stop = useCallback(() => {
    if (onEndTimeoutRef.current) {
      clearTimeout(onEndTimeoutRef.current);
      onEndTimeoutRef.current = null;
    }
    try {
      recognitionRef.current?.abort();
    } catch {}
    recognitionRef.current = null;
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch {}
    } else {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      setRecording(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAll();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [cleanupAll]);

  return {
    recording,
    result,
    ratio,
    audioUrl,
    error,
    SR,
    start,
    stop,
    reset,
  };
}
