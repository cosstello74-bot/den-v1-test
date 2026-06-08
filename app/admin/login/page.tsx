"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router   = useRouter();
  const [pw, setPw]         = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Fetch a fresh CSRF token before submitting
      const csrfRes = await fetch("/api/admin/csrf");
      if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
      const { csrfToken } = await csrfRes.json() as { csrfToken: string };

      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ password: pw }),
      });

      if (res.ok) {
        router.replace("/admin");
      } else if (res.status === 429) {
        setError("Too many attempts. Please wait before trying again.");
        setPw("");
      } else {
        setError("Incorrect password.");
        setPw("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
            D
          </span>
          <span className="font-semibold text-white tracking-tight">DEN</span>
          <span className="text-xs text-gray-600 ml-1">/ Admin</span>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white tracking-tight">Sign in</h1>
            <p className="text-sm text-gray-500">Admin access only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                autoFocus
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600 transition-colors"
                placeholder="Enter admin password"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || pw.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl px-4 py-3 transition-colors duration-150"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
