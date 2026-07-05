import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { YTPlayer, type YouTubePlayer } from "@/components/YTPlayer";

export const Route = createFileRoute("/video/$id")({
  head: ({ params }) => {
    const v = getVideo(params.id);
    return {
      meta: [
        { title: v ? `${v.title} — Shadowly` : "Video — Shadowly" },
        { name: "description", content: v ? `Shadow "${v.title}" from ${v.channel}.` : "Practice English shadowing." },
      ],
    };
  },
  component: VideoScreen,
  notFoundComponent: () => <div className="p-8">Video not found</div>,
});

function VideoScreen() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const video = getVideo(id);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const sentenceRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const t = setInterval(async () => {
      const p = playerRef.current;
      if (p && typeof p.getCurrentTime === "function") {
        try {
          const time = await p.getCurrentTime();
          if (typeof time === "number") setCurrentTime(time);
        } catch {}
      }
    }, 250);
    return () => clearInterval(t);
  }, []);

  if (!video) return null;

  const activeIdx = video.transcript.findIndex(
    (l) => currentTime >= l.start && currentTime < l.end,
  );

  useEffect(() => {
    if (activeIdx >= 0) {
      sentenceRefs.current[activeIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIdx]);

  const seekTo = (t: number) => {
    playerRef.current?.seekTo(t, true);
    playerRef.current?.playVideo();
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-3">
          <Link
            to="/"
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">
              {video.title}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{video.channel}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl">
        <div className="aspect-video w-full bg-black">
          <YouTube
            videoId={video.youtubeId}
            className="h-full w-full"
            iframeClassName="h-full w-full"
            opts={{
              width: "100%",
              height: "100%",
              playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
            }}
            onReady={(e) => {
              playerRef.current = e.target;
            }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Transcript</h2>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Tap a line to jump
          </span>
        </div>
        <ol className="space-y-1">
          {video.transcript.map((line, i) => {
            const active = i === activeIdx;
            return (
              <li key={i}>
                <button
                  ref={(el) => {
                    sentenceRefs.current[i] = el;
                  }}
                  onClick={() => seekTo(line.start)}
                  onDoubleClick={() =>
                    navigate({
                      to: "/practice/$id/$idx",
                      params: { id: video.id, idx: String(i) },
                    })
                  }
                  className={
                    "w-full text-left px-4 py-3 rounded-xl text-[15px] leading-relaxed transition-colors " +
                    (active
                      ? "bg-primary-soft text-foreground font-medium ring-1 ring-primary/30"
                      : "text-foreground hover:bg-secondary")
                  }
                >
                  <span className="mr-2 text-[11px] font-mono text-muted-foreground">
                    {formatTime(line.start)}
                  </span>
                  {line.text}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Link
            to="/practice/$id/$idx"
            params={{ id: video.id, idx: String(Math.max(0, activeIdx)) }}
            className="block w-full text-center rounded-full bg-primary text-primary-foreground font-bold py-4 shadow-lg shadow-primary/30 active:scale-[.99] transition-transform"
          >
            Start Shadowing
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
