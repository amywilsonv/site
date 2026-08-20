import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"

import { AnalyticsLink } from "@/components/analytics-link"

export const metadata: Metadata = {
  title: "The Screening Room",
  description:
    "A movie-intelligence platform for understanding which films matter, why they matter, and what changed.",
  openGraph: {
    title: "The Screening Room",
    description:
      "A movie-intelligence platform for understanding which films matter, why they matter, and what changed.",
    images: ["/project-assets/awards-intelligence/screening-room-refined-homepage-desktop.png"],
  },
}

const appUrl = "/screening-room/"

const dimensions = [
  "Creative",
  "Attention",
  "Reception",
  "Release",
  "Awards",
  "Cultural impact",
]

const capabilities = [
  "Editorial homepage for films worth following",
  "Poster-first discovery by release, festival, and awards context",
  "Film intelligence profiles with timelines and latest activity",
  "Universal local search across titles, filmmakers, distributors, franchises, and genres",
  "Refresh-ready data pipeline with audit logs before live writes",
  "Static production payloads for a fast public preview",
]

const system = [
  ["Editorial database", "Reviewed film records, manual overrides, and source-of-truth metadata."],
  ["Profile layer", "Canonical Film Intelligence Profiles shared by Home, Discover, Film pages, Search, and Timelines."],
  ["Selection layer", "Ranking and composition logic for homepage placement without changing the Oscar model."],
  ["Export layer", "Static JSON payloads, diagnostics, validation reports, and deployable dashboard assets."],
]

const screenshots = [
  {
    src: "/project-assets/awards-intelligence/screening-room-refined-homepage-desktop.png",
    alt: "The Screening Room homepage with a split Now in Focus feature and editorial sections",
    label: "Home",
    width: 1440,
    height: 1200,
  },
  {
    src: "/project-assets/awards-intelligence/screening-room-refined-discover.png",
    alt: "The Screening Room Discover view",
    label: "Discover",
    width: 1440,
    height: 1200,
  },
  {
    src: "/project-assets/awards-intelligence/screening-room-refined-film-detail.png",
    alt: "The Screening Room film intelligence profile",
    label: "Film profile",
    width: 1440,
    height: 1200,
  },
  {
    src: "/project-assets/awards-intelligence/screening-room-refined-awards-intelligence.png",
    alt: "The Screening Room Awards Intelligence view",
    label: "Awards Intelligence",
    width: 1440,
    height: 1200,
  },
]

export default function AwardsIntelligencePage() {
  return (
    <>
      <section className="pt-14 pb-14 lg:pt-24 lg:pb-20">
        <Link
          href="/projects"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Projects
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="flex size-5 items-center justify-center bg-foreground text-[10px] font-semibold text-background">
                SR
              </span>
              Live project
            </div>
            <h1 className="max-w-3xl text-6xl font-light tracking-tighter leading-[1.02] lg:text-7xl">
              The Screening Room
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              A movie-intelligence product for understanding which films matter,
              why they matter, and what changed. It combines release data,
              festival activity, audience attention, critical reception, and
              awards signals into a compact editorial browsing experience.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <AnalyticsLink
                href={appUrl}
                eventName="awards_intelligence_launch_clicked"
                eventPayload={{ surface: "project_page" }}
                className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Launch Screening Room
                <ArrowUpRight className="size-4" />
              </AnalyticsLink>
              <Link
                href="/projects/oscar-prediction"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View the Oscar model
              </Link>
            </div>
          </div>
          <div className="border bg-muted/30 p-2">
            <Image
              src="/project-assets/awards-intelligence/screening-room-refined-homepage-desktop.png"
              alt="The Screening Room homepage preview"
              width={1440}
              height={1200}
              loading="eager"
              fetchPriority="high"
              className="aspect-[16/11] w-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      <CaseSection title="Context">
        <p>
          Awards coverage and movie discovery both begin before consensus is
          available. The core product problem is not predicting an Oscar winner
          in July; it is deciding which releases deserve attention over the
          next year, what evidence supports that attention, and when something
          meaningful changes.
        </p>
      </CaseSection>

      <CaseSection title="Approach">
        <div className="space-y-5">
          <p>
            The Screening Room separates monitoring importance from awards
            strength. A film can be strategically important to follow because of
            scale, filmmaker, distributor, festival path, cultural attention, or
            craft upside even when its current awards profile is still
            developing.
          </p>
          <p>
            The intelligence model evaluates six dimensions and turns them into
            visible editorial context instead of exposing a spreadsheet of raw
            scores.
          </p>
          <div className="flex flex-wrap gap-2">
            {dimensions.map((dimension) => (
              <span key={dimension} className="border px-2.5 py-1 text-xs text-muted-foreground">
                {dimension}
              </span>
            ))}
          </div>
        </div>
      </CaseSection>

      <CaseSection title="System">
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            {system.map(([title, body]) => (
              <div key={title} className="border-t pt-4">
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
          <div className="border p-4 text-xs text-muted-foreground">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              <span>Notion editorial database</span>
              <span className="hidden md:block">→</span>
              <span>Python intelligence and export pipeline</span>
              <span className="hidden md:block">→</span>
              <span>Static dashboard payloads</span>
            </div>
          </div>
          <p>
            The architecture keeps the Oscar model, Notion database, discovery
            scoring, homepage composition, search index, and timeline exports
            as separate surfaces with explicit validation before changes are
            promoted.
          </p>
        </div>
      </CaseSection>

      <CaseSection title="Outcome">
        <div className="space-y-5">
          <p>
            The Screening Room now supports a recruiter-reviewable product flow:
            Home, Discover, Festival Radar, Awards Intelligence, Film profiles,
            Timeline activity, Search, and return navigation back to the
            portfolio.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <span key={capability} className="border px-3 py-2 text-xs text-muted-foreground">
                {capability}
              </span>
            ))}
          </div>
        </div>
      </CaseSection>

      <section className="border-t py-10">
        <div className="mb-6 flex items-baseline justify-between gap-6">
          <h2 className="text-sm font-medium">Current experience</h2>
          <span className="text-xs text-muted-foreground">Live product preview</span>
        </div>
        <div className="grid gap-5">
          {screenshots.map((shot) => (
            <figure key={shot.src} className="border bg-muted/20 p-2">
              <Image
                src={shot.src}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                loading="eager"
                className="aspect-[16/9] w-full object-cover object-top"
              />
              <figcaption className="px-1 pt-3 text-xs text-muted-foreground">
                {shot.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="border-t py-10 pb-20">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <h2 className="text-sm font-medium">Status</h2>
          <div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              The project is ready for public review, with the live product
              linked through the clean Screening Room route.
            </p>
            <AnalyticsLink
              href={appUrl}
              eventName="awards_intelligence_launch_clicked"
              eventPayload={{ surface: "project_footer" }}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground"
            >
              Open The Screening Room
              <ArrowUpRight className="size-4" />
            </AnalyticsLink>
          </div>
        </div>
      </section>
    </>
  )
}

function CaseSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t py-10">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <h2 className="text-sm font-medium">{title}</h2>
        <div className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </section>
  )
}
