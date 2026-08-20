import type { Metadata } from "next";
import { Geist_Mono, Instrument_Sans, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Nav } from "@/components/nav";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://amywilson.com"),
  title: { default: "Amy Wilson", template: "%s · Amy Wilson" },
  description:
    "Strategy and analytics at the intersection of entertainment, streaming, and AI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="w-full px-5 sm:px-8">
          <Nav />
        </div>
        <main className="flex-1 w-full">
          <div className="mx-auto w-full max-w-[994px] px-5 sm:px-8">
            {children}
          </div>
        </main>
        <Analytics />
      </body>
    </html>
  );
}
