import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-10">
          <Nav />
        </div>
        <main className="flex-1 mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-10">
          {children}
        </main>
      </body>
    </html>
  );
}
