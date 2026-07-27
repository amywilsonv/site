import Link from "next/link"
import { Code, Mail, Clapperboard } from "lucide-react"
import { FilmStrip } from "@/components/film-strip"

const work = [
  {
    n: "01",
    title: "The Screening Room",
    href: "/projects/awards-intelligence",
    status: "Hidden beta",
  },
  {
    n: "02",
    title: "Oscar Prediction Model",
    href: "/projects/oscar-prediction",
    status: "Published",
  },
  { n: "03", title: "Audience study", href: "/projects", status: "Planned" },
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
          {work.map(({ n, title, href, status }) => (
            <Link
              key={n}
              href={href}
              className="group flex items-center justify-between gap-6 py-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {n}
                </span>
                <span className="truncate text-sm">{title}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {status}
              </span>
            </Link>
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
