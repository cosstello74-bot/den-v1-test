"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { logEvent } from "@/lib/eventLogger";
import { detectSegment } from "@/lib/segment";
import { CATEGORY_META, isValidCategory } from "@/lib/category";
import { getQuestions } from "@/lib/v3/questionRegistry";
import type { Purpose } from "@/types/product";

type QuizAnswers = Record<string, string>;

const SEGMENT_LABELS: Record<string, string> = {
  student:      "Student Profile",
  gamer:        "Gamer Profile",
  professional: "Professional Profile",
  creator:      "Creator Profile",
  general:      "General Profile",
};

const SEGMENT_COLORS: Record<string, string> = {
  student:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  gamer:        "bg-red-50 text-red-700 border-red-200",
  professional: "bg-blue-50 text-blue-700 border-blue-200",
  creator:      "bg-violet-50 text-violet-700 border-violet-200",
  general:      "bg-ink/5 text-muted border-ink/15",
};

function QuizContent() {
  const router     = useRouter();
  const params     = useSearchParams();
  const rawCat     = params.get("category") ?? "laptops";
  const category   = isValidCategory(rawCat) ? rawCat : "laptops";
  const categoryMeta = CATEGORY_META[category];

  // Map ?intent= param to a purpose value
  const intentParam = params.get("intent") ?? "";
  const INTENT_TO_PURPOSE: Record<string, Purpose> = {
    gaming:   "gaming",
    student:  "university",
    study:    "university",
    uni:      "university",
    work:     "work",
    wfh:      "work",
    coding:   "work",
    budget:   "work",
    creative: "creative",
  };
  const prefillPurpose = INTENT_TO_PURPOSE[intentParam.toLowerCase()] ?? null;

  const STEPS = getQuestions(category);

  const [step, setStep]                         = useState(prefillPurpose ? 1 : 0);
  const [answers, setAnswers]                   = useState<QuizAnswers>(prefillPurpose ? { purpose: prefillPurpose } : {});
  const [selected, setSelected]                 = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning]   = useState(false);

  const detectedSegment = answers.purpose ? detectSegment(answers.purpose) : null;

  useEffect(() => {
    logEvent("quiz_started", category);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(value: string) {
    if (isTransitioning) return;

    setSelected(value);
    setIsTransitioning(true);

    const currentStep = STEPS[step];
    const updated     = { ...answers, [currentStep.id]: value };
    setAnswers(updated);

    logEvent("question_answered", category, {
      metadata: { question: currentStep.id, answer: value },
    });

    setTimeout(() => {
      setSelected(null);
      setIsTransitioning(false);

      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        logEvent("quiz_completed", category, {
          purpose:  updated.purpose,
          budget:   updated.budget,
          metadata: { answers: updated },
        });
        const urlParams = new URLSearchParams(updated as Record<string, string>);
        urlParams.set("category", category);
        router.push(`/results?${urlParams.toString()}`);
      }
    }, 230);
  }

  const current  = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isTwoCol = current.options.length > 3;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper text-ink">

      {/* ── WCAG: announce question changes to screen readers ── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {`Step ${step + 1} of ${STEPS.length}: ${current.question}`}
      </div>

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-xs font-bold text-white">D</span>
          <span className="text-sm font-semibold text-ink">{categoryMeta.label}</span>
        </Link>
        <div className="flex items-center gap-3">
          {detectedSegment && (
            <span
              className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border uppercase ${SEGMENT_COLORS[detectedSegment]}`}
            >
              {SEGMENT_LABELS[detectedSegment]}
            </span>
          )}
          <span className="text-xs text-muted font-mono tabular-nums">
            {step + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="h-[2px] bg-ink/12">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Step dots ──────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => !isTransitioning && i < step && setStep(i)}
            className={`rounded-full transition-all duration-300 ${
              i < step
                ? "w-2 h-2 bg-accent cursor-pointer hover:bg-accent-dark"
                : i === step
                ? "w-3 h-3 bg-ink ring-2 ring-ink/20"
                : "w-2 h-2 bg-ink/20 cursor-default"
            }`}
          />
        ))}
      </div>

      {/* ── Question area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg">

          {/* Question — key forces re-mount + animation on each step change */}
          <div key={step} className="animate-slide-up space-y-8">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold text-accent uppercase tracking-widest">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-ink">
                {current.question}
              </h2>
              <p className="text-sm text-muted">{current.subtitle}</p>
            </div>

            {/* Options */}
            <div className={`grid gap-2.5 ${isTwoCol ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              {current.options.map((opt, i) => {
                const isChosen = selected === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    disabled={isTransitioning}
                    style={{ animationDelay: `${i * 55}ms` }}
                    className={`
                      group flex items-center gap-4 w-full text-left rounded-2xl border px-5 py-4
                      transition-all duration-150 active:scale-[0.98]
                      animate-fade-in
                      ${isChosen
                        ? "bg-accent/10 border-accent/50 ring-1 ring-accent/20"
                        : "bg-paper-soft border-ink/12 hover:bg-[#ddd6c4] hover:border-accent/40"
                      }
                    `}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm transition-colors ${isChosen ? "text-ink" : "text-ink group-hover:text-accent"}`}>
                        {opt.label}
                      </p>
                      <p className={`text-xs mt-0.5 leading-relaxed transition-colors ${isChosen ? "text-accent/80" : "text-muted"}`}>
                        {opt.description}
                      </p>
                    </div>
                    <span
                      className={`ml-auto shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                        isChosen
                          ? "bg-accent border-accent/70"
                          : "border-ink/25"
                      }`}
                    >
                      {isChosen && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Back */}
            {step > 0 && (
              <div className="text-center">
                <button
                  onClick={() => !isTransitioning && setStep((s) => s - 1)}
                  className="text-sm text-muted hover:text-ink transition-colors"
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-paper">
          <p className="text-muted text-sm">Loading quiz…</p>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
