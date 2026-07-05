import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Play, Clock } from "lucide-react";
import { channels, videos } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shadowly — Practice English by shadowing real videos" },
      { name: "description", content: "Improve your English pronunciation by shadowing YouTube videos with synced transcripts." },
      { property: "og:title", content: "Shadowly — English Shadowing Practice" },
      { property: "og:description", content: "Shadow real YouTube videos with synced transcripts and instant playback." },
    ],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(query.toLowerCase()) ||
    v.channel.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-black">
              S
            </div>
            <span className="font-black text-lg tracking-tight text-foreground">Shadowly</span>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to practice today?"
              className="w-full h-12 pl-11 pr-4 rounded-full border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 mt-6 space-y-8">
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Recommended channels</h2>
            <span className="text-xs text-muted-foreground">Curated</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {channels.map((c) => (
              <button
                key={c.id}
                className="flex flex-col items-center gap-2 snap-start shrink-0"
              >
                <div
                  className="h-16 w-16 rounded-full grid place-items-center text-white font-black text-xs ring-2 ring-background shadow-sm"
                  style={{ backgroundColor: c.color }}
                >
                  {c.avatar}
                </div>
                <span className="text-xs text-foreground font-medium">{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Popular videos</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
          </div>
          <div className="space-y-4">
            {filtered.map((v) => (
              <Link
                key={v.id}
                to="/video/$id"
                params={{ id: v.id }}
                className="block group"
              >
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-secondary">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white font-medium">
                    <Clock className="h-3 w-3" />
                    {v.duration}
                  </div>
                  <div className="absolute top-3 left-3 h-10 w-10 rounded-full bg-primary/95 grid place-items-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-4 w-4 text-primary-foreground fill-current" />
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-primary-soft grid place-items-center text-xs font-black text-primary-foreground">
                    {v.channel.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                      {v.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.channel} · {v.duration}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
