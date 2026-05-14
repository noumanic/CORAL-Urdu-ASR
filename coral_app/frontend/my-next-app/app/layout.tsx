import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets:  ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets:  ["latin"],
  weight:   ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title:       "CORAL — Low-Resource Urdu ASR Post-Correction",
  description: "Consensus-Based Refinement and Output Realignment — a five-stage post-processing pipeline that cuts Urdu speech-recognition error rates by up to 46.5%.",
  icons: {
    icon: "/coral-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable} h-full scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-slate-950 text-slate-100">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
