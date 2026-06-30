import type { Metadata } from "next"

export const metadata: Metadata = { title: "Now" }

type NowSection = {
  heading: string
  dot: string
  items: string[]
}

const sections: NowSection[] = [
  {
    heading: "Building",
    dot: "bg-amber-400",
    items: [
      "Oscars prediction model — building out the precursor data pipeline",
      "This site — adding content as it gets created",
      "AI project — automating the data pipeline",
    ],
  },
  {
    heading: "Learning",
    dot: "bg-emerald-400",
    items: [
      "Deeper SQL — window functions, cohort analysis patterns",
      "Python for data analysis — Pandas, visualization libraries",
      "How streaming platforms actually structure their analytics orgs",
    ],
  },
  {
    heading: "Watching",
    dot: "bg-violet-400",
    items: [
      "Keeping a close eye on Apple TV+ retention strategy post-Severance S2",
      "How Max is repositioning after the Warner Bros. Discovery merger chaos",
      "Awards season precursor patterns — who's leading, who's fading",
    ],
  },
  {
    heading: "Thinking about",
    dot: "bg-sky-400",
    items: [
      "Whether weekly release is the right default for prestige drama going forward",
      "What AI-assisted audience analysis looks like at scale inside a studio",
      "How to make portfolio projects feel like real work, not homework",
    ],
  },
]

export default function NowPage() {
  return (
    <>
      <section className="py-16 lg:py-20 max-w-2xl">
        <h1 className="text-6xl lg:text-7xl font-light tracking-tighter mb-4">Now</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          A snapshot of what I&apos;m actively working on, learning, and thinking about.
          Updated as things shift — which they do.
        </p>
      </section>

      <div className="space-y-12 pb-20 max-w-2xl">
        {sections.map((section) => (
          <section key={section.heading} className="border-t pt-8">
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-2 h-2 rounded-full ${section.dot}`} />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {section.heading}
              </h2>
            </div>
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li key={item} className="text-sm leading-relaxed flex items-start gap-3">
                  <span className="mt-2 w-1 h-1 rounded-full bg-border shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
