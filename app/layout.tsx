import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EstateOS Action Copilot",
  description: "AI action layer for UK estate agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-body">{children}</body>
    </html>
  );
}
