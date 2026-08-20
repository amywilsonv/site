"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clapperboard, Code, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Work" },
  { href: "/about", label: "About" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="mx-auto flex w-full max-w-[994px] items-center justify-between gap-6 border-b border-border py-9 sm:py-14">
      <Link href="/" className="shrink-0 text-sm font-bold tracking-normal">
        Amy Wilson
      </Link>
      <nav className="flex min-w-0 flex-wrap items-center justify-end gap-x-6 gap-y-3 text-sm">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "border-b border-transparent py-1 font-medium text-foreground transition-colors hover:border-foreground",
              (href === "/" ? pathname === "/" : pathname.startsWith(href)) &&
                "border-foreground font-bold",
            )}
          >
            {label}
          </Link>
        ))}
        <span className="hidden h-4 w-px bg-border sm:block" />
        <a
          href="https://letterboxd.com/amywilson"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Clapperboard className="size-3.5" />
          Letterboxd
        </a>
        <a
          href="https://github.com/amywilsonv"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Code className="size-3.5" />
          GitHub
        </a>
        <a
          href="mailto:hello@example.com"
          className="inline-flex items-center gap-1.5 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Mail className="size-3.5" />
          Email
        </a>
      </nav>
    </header>
  )
}
