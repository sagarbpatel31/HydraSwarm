import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HydraSwarm",
  description: "AI software company simulation with HydraDB-backed memory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
