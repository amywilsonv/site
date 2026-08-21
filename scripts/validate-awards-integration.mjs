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

const searchRecords = searchIndex.records || []
const allDiscoverItems = discoverPayload.views?.all?.all_items || []
const searchIds = searchRecords.map((record) => record.id).filter(Boolean)
const discoverIds = allDiscoverItems.map(publicItemId).filter(Boolean)
const searchIdSet = new Set(searchIds)
const discoverIdSet = new Set(discoverIds)

if (!searchRecords.length) {
  failures.push("Search index should contain generated film records.")
}

if (!allDiscoverItems.length) {
  failures.push("Discover should contain generated film records.")
}

assertMetadataCount(searchIndex.metadata, "Search index", searchRecords.length)
assertMetadataCount(discoverPayload.metadata, "Discover", allDiscoverItems.length)
assertMetadataCount(homepagePayload.metadata, "Homepage", allDiscoverItems.length)

if (searchRecords.length !== allDiscoverItems.length) {
  failures.push(`Search/Discover film counts should agree, found ${searchRecords.length} search records and ${allDiscoverItems.length} Discover items.`)
}

const duplicateSearchIds = duplicateValues(searchIds)
if (duplicateSearchIds.length) {
  failures.push(`Search index contains duplicate IDs: ${duplicateSearchIds.slice(0, 10).join(", ")}.`)
}

const duplicateDiscoverIds = duplicateValues(discoverIds)
if (duplicateDiscoverIds.length) {
  failures.push(`Discover contains duplicate IDs: ${duplicateDiscoverIds.slice(0, 10).join(", ")}.`)
}

const discoverMissingSearch = discoverIds.filter((id) => !searchIdSet.has(id))
if (discoverMissingSearch.length) {
  failures.push(`Discover items missing from search index: ${discoverMissingSearch.slice(0, 10).join(", ")}.`)
}

const searchMissingDiscover = searchIds.filter((id) => !discoverIdSet.has(id))
if (searchMissingDiscover.length) {
  failures.push(`Search records missing from Discover: ${searchMissingDiscover.slice(0, 10).join(", ")}.`)
}

const missingProfilePayloads = allDiscoverItems
  .map((item) => item.detail?.profile_payload_url || item.tile?.profile_payload_url)
  .filter(Boolean)
  .filter((profilePath) => !existsSync(join(root, "public/awards-intelligence", profilePath)))
if (missingProfilePayloads.length) {
  failures.push(`Discover profile payloads are missing: ${missingProfilePayloads.slice(0, 10).join(", ")}.`)
}

const homepageHero = homepagePayload.homepage_hero || homepagePayload.spotlight
if (!heroTitle(homepageHero) || !publicItemId(homepageHero)) {
  failures.push("Homepage hero/spotlight should expose title and public identity.")
}

if (!heroProfileUrl(homepageHero) || !heroReleaseDisplay(homepageHero)) {
  failures.push("Homepage hero/spotlight should expose profile URL and release display.")
}

if (!hasHeroSelectionContext(homepageHero, homepagePayload.metadata)) {
  failures.push("Homepage hero/spotlight should expose selection context using the current generated schema.")
}

if (!homepagePayload.metadata?.homepage_importance_contract && !homepagePayload.metadata?.homepage_spotlight_algorithm) {
  failures.push("Expected homepage importance or spotlight algorithm metadata.")
}

if (!Array.isArray(homepagePayload.metadata?.homepage_rebalance_rules) && !homepagePayload.metadata?.now_in_focus_selection) {
  failures.push("Expected homepage rebalance rules or Now in Focus selection metadata.")
}

const homepageItems = homepagePayload.new_notable || homepagePayload.screening_room || []
const homepageFestivalOnly = homepageItems.filter(isFestivalOnlyHomepageItem)
const homepageMajorReleaseCount = homepageItems.filter((item) => hasHomepageLabel(item, /major release|franchise|event film|event release|blockbuster|major filmmaker/i)).length
const homepageTopAwardCount = homepageItems.filter(hasAwardsHomepageSignal).length
const awardsWatchCount = (homepagePayload.awards_watch || []).filter(hasAwardsHomepageSignal).length
const homepageCollectionItems = homepageCollections(homepagePayload)
const homepageMissingDiscover = homepageCollectionItems.map(publicItemId).filter((id) => id && !discoverIdSet.has(id))

if (homepageMissingDiscover.length) {
  failures.push(`Homepage collection items missing from Discover: ${homepageMissingDiscover.slice(0, 10).join(", ")}.`)
}

if (homepageFestivalOnly.length > 2) {
  failures.push(`Expected at most 2 festival-only homepage picks, found ${homepageFestivalOnly.length}.`)
}

if (homepageMajorReleaseCount < 3) {
  failures.push(`Expected major current films represented on homepage, found ${homepageMajorReleaseCount} major-release picks.`)
}

if (homepageTopAwardCount < 1 && awardsWatchCount < 1) {
  failures.push("Expected Awards Intelligence films represented on homepage or Awards Watch.")
}

if (homepagePayload.metadata?.identity_key && homepagePayload.metadata.identity_key !== "profile_id") {
  failures.push(`Expected profile_id identity contract, found ${homepagePayload.metadata?.identity_key || "none"}.`)
}

if (!("homepage_feature_override" in (homepagePayload.metadata || {})) && !("homepage_spotlight_override" in (homepagePayload.metadata || {}))) {
  failures.push("Expected transparent homepage feature/spotlight override metadata.")
}

if (!homepagePayload.metadata?.source && !homepagePayload.metadata?.source_data_date && !homepagePayload.metadata?.discovery_algorithm_version) {
  failures.push("Expected homepage source metadata.")
}

const tmdbLessItems = allDiscoverItems.filter((item) => !item.tile?.tmdb_id && !item.detail?.tmdb_id)
if (!tmdbLessItems.length && searchRecords.some((record) => !record.tmdb_id && !record.id)) {
  failures.push("TMDb-less records should expose canonical IDs.")
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

if (!paperFestivalNames.length) {
  failures.push("Paper Tiger should preserve verified festival history.")
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

function assertMetadataCount(metadata, label, expected) {
  const count = Number(metadata?.film_count)
  if (!Number.isFinite(count)) {
    failures.push(`${label} should expose film_count metadata.`)
    return
  }
  if (count !== expected) {
    failures.push(`${label} film_count metadata should match generated records, found ${count} metadata count and ${expected} records.`)
  }
}

function duplicateValues(values) {
  const seen = new Set()
  const duplicates = new Set()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

function publicItemId(item) {
  return String(
    item?.tile?.profile_id ||
      item?.tile?.id ||
      item?.detail?.profile_id ||
      item?.detail?.id ||
      item?.tile?.canonical_film_id ||
      item?.detail?.canonical_film_id ||
      item?.tile?.tmdb_id ||
      item?.detail?.tmdb_id ||
      item?.profile_id ||
      item?.canonical_film_id ||
      item?.tmdb_id ||
      item?.id ||
      "",
  ).trim()
}

function heroTitle(hero) {
  return hero?.title || hero?.tile?.title || hero?.detail?.title || ""
}

function heroProfileUrl(hero) {
  return hero?.profile_url || hero?.tile?.profile_url || hero?.detail?.profile_url || ""
}

function heroReleaseDisplay(hero) {
  return hero?.release_display || hero?.tile?.release_display || hero?.detail?.release_display || ""
}

function hasHeroSelectionContext(hero, metadata) {
  return Boolean(
    Array.isArray(hero?.selection_reasons) ||
      hero?.attention_hook ||
      hero?.detail?.attention_intelligence ||
      metadata?.now_in_focus_selection ||
      metadata?.homepage_spotlight_algorithm,
  )
}

function homepageCollections(payload) {
  return Object.entries(payload)
    .filter(([key, value]) => key !== "latest_signals" && Array.isArray(value))
    .flatMap(([, value]) => value)
}

function hasAwardsHomepageSignal(item) {
  const rank = Number(item.tile?.awards_intelligence?.best_picture_rank || item.detail?.awards_intelligence?.best_picture_rank || Infinity)
  if (Number.isFinite(rank) && rank <= 4) return true
  const values = [
    item.tile?.awards_tier,
    item.detail?.awards_tier,
    item.detail?.awards_outlook?.current_awards_tier,
    item.detail?.awards_profile,
    ...(item.detail?.awards_path || []),
    ...(item.detail?.awards_evidence || []),
    ...(item.tile?.contextual_labels?.labels || []),
    ...(item.detail?.contextual_labels?.labels || []),
  ]
  return values.some((value) => /award|contender|craft|director|acting|screenplay|picture|festival watch/i.test(String(value || "")))
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
