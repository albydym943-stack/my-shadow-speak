import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";
import type YouTubeType from "react-youtube";

const YouTube = lazy(() => import("react-youtube"));

type Props = ComponentProps<typeof YouTubeType>;

export function YTPlayer(props: Props) {
  if (typeof window === "undefined") {
    return <div className="h-full w-full bg-black" />;
  }
  return (
    <Suspense fallback={<div className="h-full w-full bg-black" />}>
      <YouTube {...props} />
    </Suspense>
  );
}

export type { YouTubePlayer } from "react-youtube";
