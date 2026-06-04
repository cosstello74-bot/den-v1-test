"use client";

import { useEffect } from "react";

export default function PageTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const start = Date.now();

    const onUnload = () => {
      const dwellTime = (Date.now() - start) / 1000;

      navigator.sendBeacon(
        "/api/v2/track",
        JSON.stringify({
          slug,
          dwellTime,
          bounceRate: dwellTime < 8 ? 1 : 0,
          impressions: 1,
        })
      );
    };

    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [slug]);

  return null;
}
