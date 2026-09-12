import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EON — Enhanced Operations Network",
  description: "EON 2.0 — Intelligent Operations Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
