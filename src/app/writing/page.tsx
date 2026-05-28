import type { Metadata } from "next"
import { FilmStrip } from "@/components/film-strip"

export const metadata: Metadata = { title: "Writing" }

const frames = [
  { n: "01", category: "Streaming Strategy" },
  { n: "02", category: "Audience Behavior" },
  { n: "03", category: "Product & UX" },
  { n: "04", category: "AI & Media" },
  { n: "05", category: "Data & Analytics" },
  { n: "06", category: "Streaming Strategy" },
  { n: "07", category: "Audience Behavior" },
  { n: "08", category: "AI & Media" },
  { n: "09", category: "Product & UX" },
]

export default function WritingPage() {
  return (
    <>
      <section className="pt-16 pb-10 lg:pt-24">
        <h1 className="text-6xl lg:text-7xl font-light tracking-tighter mb-5">
          Writing
        </h1>
        <p className="text-muted-foreground text-base max-w-md leading-relaxed">
          Analysis and observations on the business of entertainment. Coming soon.
        </p>
      </section>

      <FilmStrip frames={frames} />

      <div className="pb-20" />
    </>
  )
}
