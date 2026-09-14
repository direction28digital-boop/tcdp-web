"use client";

import { useEffect, useState } from "react";

/**
 * Hides its children once a moment has passed, in the visitor's own browser.
 *
 * The server already refuses to render an event that has ended, but these pages are
 * cached and revalidate on a timer, so a visitor can hold HTML that was correct when it
 * was built and is not correct now. This closes that window: the event strip is gone at
 * 8pm to the minute rather than whenever the cache next turns over.
 *
 * It starts visible so the first client render matches the server's, then hides on mount
 * if the moment has already passed. Someone with JavaScript off keeps the cached strip
 * until the page revalidates, which is the same small staleness the rest of the site has.
 */
export function ExpiresAt({
  at,
  children,
}: {
  /** ISO 8601 with an explicit offset. */
  at: string;
  children: React.ReactNode;
}) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const end = Date.parse(at);
    const check = () => setExpired(Date.now() >= end);
    check();
    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, [at]);

  if (expired) return null;
  return <>{children}</>;
}
