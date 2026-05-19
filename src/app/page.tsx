import Link from "next/link";
import { ArrowUpRight, Code, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const projects = [
  {
    title: "Selected Work",
    description: "A focused place to feature projects, writing, and experiments.",
  },
  {
    title: "About",
    description: "A concise personal profile with background, tools, and interests.",
  },
  {
    title: "Contact",
    description: "Simple routes for people to reach out without hunting around.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b pb-5">
          <Link className="text-sm font-semibold" href="/">
            Amy Wilson
          </Link>
          <nav className="flex items-center gap-2">
            <a
              aria-label="GitHub"
              className={cn(buttonVariants({ size: "icon", variant: "ghost" }))}
              href="https://github.com/amywilsonv"
            >
                <Code className="size-4" />
            </a>
            <a
              aria-label="Email"
              className={cn(buttonVariants({ size: "icon", variant: "ghost" }))}
              href="mailto:hello@example.com"
            >
                <Mail className="size-4" />
            </a>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <Badge className="mb-6" variant="secondary">
              Personal site starter
            </Badge>
            <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              A clean home base for work, writing, and what comes next.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Built with the latest Next.js app router, TypeScript, Tailwind CSS,
              and shadcn/ui so the next round of content has a solid foundation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className={cn(buttonVariants())}
                href="mailto:hello@example.com"
              >
                Get in touch
                <ArrowUpRight className="size-4" />
              </a>
              <a
                className={cn(buttonVariants({ variant: "outline" }))}
                href="https://github.com/amywilsonv/site"
              >
                View source
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.title}>
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
