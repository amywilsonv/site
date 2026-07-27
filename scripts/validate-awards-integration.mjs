import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

const requiredFiles = [
  "src/app/projects/awards-intelligence/page.tsx",
  "public/awards-intelligence/discovery.html",
  "public/awards-intelligence/film.html",
  "public/awards-intelligence/search.html",
  "public/awards-intelligence/data/discovery_homepage.json",
  "public/awards-intelligence/data/discovery_discover.json",
  "public/awards-intelligence/data/search_index.json",
  "public/awards-intelligence/data/latest_activity.json",
  "public/awards-intelligence/awards-intelligence.svg",
]

const failures = []

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    failures.push(`Missing required file: ${file}`)
  }
}

const projectPage = read("src/app/projects/awards-intelligence/page.tsx")
const projectsIndex = read("src/app/projects/page.tsx")
const homepage = read("src/app/page.tsx")
const discoveryHtml = read("public/awards-intelligence/discovery.html")
const filmHtml = read("public/awards-intelligence/film.html")
const searchHtml = read("public/awards-intelligence/search.html")
const discoveryJs = read("public/awards-intelligence/discovery-app.js")
const searchIndex = JSON.parse(read("public/awards-intelligence/data/search_index.json"))
const homepagePayload = JSON.parse(read("public/awards-intelligence/data/discovery_homepage.json"))
const discoverPayload = JSON.parse(read("public/awards-intelligence/data/discovery_discover.json"))
const paperTigerProfile = JSON.parse(read("public/awards-intelligence/data/films/1381273.json"))

assertIncludes(projectPage, "robots", "Project page should define hidden-beta robots metadata.")
assertIncludes(projectPage, "index: false", "Project page should be noindex while in hidden beta.")
assertIncludes(projectPage, "/awards-intelligence/discovery.html", "Project page should launch the mounted static app.")
assertIncludes(projectPage, "awards_intelligence_launch_clicked", "Project page should expose provider-neutral CTA analytics.")
assertIncludes(projectsIndex, "/projects/awards-intelligence", "Projects index should link to Awards Intelligence.")
assertIncludes(homepage, "/projects/awards-intelligence", "Homepage selected work should link to Awards Intelligence.")

for (const [name, html] of [
  ["discovery", discoveryHtml],
  ["film", filmHtml],
  ["search", searchHtml],
]) {
  assertIncludes(html, "The Screening Room", `${name} route should use The Screening Room product name.`)
  assertIncludes(html, "Festival Radar", `${name} route should expose Festival Radar navigation.`)
  assertIncludes(html, "Awards Intelligence", `${name} route should expose Awards Intelligence as a destination.`)
  assertIncludes(html, "awards-intelligence.svg", `${name} route should use the product favicon.`)
  assertIncludes(html, "analytics.js", `${name} route should keep analytics hooks.`)
  assertIncludes(html, "seo.js", `${name} route should keep SEO hooks.`)
  if (html.includes("Oscar Model")) {
    failures.push(`${name} route should not expose the old Oscar Model nav label.`)
  }
  if (html.includes(">Predictions<")) {
    failures.push(`${name} route should not expose Predictions in the primary app navigation.`)
  }
  const primaryNav = html.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/)?.[0] || ""
  if (primaryNav.includes("Built by Amy Wilson")) {
    failures.push(`${name} route should not expose Built by Amy Wilson in primary navigation.`)
  }
}

assertIncludes(discoveryHtml, "data-about-open", "Discovery route should expose the About experience.")
assertIncludes(discoveryHtml, "Films worth following.", "Homepage should use the restrained masthead tagline.")
assertIncludes(discoveryJs, "Now in Focus", "Homepage should render the Now in Focus feature.")
assertIncludes(discoveryJs, "Coming Soon", "Homepage should render Coming Soon.")
assertIncludes(discoveryJs, "Festival Radar", "Homepage should render Festival Radar preview.")
assertIncludes(discoveryJs, "What Changed", "Homepage should render the update feed.")
assertIncludes(discoveryJs, "spotlight_viewed", "Discovery route should track spotlight views.")
assertIncludes(discoveryJs, "collection_viewed", "Discovery route should track homepage collection views.")
assertIncludes(read("public/awards-intelligence/discovery.css"), "now-focus", "Homepage should use the V2 Now in Focus feature.")
assertIncludes(read("public/awards-intelligence/discovery.css"), "coming-soon-section", "Coming Soon should include restrained film-strip styling.")

for (const removed of [
  "Know which films matter before consensus forms.",
  "Movie Discovery + Awards Intelligence",
  "What Awards Intelligence tracks",
  "Audience Attention",
  "Release Momentum",
  "Festival Activity",
  "Awards Potential",
]) {
  if (discoveryJs.includes(removed) || discoveryHtml.includes(removed)) {
    failures.push(`Homepage V2 should not include removed copy: ${removed}`)
  }
}

if (!read("public/awards-intelligence/discovery.css").includes('body[data-route="home"] .quick-search')) {
  failures.push("Homepage should hide the quick search field while keeping Discover search available.")
}

if (searchIndex.records.length !== 104) {
  failures.push(`Expected 104 search records, found ${searchIndex.records.length}.`)
}

if (homepagePayload.screening_room.length !== 6) {
  failures.push(`Expected unchanged 6-film Screening Room, found ${homepagePayload.screening_room.length}.`)
}

if (homepagePayload.spotlight?.title !== "The Odyssey") {
  failures.push(`Expected The Odyssey homepage spotlight, found ${homepagePayload.spotlight?.title || "none"}.`)
}

if (!homepagePayload.metadata?.homepage_spotlight_override) {
  failures.push("Expected transparent homepage spotlight override metadata.")
}

if (homepagePayload.metadata?.attention_version !== "phase7e_attention_v1") {
  failures.push(`Expected Phase 7E attention version, found ${homepagePayload.metadata?.attention_version || "none"}.`)
}

const allDiscoverItems = Object.values(discoverPayload.views).flatMap((view) => view.all_items || [])
const publicMajorBadges = allDiscoverItems.filter((item) => item.tile?.public_badge?.label === "Major Release")
if (publicMajorBadges.length) {
  failures.push(`Expected no public Major Release badges, found ${publicMajorBadges.length}.`)
}

const overLabeledCards = allDiscoverItems.filter((item) => (item.tile?.contextual_labels?.labels || []).length > 3)
if (overLabeledCards.length) {
  failures.push(`Expected max three contextual labels per card, found ${overLabeledCards.length} over-labeled cards.`)
}

if (!discoveryJs.includes("contextualLabels")) {
  failures.push("Discovery route should render contextual label sets.")
}

const paperFestivalNames = (paperTigerProfile.festival?.festival_history || []).map((record) => record.festival_name)
if (!paperFestivalNames.includes("New York Film Festival")) {
  failures.push("Paper Tiger should include verified New York Film Festival metadata.")
}

if (paperFestivalNames.includes("Cannes")) {
  failures.push("Paper Tiger should not infer Cannes festival participation from unstructured evidence.")
}

if (!paperTigerProfile.festival?.display_status?.includes("Verified festival information")) {
  failures.push("Film profiles should expose neutral verified festival display status.")
}

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log("Awards Intelligence portfolio integration checks passed.")

function read(file) {
  return readFileSync(join(root, file), "utf8")
}

function assertIncludes(source, needle, message) {
  if (!source.includes(needle)) {
    failures.push(message)
  }
}
