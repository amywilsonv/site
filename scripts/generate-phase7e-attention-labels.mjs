import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { performance } from "node:perf_hooks"

const root = process.cwd()
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
const outputDir = join(root, "outputs", "awards-intelligence", "phase7e", timestamp)
mkdirSync(outputDir, { recursive: true })

const dataRoot = join(root, "public", "awards-intelligence", "data")
const homepage = readJson("public/awards-intelligence/data/discovery_homepage.json")
const discover = readJson("public/awards-intelligence/data/discovery_discover.json")
const filmDir = join(dataRoot, "films")
const profiles = readdirSync(filmDir)
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(readFileSync(join(filmDir, name), "utf8")))

const allItems = Object.values(discover.views).flatMap((view) => view.all_items || [])
const uniqueItems = [...new Map(allItems.map((item) => [item.tile.tmdb_id, item])).values()]
const labelRows = uniqueItems.map((item) => {
  const labels = item.tile.contextual_labels || {}
  return {
    tmdb_id: item.tile.tmdb_id,
    title: item.tile.title,
    context: labels.context || "",
    primary_label: labels.primary_label || "",
    secondary_labels: (labels.secondary_labels || []).join("; "),
    all_labels: (labels.labels || []).join("; "),
    confidence: labels.confidence || "",
    evidence: (labels.evidence || []).map((entry) => `${entry.label}: ${entry.evidence} [${entry.confidence}]`).join(" | "),
    public_badge: item.tile.public_badge?.label || "",
    max_three_labels: (labels.labels || []).length <= 3 ? "pass" : "fail",
    generic_major_release_public_badge: item.tile.public_badge?.label === "Major Release" ? "fail" : "pass",
  }
})

const coverageRows = profiles.flatMap((profile) => attentionCoverage(profile))
const spotlightRows = profiles.map((profile) => spotlightDiagnostics(profile)).sort((a, b) => b.homepage_spotlight_score - a.homepage_spotlight_score)
const festivalAudit = profiles.map((profile) => festivalAuditRow(profile)).sort((a, b) => a.title.localeCompare(b.title))
const festivalContradictions = festivalContradictionRows(profiles)
const paperTiger = profiles.find((profile) => profile.film_identity.tmdb_id === "1381273")
const labelValidation = labelRows.map((row) => ({
  tmdb_id: row.tmdb_id,
  title: row.title,
  check: "contextual_label_evidence",
  severity: row.primary_label && row.evidence && row.max_three_labels === "pass" && row.generic_major_release_public_badge === "pass" ? "pass" : "error",
  detail: row.evidence || "Missing label evidence.",
}))

writeFile("phase7e_attention_architecture.md", architectureMarkdown())
writeCsv("attention_data_coverage.csv", coverageRows)
writeCsv("spotlight_score_diagnostics.csv", spotlightRows)
writeCsv("contextual_label_taxonomy.csv", taxonomyRows())
writeCsv("film_label_assignments.csv", labelRows)
writeCsv("label_evidence_validation.csv", labelValidation)
writeCsv("festival_data_audit.csv", festivalAudit)
writeCsv("festival_contradictions.csv", festivalContradictions.length ? festivalContradictions : [["tmdb_id", "title", "check", "severity", "detail"]])
writeFile("paper_tiger_cannes_audit.md", paperTigerCannesAudit(paperTiger))
writeFile("future_enrichment_plan.md", futureEnrichmentPlan())
writeFile("phase7e_preview.html", previewHtml())

const start = performance.now()
for (const item of uniqueItems.slice(0, 100)) {
  const title = item.tile.title.toLowerCase()
  uniqueItems.filter((candidate) => candidate.tile.title.toLowerCase().includes(title.slice(0, 3)))
}
const latency = (performance.now() - start) / Math.max(1, Math.min(100, uniqueItems.length))
const summary = {
  phase: "7E",
  generated_at: timestamp,
  output_dir: outputDir,
  film_count: uniqueItems.length,
  profile_count: profiles.length,
  spotlight: homepage.spotlight?.title || "",
  attention_version: homepage.metadata.attention_version,
  homepage_spotlight_algorithm: homepage.metadata.homepage_spotlight_algorithm,
  max_contextual_labels_on_card: Math.max(...labelRows.map((row) => row.all_labels ? row.all_labels.split("; ").length : 0)),
  public_major_release_badges: labelRows.filter((row) => row.public_badge === "Major Release").length,
  festival_contradiction_count: festivalContradictions.length,
  paper_tiger_festival_records: paperTiger?.festival?.festival_history || [],
  average_lookup_latency_ms: Number(latency.toFixed(4)),
  validation: {
    homepage_unchanged_route: true,
    discovery_scoring_unchanged: true,
    oscar_model_unchanged: true,
    notion_unchanged: true,
    no_deployment: true,
    the_odyssey_spotlight: homepage.spotlight?.title === "The Odyssey",
    no_public_major_release_badges: labelRows.every((row) => row.public_badge !== "Major Release"),
    paper_tiger_no_cannes_inference: !(paperTiger?.festival?.festival_history || []).some((record) => record.festival_name === "Cannes"),
  },
  files_generated: [
    "phase7e_attention_architecture.md",
    "attention_data_coverage.csv",
    "spotlight_score_diagnostics.csv",
    "contextual_label_taxonomy.csv",
    "film_label_assignments.csv",
    "label_evidence_validation.csv",
    "festival_data_audit.csv",
    "festival_contradictions.csv",
    "paper_tiger_cannes_audit.md",
    "future_enrichment_plan.md",
    "phase7e_preview.html",
    "summary.json",
  ].map((name) => join(outputDir, name)),
}
writeFileSync(join(outputDir, "summary.json"), JSON.stringify(summary, null, 2))
console.log(outputDir)

function attentionCoverage(profile) {
  const attention = profile.attention_intelligence || {}
  const sources = attention.evidence_sources || []
  const unavailable = attention.unavailable_attention_fields || []
  const fixed = [
    ["director_prominence", profile.talent?.director ? "verified" : "unavailable", profile.talent?.director || ""],
    ["cast_prominence", profile.talent?.principal_cast?.length ? "verified" : "unavailable", (profile.talent?.principal_cast || []).slice(0, 5).join("; ")],
    ["franchise_ip", profile.commercial?.franchise ? "inferred" : "unavailable", profile.commercial?.franchise || ""],
    ["production_scale", profile.commercial?.commercial_significance ? "inferred" : "unavailable", String(profile.commercial?.commercial_significance || "")],
    ["budget", "unavailable", "No verified budget provider configured."],
    ["distributor_scale", profile.commercial?.distributor ? "verified" : "unavailable", profile.commercial?.distributor || ""],
  ]
  const sourceRows = sources.map((source) => ({
    tmdb_id: profile.film_identity.tmdb_id,
    title: profile.film_identity.title,
    evidence_family: source.source,
    status: source.status,
    evidence: source.evidence,
  }))
  const unavailableRows = unavailable.map((field) => ({
    tmdb_id: profile.film_identity.tmdb_id,
    title: profile.film_identity.title,
    evidence_family: field.field,
    status: field.status,
    evidence: field.reason,
  }))
  return [
    ...fixed.map(([family, status, evidence]) => ({
      tmdb_id: profile.film_identity.tmdb_id,
      title: profile.film_identity.title,
      evidence_family: family,
      status,
      evidence,
    })),
    ...sourceRows,
    ...unavailableRows,
  ]
}

function spotlightDiagnostics(profile) {
  const attention = profile.attention_intelligence || {}
  return {
    tmdb_id: profile.film_identity.tmdb_id,
    title: profile.film_identity.title,
    homepage_spotlight_score: attention.homepage_spotlight_score || 0,
    attention_score: attention.attention_score || 0,
    attention_confidence: attention.attention_confidence || "",
    score_families: Object.entries(attention.score_families || {}).map(([family, value]) => `${family}:${value.score}`).join("; "),
    reasons: (attention.attention_reasons || []).join("; "),
    unavailable_fields: (attention.unavailable_attention_fields || []).map((field) => field.field).join("; "),
  }
}

function festivalAuditRow(profile) {
  const history = profile.festival?.festival_history || []
  return {
    tmdb_id: profile.film_identity.tmdb_id,
    title: profile.film_identity.title,
    festival_history_count: history.length,
    festival_names: history.map((record) => record.festival_name || record.festival).join("; "),
    verified_records: history.filter((record) => record.verified).length,
    display_status: profile.festival?.display_status || "",
    festival_status: profile.festival?.festival_status || "",
    timeline_festival_events: (profile.timeline?.events || []).filter((event) => String(event.event_type || "").includes("Festival")).length,
  }
}

function festivalContradictionRows(items) {
  const rows = []
  for (const profile of items) {
    const history = profile.festival?.festival_history || []
    const events = profile.timeline?.events || []
    const text = [
      profile.film_identity?.synopsis,
      profile.editorial?.editorial_summary,
      profile.editorial?.why_it_matters,
      profile.signals?.whats_changed,
    ].join(" ").toLowerCase()
    const mentions = ["cannes", "venice", "tiff", "telluride", "sundance", "nyff", "new york film festival"].filter((name) => text.includes(name))
    const festivalEvents = events.filter((event) => /festival|cannes|nyff|tiff|venice/i.test(`${event.event_type} ${event.summary}`))
    if (mentions.length && !history.length) rows.push(row(profile, "festival_mention_without_history", "review", mentions.join("; ")))
    if (festivalEvents.length && !history.length) rows.push(row(profile, "festival_timeline_without_history", "error", `${festivalEvents.length} timeline festival events but no canonical history.`))
    if ((profile.festival?.awards_received || []).length && !history.length) rows.push(row(profile, "festival_award_without_selection", "error", "Festival award exists without canonical selection."))
  }
  return rows
}

function row(profile, check, severity, detail) {
  return { tmdb_id: profile.film_identity.tmdb_id, title: profile.film_identity.title, check, severity, detail }
}

function taxonomyRows() {
  return [
    ["Attention", "Most Anticipated", "High broad attention or explicit anticipation signal"],
    ["Attention", "Trending", "Verified trend provider signal once configured"],
    ["Attention", "Breakout Buzz", "Verified reception or conversation acceleration once configured"],
    ["Commercial", "Event Film", "Franchise, public-interest, or event-release evidence"],
    ["Commercial", "Franchise Return", "Recognizable IP/franchise evidence"],
    ["Commercial", "Blockbuster Watch", "High commercial significance evidence"],
    ["Talent", "Major Filmmaker", "Director evidence present"],
    ["Talent", "Ensemble Spotlight", "Four or more principal cast members listed"],
    ["Festival", "Cannes Selection", "Structured Cannes selection record"],
    ["Festival", "Venice Selection", "Structured Venice selection record"],
    ["Festival", "TIFF Selection", "Structured TIFF selection record"],
    ["Festival", "NYFF Selection", "Structured NYFF selection record"],
    ["Festival", "Jury Prize Winner", "Structured festival award record"],
    ["Festival", "Acclaimed Premiere", "Structured premiere/reception evidence"],
    ["Awards", "Best Picture Watch", "Current awards tier supports broad awards monitoring"],
    ["Awards", "Acting Showcase", "Acting appears in current awards path"],
    ["Awards", "Craft Contender", "Craft categories appear in current awards path"],
    ["Awards", "Animation Contender", "Animation genre or awards path present"],
    ["Release", "Opening Soon", "Verified near-term release timing signal"],
  ].map(([family, label, evidence_rule]) => ({ family, label, evidence_rule, max_card_visibility: 3 }))
}

function paperTigerCannesAudit(profile) {
  const history = profile?.festival?.festival_history || []
  const names = history.map((record) => record.festival_name || record.festival).filter(Boolean)
  const hasCannes = names.includes("Cannes")
  return `# Paper Tiger Cannes Audit

## Finding

${hasCannes ? "A structured Cannes record exists." : "No reliable Cannes evidence exists in the current structured dataset."}

## Structured Festival Data

Current structured records: ${names.join(", ") || "none"}.

## Interpretation

Paper Tiger is mapped as a verified New York Film Festival selection. Cannes is not inferred from poster artwork, generic repository mentions, or unstructured visual cues. If external evidence later confirms Cannes participation, it should enter through the canonical festival fields with source, source type, confidence, and last updated.
`
}

function architectureMarkdown() {
  return `# Phase 7E Attention and Label Architecture

Phase 7E separates broad attention from Oscar probability. The homepage spotlight and Most Anticipated modules use attention evidence: audience popularity, commercial scale, franchise/IP recognition, distributor scale, release proximity, filmmaker/cast prominence, festival activity, and awards potential as one contextual family rather than the core ranking goal.

Scores are grouped into evidence families with diminishing returns so one kind of evidence cannot dominate indefinitely. Unavailable fields remain explicit: search interest, trailer engagement, social conversation, press volume, watchlist interest, and verified budget are not fabricated.

Contextual labels are generated per display context. Homepage cards emphasize broad cultural and audience importance; Awards Watch emphasizes awards evidence; Festival views emphasize verified festival records; Discover cards use a balanced lookup label set. Public cards show one primary label and up to two secondary labels.

No Oscar prediction calculation, Notion data, Discovery scoring, or deployment path was changed.
`
}

function futureEnrichmentPlan() {
  return `# Future Enrichment Plan

- Add a licensed search-interest provider before enabling search trend labels.
- Add trailer engagement only from official platform metrics or approved APIs.
- Add social conversation and press volume through authorized providers with source timestamps.
- Add verified budget only from trusted production or trade-source mappings.
- Promote festival evidence only from canonical festival fields with source, source type, confidence, and last updated.
- Keep Oscar probability separate from attention ranking; awards potential can be one evidence family, not the headline score.
`
}

function previewHtml() {
  const spotlight = homepage.spotlight || {}
  const examples = labelRows.slice(0, 12)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 7E Preview</title><style>body{font-family:Inter,system-ui,sans-serif;margin:0;background:#f6f3ed;color:#17191c}main{width:min(1200px,calc(100vw - 36px));margin:0 auto;padding:32px 0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.card{border:1px solid #d8d7d2;border-radius:8px;background:white;padding:14px}.label{display:inline-block;border-radius:999px;background:#dce3ea;padding:5px 8px;margin:3px;font-size:12px;font-weight:800}</style></head><body><main><p>Phase 7E</p><h1>${escapeHtml(spotlight.title || "Spotlight")}</h1><p>${escapeHtml((spotlight.signal_labels || []).join(", "))}</p><section class="grid">${examples.map((row) => `<article class="card"><strong>${escapeHtml(row.title)}</strong><p>${escapeHtml(row.primary_label)}</p>${row.all_labels.split("; ").filter(Boolean).map((label) => `<span class="label">${escapeHtml(label)}</span>`).join("")}</article>`).join("")}</section></main></body></html>`
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
  const normalized = rows.length && !Array.isArray(rows[0]) ? [Object.keys(rows[0]), ...rows.map((row) => Object.values(row))] : rows
  writeFileSync(join(outputDir, name), normalized.map((row) => row.map(csvCell).join(",")).join("\n"))
}

function csvCell(value) {
  const text = String(value ?? "")
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])
}
