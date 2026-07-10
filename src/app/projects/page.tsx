import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Projects" }

type Project = {
  n: string
  title: string
  label: string
  href?: string
  cta?: string
  status: "In Progress" | "Planned" | "Published"
}

type Category = {
  name: string
  projects: Project[]
}

const categories: Category[] = [
  {
    name: "Data & Analytics",
    projects: [
      {
        n: "01",
        title: "Awards Intelligence",
        label:
          "A machine learning forecasting system that ranks Academy Award nominees and predicts winners using historical results, precursor awards, film metadata, person-level features, and media signals.",
        href: "/projects/oscar-prediction",
        cta: "View project",
        status: "Published",
      },
      { n: "02", title: "Retention analysis", label: "Customer retention analysis.", status: "Planned" },
      { n: "03", title: "Audience study", label: "Audience research study.", status: "Planned" },
    ],
  },
  {
    name: "AI & Automation",
    projects: [
      { n: "01", title: "Automation pipeline", label: "Automation pipeline.", status: "In Progress" },
      { n: "02", title: "Analysis tool", label: "Analysis tool.", status: "Planned" },
    ],
  },
  {
    name: "Strategy & Research",
    projects: [
      { n: "01", title: "Industry research", label: "Industry research.", status: "Planned" },
    ],
  },
]

const statusColor: Record<Project["status"], string> = {
  "In Progress": "text-foreground",
  Planned: "text-muted-foreground",
  Published: "text-foreground",
}

export default function ProjectsPage() {
  return (
    <>
      <section className="pt-16 pb-12 lg:pt-24">
        <h1 className="text-6xl lg:text-7xl font-light tracking-tighter mb-5">
          Projects
        </h1>
        <p className="text-muted-foreground text-base max-w-md leading-relaxed">
          Work in progress. More here as things get built.
        </p>
      </section>

      <div className="space-y-10 pb-20">
        {categories.map((category) => (
          <section key={category.name} className="border-t pt-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
              {category.name}
            </p>
            <div className="divide-y">
              {category.projects.map((project) => (
                <ProjectRow
                  key={`${category.name}-${project.n}`}
                  project={project}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

function ProjectRow({ project }: { project: Project }) {
  const content = (
    <>
      <div className="flex min-w-0 gap-4">
        <span className="mt-1 w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
          {project.n}
        </span>
        <div className="min-w-0">
          <span className="block text-sm">{project.title}</span>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {project.label}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={`text-xs ${statusColor[project.status]}`}>
          {project.status}
        </span>
        {project.cta ? (
          <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
            {project.cta}
          </span>
        ) : null}
      </div>
    </>
  )

  if (project.href) {
    return (
      <Link
        className="group flex items-start justify-between gap-6 py-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
        href={project.href}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="flex items-start justify-between gap-6 py-4">
      {content}
    </div>
  )
}
