"use client";

import { useState } from "react";

export default function PhorestEmbed() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-ink/12 bg-paper-soft"
      style={{ minHeight: 600 }}
    >
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper-soft">
          <div
            className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          <p className="text-xs text-muted">Loading booking calendar…</p>
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
