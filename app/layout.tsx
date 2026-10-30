import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceProof — Evidence before confidence",
  description: "Trace claims to exact source quotations, catch contradictions, and export a reviewable decision record.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
