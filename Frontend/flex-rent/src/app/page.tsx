import Link from "next/link";
import {
  Zap,
  Wrench,
  Truck,
  Sofa,
  Trophy,
  Tent,
  Music,
  Monitor,
  ChevronRight,
} from "lucide-react";

const steps = [
  {
    title: "Find what you need",
    description: "Search by category or tool name across vendors near you.",
  },
  {
    title: "Reserve your dates",
    description: "Pick your rental period and confirm your booking.",
  },
  {
    title: "Pick up & get to work",
    description: "Meet the vendor, collect your gear, and get the job done.",
  },
];

const categories = [
  { name: "Power Tools", icon: Zap, count: 98 },
  { name: "Tools & Equipment", icon: Wrench, count: 245 },
  { name: "Vehicles", icon: Truck, count: 67 },
  { name: "Furniture", icon: Sofa, count: 156 },
  { name: "Sports & Rec", icon: Trophy, count: 123 },
  { name: "Camping & Hiking", icon: Tent, count: 134 },
  { name: "Audio & Music", icon: Music, count: 78 },
  { name: "Electronics", icon: Monitor, count: 256 },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-surface">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-surface/90 px-6 py-4 backdrop-blur-sm">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-text"
        >
          flexrent
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-chalk transition-colors hover:text-text"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
          >
            Get it
          </Link>
        </nav>
      </header>

      <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
        <div className="motion-safe:opacity-0 motion-safe:animate-[slideUp_0.8s_ease-out_forwards]">
          <p className="font-mono text-[clamp(3rem,10vw,6rem)] font-medium leading-none tracking-tighter text-text">
            1,247
          </p>
          <p className="mt-3 font-display text-xl text-chalk">tools ready.</p>
          <p className="font-display text-xl text-chalk">
            yours for the weekend.
          </p>
        </div>
        <div className="motion-safe:opacity-0 motion-safe:mt-10 motion-safe:animate-[fadeIn_0.6s_ease-out_0.5s_forwards]">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-md bg-accent px-8 py-4 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
          >
            Browse equipment
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-chalk">
            how it works
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                    i === 0
                      ? "border-accent bg-accent/10"
                      : "border-white/10"
                  }`}
                >
                  {i === 0 ? (
                    <span className="text-accent">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  ) : (
                    <span className="font-mono text-sm text-chalk">
                      {i + 1}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-display text-lg font-medium text-text">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-chalk">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-chalk">
            categories
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  href="/signup"
                  className="group flex flex-col items-start gap-2 rounded-md border border-white/5 bg-surface-raised p-4 transition-all hover:border-white/10 hover:bg-white/5"
                >
                  <Icon className="h-5 w-5 text-chalk transition-colors group-hover:text-accent" />
                  <span className="font-display text-sm font-medium text-text">
                    {cat.name}
                  </span>
                  <span className="font-mono text-xs text-chalk">
                    {cat.count} items
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-chalk">
            two sides of flexrent
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-md border border-white/5 bg-surface-raised p-8">
              <h3 className="font-display text-2xl font-medium text-text">
                Need gear?
              </h3>
              <p className="mt-2 text-sm text-chalk">
                Borrow equipment by the day or week. No storage, no maintenance,
                no hassle.
              </p>
              <Link
                href="/signup"
                className="group mt-6 inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-white/5"
              >
                Find equipment
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="rounded-md border border-white/5 bg-surface-raised p-8">
              <h3 className="font-display text-2xl font-medium text-text">
                Have gear?
              </h3>
              <p className="mt-2 text-sm text-chalk">
                Turn idle equipment into income. Set your own rates, schedule,
                and terms.
              </p>
              <Link
                href="/vendor-signup"
                className="group mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
              >
                Start earning
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="font-mono text-xs text-chalk">flexrent — 2026</p>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="font-mono text-xs text-chalk transition-colors hover:text-text"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="font-mono text-xs text-chalk transition-colors hover:text-text"
            >
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
