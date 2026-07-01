import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anchor — a quiet check-in for your mind",
  description:
    "Anchor is a calm, ambient check-in for your mental wellness. Like a check engine light for stress — quietly noticing the small things, so you don't have to.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
