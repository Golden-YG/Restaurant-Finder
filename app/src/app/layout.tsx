import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Restaurant Finder",
  description: "Find restaurants that match your preferences using AI and Google reviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4 text-sm">
            <Link href="/" className="underline">Restaurants</Link>
            <Link href="/music3d" className="underline">Music → 3D</Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
