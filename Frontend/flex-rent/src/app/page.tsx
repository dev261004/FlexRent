import Link from "next/link";
import { Footer } from "@/components/ui/Footer";
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
        <h1 className="max-w-4xl font-display text-6xl font-bold leading-tight text-text">
          Rent Anything.
          <br />
          <span className="text-accent">Anytime.</span>
          <br />
          Anywhere.
        </h1>

        <p className="mt-8 max-w-2xl text-lg text-chalk">
          Find tools, vehicles, electronics, furniture, camping gear and more from
          trusted local rental providers.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/browse"
            className="rounded-md bg-accent px-8 py-4 font-semibold text-black"
          >
            Browse Rentals
          </Link>

          <Link
            href="/vendor-signup"
            className="rounded-md border border-white/20 px-8 py-4 text-text"
          >
            List Your Equipment
          </Link>
        </div>
      </section>

      

      <Footer />
    </div>
  );
}
