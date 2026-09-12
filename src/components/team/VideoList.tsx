"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getVideoUrl, setPostedUrl } from "@/app/team/dogs/actions";

export type VideoItem = {
  id: string;
  storage_path: string;
  size_bytes: number | null;
  uploaded_at: string;
  uploaderName: string | null;
  posted_url: string | null;
};

function when(iso: string): string {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function megabytes(bytes: number | null): string {
  if (!bytes) return "";
  return `${Math.round(bytes / 1_048_576)}MB`;
}

export function VideoList({
  dogId,
  videos,
}: {
  dogId: string;
  videos: VideoItem[];
}) {
  if (videos.length === 0) {
    return (
      <p className="text-ink-soft">
        No video yet. If you are at the shelter, this is the one thing that
        helps most.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {videos.map((video) => (
        <li key={video.id}>
          <VideoRow dogId={dogId} video={video} />
        </li>
      ))}
    </ul>
  );
}

function VideoRow({ dogId, video }: { dogId: string; video: VideoItem }) {
  const router = useRouter();
  const [url, setUrl] = useState(video.posted_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function open() {
    setError(null);
    // Signed on demand and good for an hour. The bucket is private and stays
    // private: everything meant to be public about these dogs goes out through
    // Facebook, not through a URL somebody could forward.
    const result = await getVideoUrl(video.storage_path);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  function savePosted() {
    setError(null);
    startTransition(async () => {
      const result = await setPostedUrl(video.id, dogId, url);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[0_2px_14px_rgba(17,17,17,0.06)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-display text-sm font-bold text-ink">
          Filmed {when(video.uploaded_at)}
          {video.uploaderName ? ` by ${video.uploaderName}` : ""}
        </p>
        <p className="text-sm text-ink-soft">{megabytes(video.size_bytes)}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={open}
          className="rounded-full border-2 border-ink px-5 py-2 font-display text-xs font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream"
        >
          Watch or download
        </button>
        {video.posted_url ? (
          <a
            href={video.posted_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-sunset underline underline-offset-4"
          >
            See the post
          </a>
        ) : null}
      </div>

      <div className="mt-4">
        <label
          htmlFor={`posted-${video.id}`}
          className="block text-sm font-semibold text-ink"
        >
          Once it is up, paste the link
        </label>
        <p className="text-sm text-ink-soft">
          Keeping the link means we can clear old clips out without losing the
          record that this dog was posted.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <input
            id={`posted-${video.id}`}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.facebook.com/..."
            className="w-full max-w-[420px] rounded-xl border border-line bg-cream px-4 py-2.5 text-ink placeholder:text-ink-soft/50"
          />
          <button
            type="button"
            disabled={pending || url === (video.posted_url ?? "")}
            onClick={savePosted}
            className="rounded-full bg-sunset px-5 py-2.5 font-display text-xs font-bold tracking-wide text-white uppercase hover:bg-sunset-deep disabled:opacity-40"
          >
            {pending ? "Saving" : "Save link"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sunset-deep" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
