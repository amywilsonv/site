import type { Metadata } from "next"

export const metadata: Metadata = { title: "Writing" }

const categories = [
  "Streaming Strategy",
  "Audience Behavior",
  "Product & UX",
  "AI & Media",
  "Data & Analytics",
]

export default function WritingPage() {
  return (
    <>
      <section className="pt-16 pb-12 lg:pt-24">
        <h1 className="font-heading italic font-light text-6xl lg:text-7xl tracking-tight mb-5">
          Writing
        </h1>
        <p className="text-muted-foreground text-base max-w-md leading-relaxed">
          Analysis and observations on the business of entertainment. Coming soon.
        </p>
      </section>

      <div className="space-y-10 pb-20">
        {categories.map((category) => (
          <section key={category} className="border-t pt-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
              {category}
            </p>
            <p className="text-sm text-muted-foreground">Coming soon.</p>
          </section>
        ))}
      </div>
    </>
  )
}
