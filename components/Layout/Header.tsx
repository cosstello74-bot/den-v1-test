import Link from "next/link";

type Props = {
  category?: string;
  showQuizCta?: boolean;
};

export default function Header({ category, showQuizCta = true }: Props) {
  const quizHref = category ? `/quiz?category=${category}` : "/quiz";

  return (
    <nav className="sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80 border-b border-gray-800/40">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            D
          </span>
          <span className="text-sm font-semibold text-white">DEN</span>
          <span className="hidden sm:inline text-[10px] text-gray-600 font-medium">
            Decision Intelligence
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-5">
          <Link href="/laptops" className="hidden sm:block text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Laptops
          </Link>
          <Link href="/phones" className="hidden sm:block text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Phones
          </Link>
          <Link href="/monitors" className="hidden sm:block text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Monitors
          </Link>
          {showQuizCta && (
            <Link
              href={quizHref}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Take the quiz
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
