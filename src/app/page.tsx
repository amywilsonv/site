import Link from "next/link"

const work = [
  {
    n: "01",
    title: "The Screening Room",
    description:
      "A film-intelligence product for understanding which films matter, why they matter, and what changed — combining release timing, festival activity, audience attention, critical reception, and awards signal into one editorial browsing experience.",
    primaryLabel: "Explore Screening Room",
    primaryHref: "/screening-room/",
    secondaryHref: "/projects/screening-room",
  },
  {
    n: "02",
    title: "Awards Intelligence",
    description:
      "Data-driven awards forecasting — tracking how nominee and winner probability shifts across a season.",
    primaryLabel: "View the model",
    primaryHref: "/projects/oscar-prediction#forecast",
    secondaryHref: "/projects/oscar-prediction#methodology",
  },
]

export default function Home() {
  return (
    <>
      <section className="pt-14 pb-12 sm:pt-14 sm:pb-11">
        <h1 className="text-5xl font-bold leading-[1.05] tracking-normal sm:text-[56px]">
          Amy Wilson
        </h1>
      </section>

      <section className="pb-16 sm:pb-20">
        <h2 className="mb-9 border-b border-foreground pb-9 text-2xl font-bold leading-tight">
          What&apos;s in the works
        </h2>
        <div className="divide-y divide-border border-b border-border">
          {work.map(({ n, title, description, primaryLabel, primaryHref, secondaryHref }) => (
            <article
              key={n}
              className="grid gap-5 py-11 sm:grid-cols-[92px_1fr] sm:gap-12"
            >
              <span className="font-serif text-[52px] italic leading-none text-[#9a9185] sm:text-[56px]">
                {n}
              </span>
              <div>
                <h3 className="text-4xl font-bold leading-tight tracking-normal sm:text-[43px]">
                  {title}
                </h3>
                <p className="mt-5 max-w-[620px] text-base leading-7 text-foreground">
                  {description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                  <Link
                    href={primaryHref}
                    className="border-b border-foreground font-bold leading-6 transition-colors hover:text-muted-foreground"
                  >
                    {primaryLabel} ↗
                  </Link>
                  <Link
                    href={secondaryHref}
                    className="font-medium leading-6 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    About the project →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
