"use client";

import { useState } from "react";

/**
 * Phorest booking embed — Mikki's Wax Bar
 * Client component: handles iframe loading state.
 */
export default function PhorestEmbed() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-900" style={{ minHeight: 600 }}>

      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full spinner" aria-hidden="true" />
          <p className="text-xs text-gray-600">Loading booking calendar…</p>
        </div>
      )}

      <iframe
        src="https://www.phorest.com/salon/mikkiwaxbar"
        title="Book an appointment at Mikki's Wax Bar"
        allow="payment"
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        style={{ height: 700, border: "none" }}
      />
    </div>
  );
}
