import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlexRent — Rent equipment and tools",
  description:
    "Browse thousands of tools and equipment available for rent near you. Borrow what you need, earn from what you don't.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col font-body text-text antialiased">
        {children}
      </body>
    </html>
  );
}
