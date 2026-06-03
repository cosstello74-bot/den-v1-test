"use client";

import { useEffect, useRef } from "react";
import {
  initScrollTracking,
  trackSectionEnter,
  trackSectionExit,
  trackComparisonTableView,
  trackFaqInteraction,
  trackQuizConversion,
  flushGeoSignal,
} from "@/lib/geo/geoSignals";

export type GeoTrackerHandle = {
  onComparisonView: () => void;
  onFaqClick:       () => void;
  onQuizClick:      () => void;
};

export function useGeoTracker(category: string): GeoTrackerHandle {
  const flushed = useRef(false);

  useEffect(() => {
    const cleanup = initScrollTracking(category);
    trackSectionEnter("summary");

    const handleBeforeUnload = () => {
      if (!flushed.current) {
        flushed.current = true;
        void flushGeoSignal();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Flush after 30s dwell regardless
    const timer = setTimeout(() => {
      if (!flushed.current) {
        flushed.current = true;
        void flushGeoSignal();
      }
    }, 30_000);

    return () => {
      cleanup();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimeout(timer);
      trackSectionExit("summary");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    onComparisonView: () => trackComparisonTableView(category),
    onFaqClick:       () => trackFaqInteraction(category),
    onQuizClick:      () => {
      trackQuizConversion(category);
      flushed.current = true;
      void flushGeoSignal();
    },
  };
}

// Thin wrapper component — renders nothing, attaches tracking via hook
export default function GeoSignalTracker({ category }: { category: string }) {
  useGeoTracker(category);
  return null;
}
