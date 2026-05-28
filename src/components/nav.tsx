import Link from "next/link"
import { Clapperboard, Code, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/writing", label: "Writing" },
  { href: "/about", label: "About" },
]

export function Nav() {
  return (
    <header className="flex items-center justify-between py-4 border-b">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        Amy Wilson
      </Link>
      <nav className="flex items-center gap-0.5">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {label}
          </Link>
        ))}
        <a
          aria-label="Letterboxd"
          href="https://letterboxd.com/amywilson"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <Clapperboard className="size-4" />
        </a>
        <a
          aria-label="GitHub"
          href="https://github.com/amywilsonv"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <Code className="size-4" />
        </a>
        <a
          aria-label="Email"
          href="mailto:hello@example.com"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <Mail className="size-4" />
        </a>
      </nav>
    </header>
  )
}
