import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "YT Anime Library",
  description: "Anime-first library for official YouTube-hosted releases"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
