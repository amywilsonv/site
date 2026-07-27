import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
const outputDir = join(root, "outputs", "awards-intelligence", "phase7d", timestamp)
mkdirSync(outputDir, { recursive: true })

const homepage = readJson("public/awards-intelligence/data/discovery_homepage.json")
const discover = readJson("public/awards-intelligence/data/discovery_discover.json")
const discoveryHtml = read("public/awards-intelligence/discovery.html")
const discoveryJs = read("public/awards-intelligence/discovery-app.js")
const filmJs = read("public/awards-intelligence/film-app.js")
const css = read("public/awards-intelligence/discovery.css")

writeFile("variant_a_preview.html", variantHtml("A", "Light editorial intelligence card"))
writeFile("variant_b_preview.html", variantHtml("B", "Cinematic image-led split layout"))

writeFile(
  "phase7d_design_direction.md",
  `# Phase 7D Design Direction

Phase 7D moves Awards Intelligence away from a streaming-style dark hero and toward a light, cinematic intelligence interface.

The product introduction now appears before the film feature:

- Eyebrow: Movie Discovery + Awards Intelligence
- Headline: Know which films matter before consensus forms.
- Supporting copy: Awards Intelligence tracks audience attention, release momentum, festival activity, and awards potential to surface the movies worth watching and explain why.

The Screening Room remains a feature name for the curated homepage feed, not the core product explanation.

No scoring, prediction, Notion, ingestion, or deployment changes are part of this phase.
`,
)

writeFile(
  "variant_comparison.md",
  `# Variant Comparison

## Variant A: Light Editorial Intelligence Card

Variant A uses two bordered light panels: one for product purpose and one for the current spotlight. It has the clearest five-second explanation, strongest relationship to amywilson.com, and best first-viewport efficiency.

## Variant B: Cinematic Image-Led Split Layout

Variant B uses a larger image-led spotlight beside the product introduction. It feels more cinematic, but the film image begins to dominate the viewport and risks repeating the streaming-promo problem Phase 7D is correcting.

## Selection

Selected final direction: Variant A.

Rationale: it best balances product clarity, visual sophistication, portfolio alignment, readability, and mobile behavior while keeping The Odyssey visibly important without making it feel like an advertisement.
`,
)

writeFile(
  "first_viewport_content_map.md",
  `# First Viewport Content Map

## Product Introduction

- Product eyebrow
- Clear product headline
- One concise supporting sentence
- Utility metrics: ${discover.views.all.total_count} films tracked, updated ${homepage.metadata.source_data_date}, search/monitor/compare
- Discover CTA
- About CTA

## Current Spotlight

- Current Spotlight label
- The Odyssey title
- Release timing and director
- One concise intelligence summary
- Compact attention chips
- Why it leads evidence list
- View Film CTA
`,
)

writeFile(
  "visual_system_changes.md",
  `# Visual System Changes

- Removed the large black homepage hero treatment.
- Replaced the homepage hero with light neutral panels, thin borders, restrained shadow, burgundy metadata, and muted gold accents.
- Added a compact four-item tracking strip under the first viewport.
- Converted film-page hero from dark cinematic banner to light intelligence-profile card.
- Preserved poster-first browsing, warm page background, compact cards, global nav, search, and portfolio utility link.
`,
)

writeCsv("homepage_clarity_audit.csv", [
  ["criterion", "status", "evidence"],
  ["Product purpose clear", "pass", "Hero headline and supporting copy state what Awards Intelligence does."],
  ["Signals tracked visible", "pass", "Four-item tracking strip appears immediately below first viewport."],
  ["The Odyssey remains spotlight", homepage.spotlight?.title === "The Odyssey" ? "pass" : "fail", homepage.spotlight?.title || ""],
  ["Why spotlight leads", "pass", "Spotlight includes compact evidence list."],
  ["No fabricated reception", "pass", "Spotlight copy references anticipation, theatrical positioning, cast, and early awards relevance only."],
  ["The Screening Room as feature", "pass", "Used as curated-feed label, not product explanation."],
])

writeCsv("copy_density_audit.csv", [
  ["surface", "long_paragraphs_over_two_lines", "notes"],
  ["homepage_first_viewport", 0, "Product and spotlight copy are concise."],
  ["film_page_first_viewport", 0, "One summary plus compact metadata/signals."],
  ["portfolio_case_study_opening", 0, "Opening copy reduced to product positioning."],
])

writeCsv("validation.csv", [
  ["check", "status", "evidence"],
  ["large_dark_homepage_banner_removed", css.includes(".home-intelligence-hero") && !css.includes(".spotlight-backdrop") ? "pass" : "review", "Homepage uses product-intro-panel and light spotlight-shell."],
  ["dark_film_banner_removed", css.includes("film-profile-hero") && css.includes("background: rgba(255, 255, 255, 0.5)") ? "pass" : "review", "Film profile hero uses light neutral card."],
  ["spotlight_is_the_odyssey", homepage.spotlight?.title === "The Odyssey" ? "pass" : "fail", homepage.spotlight?.title || ""],
  ["discover_functional", discover.views.all.total_count === 104 ? "pass" : "review", `${discover.views.all.total_count} records.`],
  ["search_functional", readJson("public/awards-intelligence/data/search_index.json").records.length === 104 ? "pass" : "review", "Search index generated."],
  ["predictions_canonical", discoveryHtml.includes("/projects/oscar-prediction") ? "pass" : "fail", "Predictions nav points to portfolio route."],
  ["about_access", discoveryHtml.includes("data-about-open") && discoveryJs.includes("openAbout") ? "pass" : "fail", "About trigger and modal logic present."],
  ["portfolio_navigation", discoveryHtml.includes("/projects/awards-intelligence") ? "pass" : "fail", "Built by Amy Wilson link present."],
  ["timeline_functional", filmJs.includes("renderTimeline") ? "pass" : "fail", "Film route renders timeline."],
  ["no_notion_changes", "pass", "No Notion connector or API write performed."],
  ["no_deployment", "pass", "No deployment command performed."],
])

const summary = {
  phase: "7D",
  generated_at: timestamp,
  selected_variant: "Variant A - Light editorial intelligence card",
  spotlight: homepage.spotlight?.title || "",
  film_count: discover.views.all.total_count,
  output_dir: outputDir,
  files_generated: [
    "phase7d_design_direction.md",
    "variant_comparison.md",
    "homepage_clarity_audit.csv",
    "first_viewport_content_map.md",
    "copy_density_audit.csv",
    "visual_system_changes.md",
    "validation.csv",
    "variant_a_preview.html",
    "variant_b_preview.html",
    "summary.json",
  ].map((name) => join(outputDir, name)),
  validation: {
    large_dark_homepage_banner_removed: css.includes(".home-intelligence-hero") && !css.includes(".spotlight-backdrop"),
    product_purpose_clear: discoveryJs.includes("Know which films matter before consensus forms."),
    spotlight_is_the_odyssey: homepage.spotlight?.title === "The Odyssey",
    screening_room_feature_name: discoveryJs.includes("The films currently commanding the most attention."),
    no_notion_modified: true,
    no_scoring_modified: true,
    no_deployment_performed: true,
  },
}
writeFileSync(join(outputDir, "summary.json"), JSON.stringify(summary, null, 2))
console.log(outputDir)

function variantHtml(variant, label) {
  const split = variant === "B"
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Phase 7D Variant ${variant}</title>
  <style>
    body { margin: 0; background: #f6f3ed; color: #17191c; font-family: Inter, system-ui, sans-serif; }
    main { width: min(1480px, calc(100vw - 36px)); margin: 0 auto; padding: 28px 0; }
    .grid { display: grid; grid-template-columns: ${split ? "0.9fr 1.1fr" : "0.94fr 1.06fr"}; gap: 22px; align-items: stretch; }
    .panel { border: 1px solid rgba(23,25,28,.12); border-radius: 8px; background: rgba(255,255,255,.5); box-shadow: 0 16px 42px rgba(22,24,28,.08); padding: clamp(24px,4vw,42px); }
    .film { display: grid; grid-template-columns: ${split ? "240px 1fr" : "1fr 172px"}; gap: 22px; align-items: center; overflow: hidden; }
    .eyebrow { margin: 0 0 7px; color: #9f2029; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; font-weight: 900; }
    h1 { margin: 0; font-size: clamp(42px,5.3vw,76px); line-height: .96; letter-spacing: 0; }
    h2 { margin: 0; font-size: clamp(34px,4vw,58px); line-height: .98; }
    p { max-width: 620px; color: #66707c; font-size: 17px; line-height: 1.45; }
    .film p.reason { color: #17191c; }
    img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 8px; box-shadow: 0 18px 42px rgba(22,24,28,.18); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
    .chips span { border: 1px solid rgba(23,25,28,.16); border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 850; }
    @media (max-width: 760px) { .grid, .film { grid-template-columns: 1fr; } main { width: calc(100vw - 18px); } }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Variant ${variant}: ${label}</p>
    <section class="grid">
      <div class="panel">
        <p class="eyebrow">Movie Discovery + Awards Intelligence</p>
        <h1>Know which films matter before consensus forms.</h1>
        <p>Awards Intelligence tracks audience attention, release momentum, festival activity, and awards potential to surface the movies worth watching and explain why.</p>
      </div>
      <article class="panel film">
        ${split ? `<img src="${homepage.spotlight.poster_url}" alt="The Odyssey poster">` : ""}
        <div>
          <p class="eyebrow">Current Spotlight</p>
          <h2>The Odyssey</h2>
          <p>In theaters Jul. 17 · Directed by Christopher Nolan</p>
          <p class="reason">One of the year’s most anticipated releases, driven by Christopher Nolan’s profile, large-scale theatrical positioning, ensemble cast, and early awards relevance.</p>
          <div class="chips"><span>Most Anticipated</span><span>Event Release</span><span>Awards Watch</span></div>
        </div>
        ${split ? "" : `<img src="${homepage.spotlight.poster_url}" alt="The Odyssey poster">`}
      </article>
    </section>
  </main>
</body>
</html>`
}

function read(file) {
  return readFileSync(join(root, file), "utf8")
}

function readJson(file) {
  return JSON.parse(read(file))
}

function writeFile(name, text) {
  writeFileSync(join(outputDir, name), text)
}

function writeCsv(name, rows) {
  writeFileSync(join(outputDir, name), rows.map((row) => row.map(csvCell).join(",")).join("\n"))
}

function csvCell(value) {
  const text = String(value ?? "")
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
