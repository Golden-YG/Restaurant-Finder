import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Restaurant Finder",
  description: "Find restaurants that match your preferences using AI and Google reviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
