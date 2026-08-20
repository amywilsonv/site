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

assertIncludes(projectPage, "/screening-room/", "Project page should launch the clean Screening Room route.")
assertIncludes(projectPage, "Launch Screening Room", "Project page should use public launch CTA copy.")
assertIncludes(projectPage, "awards_intelligence_launch_clicked", "Project page should expose provider-neutral CTA analytics.")
assertIncludes(projectsIndex, "/projects/screening-room", "Projects index should link to the Screening Room case study.")
assertIncludes(homepage, "/screening-room", "Homepage selected work should link to the clean Screening Room route.")
assertIncludes(homepage, "/projects/screening-room", "Homepage selected work should link to the Screening Room case study.")

for (const [name, html] of [
  ["discovery", discoveryHtml],
  ["film", filmHtml],
  ["search", searchHtml],
]) {
  assertIncludes(html, "The Screening Room", `${name} route should use The Screening Room product name.`)
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
  if (primaryNav.includes("Festival Radar")) {
    failures.push(`${name} route should not expose Festival Radar as a primary navigation tab.`)
  }
}

assertIncludes(discoveryHtml, 'data-route="about"', "Discovery route should expose About as an in-app navigation tab.")
assertIncludes(discoveryHtml, 'data-route="awards"', "Discovery route should expose Awards Intelligence as a dedicated in-app route.")
assertIncludes(discoveryHtml, "/screening-room/#about", "Discovery route footer should link to the in-app About tab.")
assertIncludes(discoveryJs, 'about: { key: "about"', "Discovery route should support the in-app About route.")
assertIncludes(discoveryJs, 'route: "awards"', "Awards Intelligence should render as a dedicated route, not only a Discover filter.")
assertIncludes(discoveryJs, "Best Picture Forecast", "Awards Intelligence should render the Best Picture forecast landing.")
assertIncludes(discoveryJs, "awards-rank-marker", "Awards Intelligence should use the designed rank/status marker.")
assertIncludes(discoveryJs, "View the full race", "Awards Watch preview should route to the full Awards Intelligence race.")
assertIncludes(discoveryHtml, "Films worth following.", "Homepage should use the restrained masthead tagline.")
assertIncludes(discoveryJs, "Now in Focus", "Homepage should render the Now in Focus feature.")
assertIncludes(discoveryJs, "Coming Soon", "Homepage should render Coming Soon.")
assertIncludes(discoveryJs, "Festival Radar", "Homepage should render Festival Radar preview.")
assertIncludes(discoveryJs, "clean.slice(0, 10)", "Homepage Festival Radar should preview 10 items before View all.")
assertIncludes(discoveryJs, "data-explore=\"festivals\"", "Homepage Festival Radar preview should route to the Discover Festivals filter.")
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
  "#1 AWARDS LEADER",
  "Runtime bucket:",
  "US production metadata present.",
  "raw_nominee_score",
  "nominee_probability",
]) {
  if (discoveryJs.includes(removed) || discoveryHtml.includes(removed)) {
    failures.push(`Homepage V2 should not include removed copy: ${removed}`)
  }
}

if (!read("public/awards-intelligence/discovery.css").includes('body[data-route="home"] .quick-search')) {
  failures.push("Homepage should hide the quick search field while keeping Discover search available.")
}

if (searchIndex.records.length !== 514) {
  failures.push(`Expected 514 search records, found ${searchIndex.records.length}.`)
}

if (discoverPayload.views?.all?.all_items?.length !== 514) {
  failures.push(`Expected 514 active films in Discover, found ${discoverPayload.views?.all?.all_items?.length || 0}.`)
}

if (homepagePayload.screening_room.length !== 8) {
  failures.push(`Expected 8-film Screening Room module, found ${homepagePayload.screening_room.length}.`)
}

if (homepagePayload.homepage_hero?.title !== "The Odyssey") {
  failures.push(`Expected The Odyssey awards-aware homepage hero, found ${homepagePayload.homepage_hero?.title || "none"}.`)
}

if (!homepagePayload.metadata?.homepage_rebalance_version) {
  failures.push("Expected homepage rebalance metadata.")
}

const homepageItems = homepagePayload.new_notable || homepagePayload.screening_room || []
const homepageIds = new Set(homepageItems.map((item) => item.tile?.profile_id || item.tile?.id || item.detail?.profile_id || item.detail?.id).filter(Boolean))
const homepageFestivalOnly = homepageItems.filter(isFestivalOnlyHomepageItem)
const homepageMajorReleaseCount = homepageItems.filter((item) => hasHomepageLabel(item, /major release|franchise|event film|event release|blockbuster|major filmmaker/i)).length
const homepageTopAwardCount = homepageItems.filter((item) => Number(item.tile?.awards_intelligence?.best_picture_rank || item.detail?.awards_intelligence?.best_picture_rank || Infinity) <= 4).length

if (homepageFestivalOnly.length > 2) {
  failures.push(`Expected at most 2 festival-only homepage picks, found ${homepageFestivalOnly.length}.`)
}

if (homepageMajorReleaseCount < 3) {
  failures.push(`Expected major current films represented on homepage, found ${homepageMajorReleaseCount} major-release picks.`)
}

if (homepageTopAwardCount < 3) {
  failures.push(`Expected top Awards Intelligence films represented on homepage, found ${homepageTopAwardCount}.`)
}

if (!homepageIds.has("969681")) {
  failures.push("Expected Spider-Man: Brand New Day to qualify for the rebalanced homepage by generic major-release/awards logic.")
}

if (homepagePayload.metadata?.identity_key !== "profile_id") {
  failures.push(`Expected profile_id identity contract, found ${homepagePayload.metadata?.identity_key || "none"}.`)
}

if (!("homepage_feature_override" in (homepagePayload.metadata || {}))) {
  failures.push("Expected transparent homepage feature override metadata.")
}

if (homepagePayload.metadata?.source !== "canonical_film_discovery_universe_slice61_awards_integration") {
  failures.push(`Expected Slice 61 discovery source, found ${homepagePayload.metadata?.source || "none"}.`)
}

const allDiscoverItems = Object.values(discoverPayload.views).flatMap((view) => view.all_items || [])
const tmdbLessItems = allDiscoverItems.filter((item) => !item.tile?.tmdb_id && !item.detail?.tmdb_id)
if (!tmdbLessItems.length) {
  failures.push("Expected TMDb-less canonical films in Discover.")
}

const allowedAwardsLabels = new Set(["AWARDS LEADER", "STRONG CONTENDER", "CONTENDER", "ON THE BUBBLE", "WATCHLIST"])
const invalidAwardsLabels = allDiscoverItems
  .map((item) => item.tile?.awards_intelligence?.awards_status || item.detail?.awards_intelligence?.awards_status || "")
  .filter((label) => label && !allowedAwardsLabels.has(label))
if (invalidAwardsLabels.length) {
  failures.push(`Unexpected public awards labels: ${[...new Set(invalidAwardsLabels)].join(", ")}.`)
}

if (!discoveryJs.includes("contextualLabels")) {
  failures.push("Discovery route should render contextual label sets.")
}

const paperFestivalNames = (paperTigerProfile.festival?.festival_history || []).map((record) => record.festival_name)
if (!paperFestivalNames.includes("New York Film Festival")) {
  failures.push("Paper Tiger should include verified New York Film Festival metadata.")
}

if (paperFestivalNames.length < 2) {
  failures.push("Paper Tiger should preserve multi-festival history.")
}

if (!paperTigerProfile.festival?.display_status) {
  failures.push("Film profiles should expose festival display status.")
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

function hasHomepageLabel(item, pattern) {
  const values = [
    item.tile?.primary_category,
    item.detail?.primary_category,
    item.tile?.public_badge?.label,
    item.tile?.discover_primary_tag?.label,
    ...(item.tile?.contextual_labels?.labels || []),
    ...(item.detail?.contextual_labels?.labels || []),
  ]
  return values.some((value) => pattern.test(String(value || "")))
}

function isFestivalOnlyHomepageItem(item) {
  const ai = item.tile?.awards_intelligence || item.detail?.awards_intelligence || {}
  const hasFestival = hasHomepageLabel(item, /festival|cannes|venice|tiff|telluride|nyff|sundance/i) || Boolean((item.detail?.festival_history || []).length)
  const major = hasHomepageLabel(item, /major release|franchise|event film|event release|blockbuster|major filmmaker/i)
  return hasFestival && !ai.awards_status && !major
}
