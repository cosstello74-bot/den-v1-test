"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "den_privacy_dismissed";

export default function PrivacyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="flex items-center justify-between gap-4 bg-ink border border-ink-soft rounded-xl px-4 py-3 shadow-lg">
          <p className="text-xs text-paper/70 leading-relaxed">
            DEN uses session data to personalise your recommendations. No account required.{" "}
            <Link href="/privacy" className="text-accent hover:text-[#c9897c] transition-colors underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>
          <button
            onClick={dismiss}
            aria-label="Dismiss privacy notice"
            className="shrink-0 text-xs font-semibold text-paper/60 hover:text-paper transition-colors px-3 py-1.5 rounded-lg border border-paper/20 hover:border-paper/40"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
