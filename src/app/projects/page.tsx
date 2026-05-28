import type { Metadata } from "next"

export const metadata: Metadata = { title: "Projects" }

type Project = {
  n: string
  label: string
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
      { n: "01", label: "Forecasting model", status: "In Progress" },
      { n: "02", label: "Retention analysis", status: "Planned" },
      { n: "03", label: "Audience study", status: "Planned" },
    ],
  },
  {
    name: "AI & Automation",
    projects: [
      { n: "01", label: "Automation pipeline", status: "In Progress" },
      { n: "02", label: "Analysis tool", status: "Planned" },
    ],
  },
  {
    name: "Strategy & Research",
    projects: [
      { n: "01", label: "Industry research", status: "Planned" },
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
                <div
                  key={`${category.name}-${project.n}`}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground tabular-nums w-5">
                      {project.n}
                    </span>
                    <span className="text-sm">{project.label}</span>
                  </div>
                  <span className={`text-xs ${statusColor[project.status]}`}>
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
