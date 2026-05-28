import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const bricolage = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
      className={`${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="w-full px-6 sm:px-10 lg:px-16">
          <Nav />
        </div>
        <main className="flex-1 w-full">
          <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
