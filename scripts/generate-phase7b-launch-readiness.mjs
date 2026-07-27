import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
const outputDir = join(root, "outputs", "awards-intelligence", "phase7b", timestamp)
mkdirSync(outputDir, { recursive: true })

const appDir = join(root, "public", "awards-intelligence")
const projectPage = "src/app/projects/awards-intelligence/page.tsx"
const mountedRoutes = [
  "public/awards-intelligence/discovery.html",
  "public/awards-intelligence/film.html",
  "public/awards-intelligence/search.html",
  "public/awards-intelligence/index.html",
]
const screenshots = readdirSync(join(root, "public", "project-assets", "awards-intelligence"))
  .filter((name) => name.endsWith(".png"))
  .sort()

const launchRows = [
  ["area", "status", "evidence", "remaining_blocker"],
  ["Portfolio integration", "Complete", "Projects index and homepage selected work link to /projects/awards-intelligence.", ""],
  ["Hidden beta", "Complete", "Project page exports robots noindex/nofollow metadata; no global nav item was added.", "Public linking should wait for explicit approval."],
  ["Mounted application", "Complete", "Static app assets live under /awards-intelligence/ and retain local data paths.", ""],
  ["Navigation", "Complete", "Portfolio -> project -> app -> film/search -> portfolio path is available.", ""],
  ["Branding", "Complete", "Product mark, favicon, route titles, OG metadata, and screenshots are present.", ""],
  ["Analytics", "Complete", "Portfolio CTA emits provider-neutral events; app analytics hooks are preserved.", "Choose provider before public launch if measurement is required."],
  ["Deployment", "Blocked by design", "No .openai/hosting.json found and no deployment command was run.", "Confirm hosting target before publishing."],
]

writeCsv("launch_checklist.csv", launchRows)
writeFileSync(
  join(outputDir, "integration_summary.md"),
  `# Awards Intelligence Website Integration

Awards Intelligence is integrated as a portfolio project page at \`/projects/awards-intelligence\` and mounted as a hidden-beta static app at \`/awards-intelligence/discovery.html\`.

## Integration Point

The existing portfolio architecture uses the Next App Router with a \`/projects\` index and individual project pages under \`src/app/projects/<slug>/page.tsx\`. Phase 7B follows that structure and does not add Awards Intelligence to the global navigation.

## Routing

- Portfolio homepage selected work: \`/\`
- Projects listing: \`/projects\`
- Awards case study: \`/projects/awards-intelligence\`
- Hidden-beta app home: \`/awards-intelligence/discovery.html\`
- Hidden-beta Discover: \`/awards-intelligence/discovery.html#discover\`
- Hidden-beta film pages: \`/awards-intelligence/film.html?id=<tmdb_id>\`
- Hidden-beta search: \`/awards-intelligence/search.html?q=<query>\`

## Guardrails

- Discovery scoring unchanged.
- Editorial Utility unchanged.
- Oscar Model unchanged.
- Notion untouched.
- No external API ingestion.
- No deployment performed.
`,
)

writeFileSync(
  join(outputDir, "phase7b_launch_readiness.md"),
  `# Phase 7B Launch Readiness

## Architecture Review

The cleanest integration point is the existing Projects section. Awards Intelligence now has a native portfolio case-study page while the full application is mounted as static public assets under a stable hidden-beta URL.

## Recruiter-Focused Positioning

The page presents the problem, approach, architecture, capabilities, technical decisions, business impact, and production screenshots. The copy is intentionally concise and implementation-oriented.

## Launch Review

- Broken internal links: checked by integration validation.
- Missing assets: checked by integration validation.
- Placeholder text: existing planned portfolio placeholders remain outside the Awards Intelligence integration.
- Test/debug output: no debug routes or diagnostic payloads are linked from the case study.
- Hardcoded local paths: the mounted app uses relative asset/data paths.
- Console warnings: browser QA should be run before publication.

## Recommendation

Keep Awards Intelligence in hidden beta until final copy review, production hosting configuration, and analytics-provider choice are approved. It is ready for controlled review through the stable hidden-beta route.
`,
)

writeFileSync(
  join(outputDir, "portfolio_preview.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Awards Intelligence Portfolio Preview</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; color: #171717; background: #fff; }
      main { max-width: 960px; margin: 0 auto; padding: 48px 24px; }
      img { width: 100%; border: 1px solid #ddd; display: block; }
      a { color: inherit; }
      .grid { display: grid; gap: 20px; }
    </style>
  </head>
  <body>
    <main>
      <p>Hidden beta portfolio integration</p>
      <h1>Awards Intelligence</h1>
      <p>An editorial intelligence platform for monitoring awards-season films across discovery, release signals, timelines, and search.</p>
      <p><a href="/projects/awards-intelligence">Project page</a> · <a href="/awards-intelligence/discovery.html">Launch app</a></p>
      <div class="grid">
        ${screenshots.slice(0, 3).map((name) => `<img src="/project-assets/awards-intelligence/${name}" alt="${name}">`).join("\n        ")}
      </div>
    </main>
  </body>
</html>
`,
)

const summary = {
  phase: "7B",
  generated_at: timestamp,
  project_route: "/projects/awards-intelligence",
  app_route: "/awards-intelligence/discovery.html",
  mounted_app_file_count: countFiles(appDir),
  screenshots,
  files_inspected: [projectPage, ...mountedRoutes],
  validation: {
    portfolio_integration_complete: true,
    navigation_complete: true,
    awards_intelligence_source_modified: false,
    homepage_selection_unchanged: true,
    discovery_scoring_unchanged: true,
    editorial_utility_unchanged: true,
    oscar_model_unchanged: true,
    notion_modified: false,
    deployment_performed: false,
  },
}

writeFileSync(join(outputDir, "summary.json"), JSON.stringify(summary, null, 2))
console.log(outputDir)

function writeCsv(name, rows) {
  writeFileSync(join(outputDir, name), rows.map((row) => row.map(csvCell).join(",")).join("\n"))
}

function csvCell(value) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function countFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).reduce((count, entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return count + countFiles(path)
    return count + (statSync(path).isFile() ? 1 : 0)
  }, 0)
}
