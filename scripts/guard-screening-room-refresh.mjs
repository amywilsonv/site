import { execFileSync } from "node:child_process"

const allowedPrefix = "public/awards-intelligence/data/"
const protectedPattern = /^public\/awards-intelligence\/.*\.(html|js|css|svg)$/i

const changedFiles = [
  ...gitChanged(["diff", "--name-only"]),
  ...gitChanged(["diff", "--cached", "--name-only"]),
]

const protectedChanges = [...new Set(changedFiles)]
  .filter((file) => file.startsWith("public/awards-intelligence/"))
  .filter((file) => !file.startsWith(allowedPrefix))
  .filter((file) => protectedPattern.test(file))
  .sort()

if (protectedChanges.length) {
  console.error("Screening Room refresh may only update generated data under public/awards-intelligence/data/**.")
  console.error("Protected frontend files changed:")
  for (const file of protectedChanges) console.error(`- ${file}`)
  process.exit(1)
}

console.log("Screening Room refresh guard passed: only approved generated data files changed.")

function gitChanged(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}
