import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gray-950 mt-16">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">D</span>
            <span className="text-sm font-semibold text-white">DEN</span>
            <span className="text-[10px] text-gray-600">Decision Intelligence</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <Link href="/laptops"  className="hover:text-gray-400 transition-colors">Laptops</Link>
            <Link href="/phones"   className="hover:text-gray-400 transition-colors">Phones</Link>
            <Link href="/monitors" className="hover:text-gray-400 transition-colors">Monitors</Link>
            <Link href="/quiz"     className="hover:text-gray-400 transition-colors">Quiz</Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[11px] text-gray-700 space-y-1 border-t border-gray-800/40 pt-6">
          <p>
            Rankings are truth-calibrated using real outcome signals and bias-corrected position weighting.
            No product is sponsored or paid to appear higher.
          </p>
          <p>
            DEN participates in affiliate programmes. Clicking "View deal" may generate a commission at no extra
            cost to you. Affiliate relationships do not influence ranking position.
          </p>
          <p className="pt-1 text-gray-800">
            © {new Date().getFullYear()} DEN. All scores are algorithmic estimates — verify specifications
            before purchase.
          </p>
        </div>

      </div>
    </footer>
  );
}
