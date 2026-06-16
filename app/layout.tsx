import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HOA Daddy — Condo warrantability, instantly",
  description: "Reuse cached condo questionnaires instead of re-ordering them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
