import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "snoxe",
  description: "Custom SVG favicon",
  icons: [
    { rel: "icon", url: "/favicon.svg?v=2", type: "image/svg+xml" },
    { rel: "alternate icon", url: "/favicon.ico", type: "image/x-icon" }, // fallback
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
