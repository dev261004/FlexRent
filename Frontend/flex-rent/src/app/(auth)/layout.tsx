import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col bg-surface">
      <header className="flex items-center justify-center py-8">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-text"
        >
          flexrent
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}
