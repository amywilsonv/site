import Link from "next/link"
import { Code, Mail, Clapperboard } from "lucide-react"
import { FilmStrip } from "@/components/film-strip"

const work = [
  { n: "01", status: "In Progress" },
  { n: "02", status: "In Progress" },
  { n: "03", status: "Planned" },
]

const writingFrames = [
  { n: "01", category: "Streaming Strategy" },
  { n: "02", category: "Audience Behavior" },
  { n: "03", category: "Product & UX" },
  { n: "04", category: "AI & Media" },
  { n: "05", category: "Data & Analytics" },
  { n: "06", category: "Streaming Strategy" },
]

export default function Home() {
  return (
    <>
      <section className="pt-16 pb-20 lg:pt-24 lg:pb-28">
        <h1 className="text-7xl lg:text-[6.5rem] font-light tracking-tighter leading-[1.02] mb-6">
          Amy Wilson
        </h1>
        <p className="text-muted-foreground text-base max-w-sm leading-relaxed mb-8">
          More here soon.
        </p>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <a
            href="https://letterboxd.com/amywilson"
            className="hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Clapperboard className="size-3.5" />
            Letterboxd
          </a>
          <a
            href="https://github.com/amywilsonv"
            className="hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Code className="size-3.5" />
            GitHub
          </a>
          <a
            href="mailto:hello@example.com"
            className="hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Mail className="size-3.5" />
            Email
          </a>
        </div>
      </section>

      <section className="border-t">
        <div className="flex items-baseline justify-between py-5">
          <span className="text-sm font-medium">Selected Work</span>
          <Link
            href="/projects"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            All →
          </Link>
        </div>
        <div className="divide-y mb-12">
          {work.map(({ n, status }) => (
            <div key={n} className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground tabular-nums">{n}</span>
              <span className="text-xs text-muted-foreground">{status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t">
        <div className="flex items-baseline justify-between py-5">
          <span className="text-sm font-medium">Writing</span>
          <Link
            href="/writing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            All →
          </Link>
        </div>
      </section>

      <FilmStrip frames={writingFrames} />

      <div className="pb-20" />
    </>
  )
}
