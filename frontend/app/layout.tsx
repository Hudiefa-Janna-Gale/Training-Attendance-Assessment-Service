import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training Hub",
  description: "Training, attendance and assessment management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
