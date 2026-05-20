import Link from "next/link"
import { Code, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const work = [
  { n: "01", status: "In Progress" },
  { n: "02", status: "In Progress" },
  { n: "03", status: "Planned" },
]

export default function Home() {
  return (
    <>
      <section className="pt-16 pb-20 lg:pt-24 lg:pb-28">
        <h1 className="font-heading italic font-light text-7xl lg:text-8xl tracking-tight mb-6">
          Amy Wilson
        </h1>
        <p className="text-muted-foreground text-base max-w-sm leading-relaxed mb-8">
          {/* Add your intro here */}
          More here soon.
        </p>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
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
        <div className="divide-y">
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
        <p className="pb-12 text-sm text-muted-foreground">Coming soon.</p>
      </section>

      <div className="pb-20" />
    </>
  )
}
