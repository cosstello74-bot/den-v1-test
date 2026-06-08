import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — DEN",
  description: "How DEN collects, uses, and protects your data.",
};

const LAST_UPDATED = "5 June 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur-sm bg-paper/90 border-b border-ink/10 flex items-center justify-between px-6 py-4">
        <Link href="/" aria-label="DEN home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="DEN" className="h-9 w-auto" />
        </Link>
        <Link href="/" className="text-xs text-muted hover:text-ink transition-colors duration-150">
          ← Home
        </Link>
      </nav>

      <main className="px-6 py-14 max-w-2xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Legal</p>
          <h1 className="text-3xl font-bold tracking-tighter text-ink">Privacy Policy</h1>
          <p className="text-sm text-muted">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Affiliate Disclosure — prominent, required by ASA */}
        <div className="bg-accent/8 border border-accent/25 rounded-xl px-5 py-4 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Affiliate Disclosure</p>
          <p className="text-sm text-ink/80 leading-relaxed">
            DEN earns a commission when you click through to a product and make a purchase via our affiliate links (including Amazon Associates). This does not affect our rankings. Products are ranked by match score against your profile and real purchase outcome data — not by commission rate.
          </p>
        </div>

        <Section title="Who We Are">
          <p>
            DEN is a decision intelligence engine that helps UK consumers find the right electronics and other products. We are operated as a private project and can be contacted at <a href="mailto:hello@askden.co" className="text-accent hover:text-accent-dark transition-colors">hello@askden.co</a>.
          </p>
        </Section>

        <Section title="What Data We Collect">
          <p>We collect the following data when you use DEN:</p>
          <ul className="mt-3 space-y-2 list-none">
            {[
              ["Quiz responses", "Your answers to questions about use case, budget, priorities, and preferences. This data drives your product recommendations."],
              ["Event data", "Which results pages you view, which products you see, and which affiliate links you click. Each event includes a timestamp, session ID, product ID, and category."],
              ["Session identifier", "A randomly generated ID created at the start of your visit. This is stored in your browser's localStorage and is not linked to any account or personal identity."],
              ["Referrer information", "The source that brought you to DEN (e.g. search engine, direct). Used to understand traffic channels."],
              ["Variant assignment", "Which version of a page or feature you are shown during A/B testing. Stored in localStorage."],
            ].map(([title, desc]) => (
              <li key={title as string} className="flex gap-3">
                <span className="text-accent/50 font-mono text-[10px] font-bold pt-0.5 shrink-0">—</span>
                <span><span className="text-ink font-medium">{title}:</span> {desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            We do <strong className="text-ink font-semibold">not</strong> collect names, email addresses, phone numbers, payment details, or any information that directly identifies you. No account is required to use DEN.
          </p>
        </Section>

        <Section title="How We Use Your Data">
          <p>Your data is used to:</p>
          <ul className="mt-3 space-y-2 list-none">
            {[
              "Rank products against your specific profile (use case, budget, preferences)",
              "Personalise results for returning visitors based on previous quiz answers",
              "Improve recommendation quality over time by tracking which products users click through to",
              "Understand which product categories and queries drive the most value",
              "Conduct internal A/B testing to improve the quiz and results experience",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-accent/50 font-mono text-[10px] font-bold pt-0.5 shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Legal Basis (UK GDPR)">
          <p>
            We process your data under <strong className="text-ink font-semibold">legitimate interests</strong> (Article 6(1)(f) UK GDPR). Our legitimate interest is to provide accurate, personalised product recommendations and to improve the quality of those recommendations over time. This processing is proportionate — we collect the minimum data necessary and do not collect personal identifiers.
          </p>
          <p className="mt-3">
            Behavioural profiling (linking quiz answers to product click-through behaviour) is used solely to improve recommendation accuracy for users with similar profiles. It is not used for advertising targeting or sold to third parties.
          </p>
        </Section>

        <Section title="Data Storage and Retention">
          <p>
            <strong className="text-ink font-semibold">Browser (localStorage):</strong> Session IDs and variant assignments are stored in your browser's localStorage. This data persists until you clear your browser storage. It is not transmitted to our servers except as part of event payloads.
          </p>
          <p className="mt-3">
            <strong className="text-ink font-semibold">Server-side:</strong> Event data (page views, quiz completions, affiliate clicks) is stored in our database (Supabase, hosted on AWS EU infrastructure). We retain event data for a maximum of 90 days, after which it is deleted.
          </p>
          <p className="mt-3">
            <strong className="text-ink font-semibold">Third parties:</strong> We do not share your data with third parties except as required to operate the service (our hosting provider, Vercel, and our database provider, Supabase). Both are GDPR-compliant and operate under data processing agreements.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>Under UK GDPR, you have the right to:</p>
          <ul className="mt-3 space-y-2 list-none">
            {[
              ["Access", "Request a copy of the data we hold about your session."],
              ["Erasure", "Request deletion of your event data. Because we store only anonymous session IDs, you will need to provide your session ID (visible in browser localStorage under the key den_session)."],
              ["Objection", "Object to processing under legitimate interests. If you object, we will cease processing your data for that purpose."],
              ["Portability", "Request your data in a machine-readable format."],
            ].map(([right, desc]) => (
              <li key={right as string} className="flex gap-3">
                <span className="text-accent/50 font-mono text-[10px] font-bold pt-0.5 shrink-0">—</span>
                <span><span className="text-ink font-medium">{right}:</span> {desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            To exercise any of these rights, contact us at <a href="mailto:hello@askden.co" className="text-accent hover:text-accent-dark transition-colors">hello@askden.co</a>. We will respond within 30 days. You also have the right to lodge a complaint with the ICO (Information Commissioner's Office) at <span className="text-gray-400">ico.org.uk</span>.
          </p>
        </Section>

        <Section title="Cookies and localStorage">
          <p>
            DEN does not use cookies for tracking or advertising. We use browser localStorage for functional purposes only: storing your session identifier, quiz answers for the duration of your visit, and variant assignments. These are not accessible by third-party scripts.
          </p>
          <p className="mt-3">
            The admin authentication cookie (<code className="text-xs bg-ink/8 px-1.5 py-0.5 rounded text-muted">den_admin_auth</code>) is an httpOnly, secure cookie used solely to authenticate admin access. It expires after 24 hours and is not used for tracking.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this policy as the service evolves. Material changes will be reflected in the "Last updated" date above. Continued use of DEN after a policy update constitutes acceptance of the revised terms.
          </p>
        </Section>

      </main>

      <footer className="px-6 py-6 border-t border-ink/10">
        <div className="max-w-2xl mx-auto text-xs text-muted/50">
          © {new Date().getFullYear()} DEN
        </div>
      </footer>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-ink tracking-tight">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-3 max-w-[65ch]">
        {children}
      </div>
    </section>
  );
}
