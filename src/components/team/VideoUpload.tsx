"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createUploadUrl, recordVideo } from "@/app/team/dogs/actions";

type Phase = "idle" | "signing" | "uploading" | "saving" | "done";

/** Matches the bucket. Phones record quicktime; everything else is a share sheet. */
const ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-m4v";
const MAX_BYTES = 200 * 1024 * 1024;

function megabytes(bytes: number): string {
  return `${Math.round(bytes / 1_048_576)}MB`;
}

export function VideoUpload({ dogId }: { dogId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  function reset() {
    setPhase("idle");
    setPercent(0);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function cancel() {
    xhrRef.current?.abort();
    xhrRef.current = null;
    reset();
  }

  async function onPick(file: File) {
    setError(null);
    setFileName(file.name);

    if (file.size > MAX_BYTES) {
      setError(
        `That clip is ${megabytes(file.size)}. The limit is 200MB — trim it first, or film a shorter one.`,
      );
      reset();
      return;
    }

    setPhase("signing");
    const signed = await createUploadUrl(dogId, file.type);
    if ("error" in signed) {
      setError(signed.error);
      reset();
      return;
    }

    setPhase("uploading");
    setPercent(0);

    // A plain PUT to the signed URL rather than the SDK helper, because this is
    // the only way to get real progress events. A volunteer on shelter wifi
    // watching a spinner with no movement assumes it has hung and closes the tab.
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", signed.signedUrl, true);
        xhr.setRequestHeader("content-type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setPercent(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload responded ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network dropped"));
        xhr.onabort = () => reject(new Error("aborted"));
        xhr.send(file);
      });
    } catch (err) {
      xhrRef.current = null;
      if (err instanceof Error && err.message === "aborted") return;
      console.error("[upload]", err);
      setError(
        "The upload did not finish. Shelter wifi is usually the culprit — try again, or step outside and retry.",
      );
      reset();
      return;
    }

    xhrRef.current = null;
    setPhase("saving");
    const saved = await recordVideo(dogId, signed.path, file.size, file.type);
    if (saved?.error) {
      setError(saved.error);
      reset();
      return;
    }

    setPhase("done");
    router.refresh();
    setTimeout(reset, 2500);
  }

  const busy = phase === "signing" || phase === "uploading" || phase === "saving";

  return (
    <div>
      <input
        ref={inputRef}
        id={`video-${dogId}`}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPick(file);
        }}
      />

      {!busy && phase !== "done" ? (
        <label
          htmlFor={`video-${dogId}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-sunset px-6 py-3 font-display text-xs font-bold tracking-wide text-white uppercase hover:bg-sunset-deep focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink"
        >
          Add a video
        </label>
      ) : null}

      {busy ? (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-sm font-bold text-ink">
              {phase === "signing"
                ? "Getting ready"
                : phase === "uploading"
                  ? `Uploading ${percent}%`
                  : "Almost there"}
            </p>
            <p className="truncate text-sm text-ink-soft">{fileName}</p>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-deep"
            role="progressbar"
            aria-valuenow={phase === "uploading" ? percent : undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Upload progress"
          >
            <div
              className="h-full rounded-full bg-sunset transition-[width] duration-200"
              style={{ width: `${phase === "uploading" ? percent : 100}%` }}
            />
          </div>
          {phase === "uploading" ? (
            <button
              type="button"
              onClick={cancel}
              className="mt-3 text-sm font-semibold text-sunset underline underline-offset-4"
            >
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}

      {phase === "done" ? (
        <p className="font-display text-sm font-bold text-sage" role="status">
          Uploaded. Thank you for going.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sunset-deep" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
