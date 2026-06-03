"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { logEvent } from "@/lib/eventLogger";
import { detectSegment } from "@/lib/segment";
import { CATEGORY_META, isValidCategory } from "@/lib/category";
import type {
  Purpose,
  Budget,
  BatteryImportance,
  Portability,
  ScreenPreference,
  BrandPreference,
} from "@/types/product";

type QuizAnswers = {
  purpose?: Purpose;
  budget?: Budget;
  battery_importance?: BatteryImportance;
  portability?: Portability;
  screen_size?: ScreenPreference;
  brand_preference?: BrandPreference;
};

type Step = {
  id: keyof QuizAnswers;
  question: string;
  subtitle: string;
  options: { value: string; label: string; description: string; icon: string }[];
};

const STEPS: Step[] = [
  {
    id: "purpose",
    question: "What will you mainly use it for?",
    subtitle: "This shapes your entire recommendation profile.",
    options: [
      { value: "gaming",     icon: "🎮", label: "Gaming",    description: "High-performance games and streaming" },
      { value: "work",       icon: "💼", label: "Work",       description: "Productivity, docs and video calls" },
      { value: "university", icon: "📚", label: "University", description: "Student work, research and notes" },
      { value: "creative",   icon: "🎨", label: "Creative",   description: "Design, video editing and music" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget?",
    subtitle: "We'll find the best value at your price point.",
    options: [
      { value: "under-500",  icon: "💰", label: "Under £500",    description: "Entry-level, great for everyday tasks" },
      { value: "500-1000",   icon: "💳", label: "£500–£1,000",   description: "Mid-range, solid all-round performance" },
      { value: "1000-1500",  icon: "🏆", label: "£1,000–£1,500", description: "High-end, powerful and refined" },
      { value: "1500+",      icon: "✨", label: "£1,500+",        description: "Premium, absolutely no compromise" },
    ],
  },
  {
    id: "battery_importance",
    question: "How important is battery life?",
    subtitle: "Be honest — do you actually leave your desk?",
    options: [
      { value: "not-important",      icon: "🔌", label: "Not Important",      description: "I'm always near a power outlet" },
      { value: "somewhat-important", icon: "🔋", label: "Somewhat Important", description: "Nice to have but not critical" },
      { value: "very-important",     icon: "⚡", label: "Very Important",     description: "I need all-day battery life" },
    ],
  },
  {
    id: "portability",
    question: "How often will you carry it?",
    subtitle: "Weight and form factor depend heavily on this.",
    options: [
      { value: "desk-use",            icon: "🏠", label: "Mostly Desk Use",     description: "Stays at home or the office" },
      { value: "occasionally-travel", icon: "🚌", label: "Occasionally Travel", description: "Commute a few times a week" },
      { value: "frequently-travel",   icon: "✈️", label: "Frequently Travel",   description: "Always on the move" },
    ],
  },
  {
    id: "screen_size",
    question: "Preferred screen size?",
    subtitle: "Bigger isn't always better — it depends on your use.",
    options: [
      { value: "13-14",         icon: "🤏", label: "13–14 inch",    description: "Compact and lightweight" },
      { value: "15-16",         icon: "💻", label: "15–16 inch",    description: "Balanced size and real estate" },
      { value: "17+",           icon: "🖥", label: "17+ inch",      description: "Maximum screen space" },
      { value: "no-preference", icon: "🎯", label: "No Preference", description: "Open to anything" },
    ],
  },
  {
    id: "brand_preference",
    question: "Any brand preference?",
    subtitle: "If not, we'll ignore brand and optimise purely on value.",
    options: [
      { value: "no-preference", icon: "🌐", label: "No Preference", description: "Show me the best regardless of brand" },
      { value: "Lenovo",        icon: "🔴", label: "Lenovo",         description: "Reliability and value" },
      { value: "ASUS",          icon: "🔵", label: "ASUS",           description: "Innovative designs" },
      { value: "HP",            icon: "🔵", label: "HP",             description: "Versatile work and home" },
      { value: "Dell",          icon: "⚪", label: "Dell",           description: "Premium build quality" },
      { value: "Apple",         icon: "🍎", label: "Apple",          description: "macOS and M-series chips" },
    ],
  },
];

const SEGMENT_LABELS: Record<string, string> = {
  student:      "Student Profile",
  gamer:        "Gamer Profile",
  professional: "Professional Profile",
  creator:      "Creator Profile",
  general:      "General Profile",
};

const SEGMENT_COLORS: Record<string, string> = {
  student:      "bg-emerald-950/80 text-emerald-400 border-emerald-800/50",
  gamer:        "bg-red-950/80 text-red-400 border-red-800/50",
  professional: "bg-blue-950/80 text-blue-400 border-blue-800/50",
  creator:      "bg-violet-950/80 text-violet-400 border-violet-800/50",
  general:      "bg-gray-900 text-gray-400 border-gray-700",
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
    <div className="min-h-screen flex flex-col">

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/40">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
          <span className="text-sm font-semibold text-white">{categoryMeta.label}</span>
        </Link>
        <div className="flex items-center gap-3">
          {detectedSegment && (
            <span
              className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border uppercase ${SEGMENT_COLORS[detectedSegment]}`}
            >
              {SEGMENT_LABELS[detectedSegment]}
            </span>
          )}
          <span className="text-xs text-gray-600 font-mono tabular-nums">
            {step + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="h-[2px] bg-gray-800/80">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500 ease-out"
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
                ? "w-2 h-2 bg-indigo-500 cursor-pointer hover:bg-indigo-400"
                : i === step
                ? "w-3 h-3 bg-white ring-2 ring-white/20"
                : "w-2 h-2 bg-gray-700 cursor-default"
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
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                {current.question}
              </h2>
              <p className="text-sm text-gray-500">{current.subtitle}</p>
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
                        ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/40"
                        : "bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/10"
                      }
                    `}
                  >
                    <span className="text-xl shrink-0">{opt.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm transition-colors ${isChosen ? "text-white" : "text-white group-hover:text-indigo-200"}`}>
                        {opt.label}
                      </p>
                      <p className={`text-xs mt-0.5 transition-colors ${isChosen ? "text-indigo-200" : "text-gray-500"}`}>
                        {opt.description}
                      </p>
                    </div>
                    <span
                      className={`ml-auto shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150 ${
                        isChosen
                          ? "bg-white border-white text-indigo-600"
                          : "border-gray-700 text-transparent"
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
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
                  className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
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
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading quiz…</p>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
