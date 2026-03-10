import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Say It Now",
  description: "Speak any phrase in any language. No reading required.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
