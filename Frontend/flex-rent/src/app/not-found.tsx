import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-white/5 bg-surface/90 px-6 py-4 backdrop-blur-sm">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-text"
        >
          flexrent
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="rounded-full bg-white/5 p-4 mb-8">
          <AlertCircle className="h-12 w-12 text-accent" />
        </div>
        
        <h1 className="font-display text-8xl font-bold tracking-tight text-text">
          404
        </h1>
        
        <h2 className="mt-4 font-display text-2xl font-semibold text-text">
          Page Not Found
        </h2>
        
        <p className="mt-4 max-w-md text-lg text-chalk">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or perhaps never existed.
        </p>

        <Link
          href="/"
          className="mt-10 rounded-md bg-accent px-8 py-4 font-semibold text-black transition-colors hover:bg-yellow-400"
        >
          Return to Homepage
        </Link>
      </main>
    </div>
  );
}
