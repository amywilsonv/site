import type { Metadata } from "next"
import { Mail, Code } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = { title: "About" }

const interests = [
  "Streaming platform strategy and subscriber behavior",
  "Audience psychology and what drives fandom",
  "AI-assisted analytics and media intelligence workflows",
  "Release strategy and the mechanics of cultural conversation",
  "Product and UX design in entertainment apps",
  "Forecasting models for awards and box office",
]

export default function AboutPage() {
  return (
    <>
      <section className="py-16 lg:py-20 max-w-2xl">
        <h1 className="font-heading italic font-light text-6xl lg:text-7xl tracking-tight mb-8">About</h1>

        <div className="space-y-5 text-base leading-relaxed text-foreground">
          <p>
            I'm a strategy and analytics professional building a focused practice at the
            intersection of entertainment, media, and AI. My background is in consulting and
            operations — cross-functional work, structured problem-solving, and translating
            ambiguous questions into clear frameworks.
          </p>
          <p>
            I'm now applying that operator mindset to entertainment: studying how streaming
            platforms make decisions, how audiences behave, how AI is reshaping the skillset
            the industry requires, and how data can tell a more interesting story than a
            standard box office summary.
          </p>
          <p>
            This site is where I work in public — projects, writing, and the thinking behind
            both. It's not a finished portfolio. It's a living record of someone taking the
            work seriously.
          </p>
        </div>
      </section>

      <section className="border-t pt-10 pb-12 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          What I explore
        </h2>
        <ul className="space-y-2.5">
          {interests.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t pt-10 pb-20 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Get in touch
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          I'm always interested in conversations about entertainment strategy, analytics
          projects, or opportunities at the intersection of media and technology.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:hello@example.com"
            className={cn(buttonVariants())}
          >
            <Mail className="size-4" />
            hello@example.com
          </a>
          <a
            href="https://github.com/amywilsonv"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Code className="size-4" />
            GitHub
          </a>
        </div>
      </section>
    </>
  )
}
