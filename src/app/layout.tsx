import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Virpo — Sales Call Intelligence Platform (Tamil-First)",
  description: "AI-powered Tamil/Tanglish sales call scoring and coaching platform using Sarvam AI STT & Google Gemini reasoning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
