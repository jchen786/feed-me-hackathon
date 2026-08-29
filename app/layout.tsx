import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feed Me",
  description: "AI-powered meal decision engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
