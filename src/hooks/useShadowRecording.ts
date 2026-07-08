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
  const isRestartingRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const userStoppedRef = useRef(false);
  const audioUrlRef = useRef<string | null>(null);

  const SR: any = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }, []);

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  const cleanupStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  const reset = useCallback(() => {
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
      userStoppedRef.current = false;
      consecutiveErrorsRef.current = 0;
      isRestartingRef.current = false;

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

      try {
        mediaStreamRef.current = stream;
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
          cleanupStream();
          const heard = transcriptRef.current;
          const { words, ratio: r } = scoreWords(targetTextRef.current, heard);
          setResult(words);
          setRatio(r);
          opts.onScore?.(words, r);
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setRecording(true);
      } catch (err) {
        console.error(err);
        cleanupStream();
        setError("Recording is not supported in this browser.");
        return;
      }

      if (!SR) return;
      try {
        const rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = true;
        rec.maxAlternatives = 3;
        rec.continuous = true;

        rec.onerror = (e: any) => {
          const kind = e?.error;
          if (kind === "no-speech" || kind === "aborted") return;
          if (kind === "not-allowed" || kind === "service-not-allowed") {
            consecutiveErrorsRef.current += 1;
            if (consecutiveErrorsRef.current >= 2) {
              setError(
                "Speech recognition was blocked by the browser. Recording continues, but words won't be scored.",
              );
              try {
                rec.abort();
              } catch {}
              recognitionRef.current = null;
            }
            return;
          }
          console.warn("SpeechRecognition error", kind);
        };

        rec.onresult = (e: any) => {
          consecutiveErrorsRef.current = 0;
          let finalText = "";
          for (let i = 0; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalText += " " + r[0].transcript;
          }
          if (finalText.trim()) {
            transcriptRef.current = (transcriptRef.current + " " + finalText).trim();
          }
        };

        rec.onend = () => {
          if (userStoppedRef.current) return;
          if (recognitionRef.current !== rec) return;
          if (mediaRecorderRef.current?.state !== "recording") return;
          if (isRestartingRef.current) return;
          isRestartingRef.current = true;
          window.setTimeout(() => {
            isRestartingRef.current = false;
            if (userStoppedRef.current) return;
            if (recognitionRef.current !== rec) return;
            if (mediaRecorderRef.current?.state !== "recording") return;
            try {
              rec.start();
            } catch (err) {
              console.warn("SpeechRecognition restart failed", err);
            }
          }, 100);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn("SpeechRecognition failed to start", err);
      }
    },
    [SR, cleanupStream, opts],
  );

  const stop = useCallback(() => {
    userStoppedRef.current = true;
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try {
      rec?.stop();
    } catch {}
    try {
      rec?.abort();
    } catch {}
    const mr = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    try {
      if (mr && mr.state !== "inactive") mr.stop();
    } catch {}
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      userStoppedRef.current = true;
      try {
        recognitionRef.current?.abort();
      } catch {}
      recognitionRef.current = null;
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive")
          mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
      cleanupStream();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [cleanupStream]);

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
