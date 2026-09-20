import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training Hub",
  description: "Training sessions, daily attendance, assessments and final PASS/FAIL results",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
