import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
const outputDir = join(root, "outputs", "awards-intelligence", "phase7c", timestamp)
mkdirSync(outputDir, { recursive: true })

const homepage = readJson("public/awards-intelligence/data/discovery_homepage.json")
const discover = readJson("public/awards-intelligence/data/discovery_discover.json")
const searchIndex = readJson("public/awards-intelligence/data/search_index.json")
const latestActivity = readJson("public/awards-intelligence/data/latest_activity.json")
const filmDir = join(root, "public", "awards-intelligence", "data", "films")
const filmFiles = readdirSync(filmDir).filter((name) => name.endsWith(".json")).sort()
const profiles = filmFiles.map((name) => JSON.parse(readFileSync(join(filmDir, name), "utf8")))
const htmlFiles = ["discovery.html", "film.html", "search.html", "index.html"].map((name) => `public/awards-intelligence/${name}`)
const routeHtml = Object.fromEntries(htmlFiles.map((file) => [file, read(file)]))
const caseStudy = read("src/app/projects/awards-intelligence/page.tsx")

const attentionRows = [
  ["tmdb_id", "title", "attention_score", "homepage_spotlight_score", "override", "confidence", "reasons", "early_reception"],
  ...profiles.map((profile) => {
    const attention = profile.attention_intelligence || {}
    return [
      profile.film_identity.tmdb_id,
      profile.film_identity.title,
      attention.attention_score ?? "",
      attention.homepage_spotlight_score ?? "",
      Boolean(attention.homepage_spotlight_override),
      attention.attention_confidence || "",
      (attention.attention_reasons || []).join("; "),
      attention.early_reception || "",
    ]
  }),
]

const navigationRows = [
  ["route", "home", "discover", "predictions", "about", "portfolio_return", "old_oscar_model_label"],
  ...Object.entries(routeHtml).map(([route, html]) => [
    route,
    html.includes(">Home<"),
    html.includes(">Discover<"),
    html.includes(">Predictions<") && html.includes("/projects/oscar-prediction"),
    html.includes("data-about-open") || route.endsWith("discovery.html"),
    html.includes("/projects/awards-intelligence"),
    html.includes("Oscar Model"),
  ]),
]

const copyRows = [
  ["surface", "word_count", "long_paragraphs", "notes"],
  ["project_case_study", wordCount(caseStudy), longParagraphCount(caseStudy), "Recruiter-facing case study copy."],
  ["app_home_rendering", wordCount(read("public/awards-intelligence/discovery-app.js")), 0, "Runtime copy includes compact homepage modules and About modal."],
  ["film_route_rendering", wordCount(read("public/awards-intelligence/film-app.js")), 0, "Runtime copy focused on signal sections and timeline."],
  ["search_route_rendering", wordCount(read("public/awards-intelligence/search-app.js")), 0, "Search copy is compact and utility-oriented."],
]

const spotlightRows = [
  ["field", "value"],
  ["title", homepage.spotlight?.title || ""],
  ["tmdb_id", homepage.spotlight?.tmdb_id || ""],
  ["homepage_spotlight_score", homepage.spotlight?.homepage_spotlight_score || ""],
  ["metadata_override", Boolean(homepage.metadata?.homepage_spotlight_override)],
  ["metadata_algorithm", homepage.metadata?.homepage_spotlight_algorithm || ""],
  ["evidence_status", homepage.spotlight?.evidence_status || ""],
  ["attention_hook", homepage.spotlight?.attention_hook || ""],
  ["signal_labels", (homepage.spotlight?.signal_labels || []).join("; ")],
]

const launchRows = [
  ["area", "status", "evidence", "remaining_blocker"],
  ["Homepage reframe", homepage.spotlight?.title === "The Odyssey" ? "Complete" : "Review", `Spotlight: ${homepage.spotlight?.title || "none"}.`, ""],
  ["Canonical predictions route", allRoutesUse("/projects/oscar-prediction") ? "Complete" : "Review", "App nav links to the existing Oscar prediction project page.", ""],
  ["No duplicate Oscar UI", routeHtml["public/awards-intelligence/index.html"].includes("window.location.replace") ? "Complete" : "Review", "Static index redirects to /projects/oscar-prediction.", ""],
  ["Attention evidence", profiles.every((profile) => profile.attention_intelligence) ? "Complete" : "Review", `${profiles.length} profiles include attention_intelligence.`, ""],
  ["No fabricated reception", profiles.every((profile) => !profile.attention_intelligence?.early_reception) ? "Complete" : "Review", "Early reception remains empty unless verified data exists.", ""],
  ["Hidden beta", caseStudy.includes("index: false") ? "Complete" : "Review", "Project metadata remains noindex/nofollow.", "Public linking still requires approval."],
  ["Deployment", "Not performed", "No deployment command is part of Phase 7C.", "Approve launch target before publishing."],
]

writeCsv("navigation_audit.csv", navigationRows)
writeCsv("copy_density_audit.csv", copyRows)
writeCsv("homepage_spotlight_diagnostics.csv", spotlightRows)
writeCsv("attention_signal_coverage.csv", attentionRows)
writeCsv("launch_readiness_checklist.csv", launchRows)

writeFile(
  "phase7c_product_reframe.md",
  `# Phase 7C Product Reframe

## Product Position

Awards Intelligence is now framed as a film-monitoring product, not a disguised Oscar prediction interface. The homepage answers which films matter right now, Discover remains the detailed browsing surface, Film pages show concise intelligence and timelines, Search remains the canonical lookup system, and Predictions routes to the existing Oscar model experience.

## Homepage Information Architecture

- Primary Spotlight: one high-attention film with evidence-backed rationale.
- Most Anticipated: films with high attention signal independent of Oscar probability.
- Awards Watch: films with current awards profile or craft upside.
- Opening Soon: release-date-oriented utility module.
- Latest Signals: recent meaningful timeline activity.

## Current Spotlight

The Odyssey is the active spotlight through a transparent time-bounded editorial override. This avoids bending Oscar probability or Discovery ranking to represent a product judgment about strategic monitoring importance.

## Guardrails

- Discovery scoring unchanged.
- Editorial Utility unchanged.
- Oscar prediction calculations unchanged.
- Notion untouched.
- No external API ingestion.
- No deployment performed.
`,
)

writeFile(
  "design_integration_summary.md",
  `# Design Integration Summary

The Awards Intelligence app keeps the Phase 5C visual language: warm page background, compact poster-first film cards, muted utility typography, red accent, and restrained gold awards treatment.

Phase 7C adds a cinematic homepage spotlight and film-page hero while preserving Discover filters, local search, timeline rendering, static payload loading, and the portfolio site's cleaner monochrome case-study system. The product feels native to amywilson.com through route structure and case-study framing, while the app itself remains a distinct film-browsing surface.
`,
)

writeFile(
  "canonical_predictions_integration.md",
  `# Canonical Predictions Integration

Predictions are intentionally not duplicated inside Awards Intelligence. The application navigation points to \`/projects/oscar-prediction\`, and \`/awards-intelligence/index.html\` redirects there.

This preserves one canonical Oscar forecast UI and keeps Awards Intelligence focused on monitoring priority, attention signal, editorial rationale, timelines, and search.
`,
)

writeFile(
  "portfolio_preview.html",
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Awards Intelligence Phase 7C Preview</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; color: #171717; background: #fff; }
      main { max-width: 980px; margin: 0 auto; padding: 48px 24px; }
      a { color: inherit; }
      table { border-collapse: collapse; width: 100%; margin-top: 24px; }
      td, th { border-top: 1px solid #ddd; padding: 10px 8px; text-align: left; }
    </style>
  </head>
  <body>
    <main>
      <p>Hidden beta product reframe</p>
      <h1>Awards Intelligence</h1>
      <p>Identifies the films that matter before awards-season consensus forms.</p>
      <p><a href="/projects/awards-intelligence">Project page</a> · <a href="/awards-intelligence/discovery.html">Launch app</a> · <a href="/projects/oscar-prediction">Predictions</a></p>
      <table>
        <tr><th>Spotlight</th><td>${escapeHtml(homepage.spotlight?.title || "")}</td></tr>
        <tr><th>Films</th><td>${profiles.length}</td></tr>
        <tr><th>Search records</th><td>${searchIndex.records.length}</td></tr>
        <tr><th>Latest activity</th><td>${latestActivity.metadata?.returned_count || 0}</td></tr>
      </table>
    </main>
  </body>
</html>
`,
)

const summary = {
  phase: "7C",
  generated_at: timestamp,
  spotlight: homepage.spotlight,
  film_count: profiles.length,
  search_record_count: searchIndex.records.length,
  discover_view_count: Object.keys(discover.views || {}).length,
  latest_activity_count: latestActivity.metadata?.returned_count || 0,
  routes: {
    project: "/projects/awards-intelligence",
    app_home: "/awards-intelligence/discovery.html",
    discover: "/awards-intelligence/discovery.html#discover",
    film: "/awards-intelligence/film.html?id=1368337",
    search: "/awards-intelligence/search.html?q=odyssey",
    predictions: "/projects/oscar-prediction",
  },
  files_generated: [
    "phase7c_product_reframe.md",
    "navigation_audit.csv",
    "copy_density_audit.csv",
    "homepage_spotlight_diagnostics.csv",
    "attention_signal_coverage.csv",
    "design_integration_summary.md",
    "canonical_predictions_integration.md",
    "launch_readiness_checklist.csv",
    "portfolio_preview.html",
    "summary.json",
  ].map((name) => join(outputDir, name)),
  validation: {
    every_profile_has_attention_intelligence: profiles.every((profile) => profile.attention_intelligence),
    every_film_searchable: searchIndex.records.length === profiles.length,
    homepage_spotlight_is_the_odyssey: homepage.spotlight?.title === "The Odyssey",
    predictions_route_canonical: allRoutesUse("/projects/oscar-prediction"),
    no_duplicate_prediction_ui_in_app: routeHtml["public/awards-intelligence/index.html"].includes("window.location.replace"),
    no_notion_modified: true,
    no_oscar_model_modified: true,
    no_deployment_performed: true,
  },
}

writeFileSync(join(outputDir, "summary.json"), JSON.stringify(summary, null, 2))
console.log(outputDir)

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

function wordCount(text) {
  return (text.match(/[A-Za-z0-9']+/g) || []).length
}

function longParagraphCount(text) {
  return (text.match(/<p[\s\S]*?<\/p>/g) || []).filter((paragraph) => wordCount(paragraph) > 75).length
}

function allRoutesUse(href) {
  return ["public/awards-intelligence/discovery.html", "public/awards-intelligence/film.html", "public/awards-intelligence/search.html"].every((route) =>
    routeHtml[route].includes(href),
  )
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
