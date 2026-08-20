import type { Metadata } from "next"

export const metadata: Metadata = { title: "About" }

const interests = [
  "Streaming platform strategy and subscriber behavior",
  "Audience psychology and what drives fandom",
  "AI-assisted analytics and media intelligence workflows",
  "Release strategy and the mechanics of cultural conversation",
]

export default function AboutPage() {
  return (
    <>
      <section className="max-w-[650px] py-16 sm:py-18">
        <h1 className="mb-10 text-6xl font-bold leading-tight tracking-normal sm:text-[60px]">
          About
        </h1>

        <div className="space-y-8 text-lg leading-8 text-foreground">
          <p>
            I&apos;m a strategy and analytics professional building a focused practice at the
            intersection of entertainment, media, and AI. My background is in consulting and
            operations — cross-functional work, structured problem-solving, and translating
            ambiguous questions into clear frameworks.
          </p>
          <p>
            I&apos;m now applying that operator mindset to entertainment: studying how streaming
            platforms make decisions, how audiences behave, how AI is reshaping the skillset
            the industry requires, and how data can tell a more interesting story than a
            standard box office summary.
          </p>
          <p>
            This site is where I work in public — projects, writing, and the thinking behind
            both. It&apos;s not a finished portfolio. It&apos;s a living record of someone taking the
            work seriously.
          </p>
        </div>
      </section>

      <section className="max-w-[640px] border-t border-border pt-12 pb-20">
        <h2 className="font-serif text-base italic leading-none text-[#8d857b]">
          What I explore
        </h2>
        <ul className="mt-6 border-y border-border">
          {interests.map((item, index) => (
            <li
              key={item}
              className="grid grid-cols-[48px_1fr] items-baseline gap-0 border-t border-border py-5 first:border-t-0"
            >
              <span className="font-serif text-2xl italic leading-none text-[#9a9185]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-base leading-6">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
