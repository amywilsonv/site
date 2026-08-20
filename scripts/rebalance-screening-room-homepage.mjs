import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const dataRoot = join(root, "public/awards-intelligence/data")
const currentDate = new Date("2026-08-16T00:00:00-07:00")

const homepagePath = join(dataRoot, "discovery_homepage.json")
const discoverPath = join(dataRoot, "discovery_discover.json")
const overridePath = join(root, "data/registry/review/academy_nominee_homepage_feature_override.json")

const homepage = readJson(homepagePath)
const discover = readJson(discoverPath)
const allItems = discover.views?.all?.all_items || []

if (!allItems.length) {
  throw new Error("No Discover items available for homepage rebalance.")
}

const override = readOverride()
const ranked = allItems
  .map((item) => ({ item, score: importanceScore(item, override), id: filmId(item), festivalOnly: isFestivalOnly(item) }))
  .filter((entry) => entry.id)
  .sort((a, b) => b.score - a.score || titleOf(a.item).localeCompare(titleOf(b.item)))

const heroId = filmId({ tile: homepage.homepage_hero || {} })
const curated = chooseBalanced(ranked, {
  excludeIds: new Set([heroId].filter(Boolean)),
  limit: 8,
  maxFestivalOnly: 2,
  targetFestivalOnly: 2,
  maxAwarded: 6,
  minimumScore: 55,
})

const openingSoon = chooseBalanced(
  ranked.filter((entry) => isTimely(entry.item)),
  {
    excludeIds: new Set([heroId, ...curated.map((entry) => entry.id)].filter(Boolean)),
    limit: 12,
    maxFestivalOnly: 3,
    minimumScore: 45,
  },
)

const curatedItems = curated.map((entry) => entry.item)
const openingSoonItems = openingSoon.map((entry) => entry.item)
const spotlight = curatedItems[0] ? spotlightFromItem(curatedItems[0]) : homepage.spotlight

homepage.spotlight = spotlight
homepage.screening_room = curatedItems
homepage.new_notable = curatedItems
homepage.most_anticipated = curatedItems
homepage.opening_soon = openingSoonItems.length ? openingSoonItems : curatedItems
homepage.metadata = {
  ...(homepage.metadata || {}),
  homepage_rebalance_version: "site_homepage_importance_v1",
  homepage_rebalance_generated_at: homepage.metadata?.last_updated || currentDate.toISOString(),
  homepage_rebalance_rules: [
    "Awards Intelligence status and rank receive the strongest boost.",
    "Major release, franchise, event-film, and broad cultural-attention labels boost homepage priority.",
    "Recent and near-future release timing boosts priority.",
    "Poster, backdrop, TMDb/profile metadata, director, cast, and synopsis improve homepage readiness.",
    "Festival-only films are capped unless they also have awards strength, breakout/major labels, timeliness, or override support.",
    "Discover, search, film detail, Awards Watch, and Festival Radar data are not reduced.",
  ],
}

writeFileSync(homepagePath, `${JSON.stringify(homepage, null, 2)}\n`)

console.log(JSON.stringify({
  homepage_hero: homepage.homepage_hero?.title || "",
  spotlight: homepage.spotlight?.title || "",
  new_notable: curatedItems.map((item) => titleOf(item)),
  opening_soon: homepage.opening_soon.map((item) => titleOf(item)),
  discover_count: allItems.length,
  festival_count: discover.views?.festivals?.all_items?.length || 0,
}, null, 2))

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

function readOverride() {
  if (!existsSync(overridePath)) return ""
  try {
    const payload = readJson(overridePath)
    return String(payload.homepage_feature_override || "").trim()
  } catch {
    return ""
  }
}

function chooseBalanced(entries, options) {
  const selected = []
  const seen = new Set(options.excludeIds || [])
  const targetFestivalOnly = Math.min(options.targetFestivalOnly || 0, options.maxFestivalOnly || 0)
  const nonFestivalTarget = Math.max(0, options.limit - targetFestivalOnly)
  let festivalOnlyCount = 0
  let awardedCount = 0

  for (const entry of entries) {
    if (selected.length >= nonFestivalTarget) break
    if (seen.has(entry.id)) continue
    if (entry.festivalOnly) continue
    if (isAwarded(entry.item) && awardedCount >= (options.maxAwarded ?? Infinity)) continue
    if (entry.score < options.minimumScore && selected.length >= Math.ceil(nonFestivalTarget * 0.75)) continue
    selected.push(entry)
    seen.add(entry.id)
    if (isAwarded(entry.item)) awardedCount += 1
  }

  for (const entry of entries) {
    if (selected.length >= options.limit) break
    if (festivalOnlyCount >= targetFestivalOnly) break
    if (seen.has(entry.id) || !entry.festivalOnly) continue
    if (entry.score < options.minimumScore) continue
    selected.push(entry)
    seen.add(entry.id)
    festivalOnlyCount += 1
    if (isAwarded(entry.item)) awardedCount += 1
  }

  for (const entry of entries) {
    if (selected.length >= options.limit) break
    if (seen.has(entry.id)) continue
    if (entry.score < options.minimumScore && selected.length >= Math.ceil(options.limit * 0.75)) continue
    if (entry.festivalOnly && festivalOnlyCount >= options.maxFestivalOnly) continue
    if (isAwarded(entry.item) && awardedCount >= (options.maxAwarded ?? Infinity)) continue
    selected.push(entry)
    seen.add(entry.id)
    if (entry.festivalOnly) festivalOnlyCount += 1
    if (isAwarded(entry.item)) awardedCount += 1
  }

  for (const entry of entries) {
    if (selected.length >= options.limit) break
    if (seen.has(entry.id)) continue
    selected.push(entry)
    seen.add(entry.id)
  }

  return selected
}

function importanceScore(item, override) {
  const tile = item.tile || {}
  const detail = item.detail || {}
  const labels = labelSet(item)
  const ai = tile.awards_intelligence || detail.awards_intelligence || {}
  const festivalHistory = detail.festival_history || []
  const id = filmId(item)
  let score = 0

  if (override && [id, tile.title, detail.title].some((value) => String(value || "").toLowerCase() === override.toLowerCase())) {
    score += 500
  }

  score += awardsScore(ai)

  if (isMajorRelease(item)) score += 42
  if (labels.has("Franchise Return")) score += 22
  if (labels.has("Event Film") || labels.has("Event Release") || labels.has("Cultural Event")) score += 20
  if (labels.has("Blockbuster Watch") || labels.has("Prestige Blockbuster")) score += 18
  if (labels.has("Major Filmmaker") || labels.has("Star-Driven") || labels.has("Ensemble Spotlight")) score += 16
  if (labels.has("Most Anticipated")) score += 14

  score += timelinessScore(tile.release_date, tile.release_timing?.release_timing_key)
  score += completenessScore(item)
  score += festivalScore(festivalHistory, labels)

  if (isFestivalOnly(item)) score -= festivalOnlyPenalty(item)
  if (!tile.poster_url && !detail.poster_url) score -= 18
  if (!detail.backdrop_url && !tile.backdrop_url) score -= 8

  return score
}

function awardsScore(ai) {
  const statusScores = {
    "AWARDS LEADER": 120,
    "STRONG CONTENDER": 95,
    "CONTENDER": 70,
    "ON THE BUBBLE": 45,
    "WATCHLIST": 22,
  }
  let score = statusScores[ai.awards_status] || 0
  if (Number.isFinite(Number(ai.best_picture_rank))) {
    score += Math.max(0, 50 - Number(ai.best_picture_rank) * 4)
  }
  if (ai.public_card_behavior === "optional_watchlist_badge") score += 14
  if (ai.public_card_behavior === "no_public_badge_pending_evidence") score -= 8
  return score
}

function timelinessScore(releaseDate, timingKey) {
  let score = 0
  if (timingKey === "out_now") score += 25
  if (timingKey === "this_week" || timingKey === "next_week" || timingKey === "this_month") score += 28
  if (timingKey === "next_30_days") score += 24
  if (timingKey === "later_this_year") score += 12
  if (timingKey === "future_release") score += 5

  if (!releaseDate) return score
  const date = new Date(`${releaseDate}T00:00:00-07:00`)
  if (Number.isNaN(date.getTime())) return score
  const days = Math.round((date.getTime() - currentDate.getTime()) / 86400000)
  if (days >= -30 && days <= 45) score += 30
  else if (days >= -60 && days <= 90) score += 22
  else if (days >= -90 && days <= 180) score += 14
  else if (days > 180 && days <= 365) score += 5
  return score
}

function completenessScore(item) {
  const tile = item.tile || {}
  const detail = item.detail || {}
  let score = 0
  if (tile.poster_url || detail.poster_url) score += 12
  if (detail.backdrop_url || tile.backdrop_url) score += 10
  if (tile.tmdb_id || detail.tmdb_id) score += 8
  if (detail.director) score += 5
  if ((detail.principal_cast || []).length >= 4) score += 5
  if (detail.why_watching || detail.latest_intelligence) score += 5
  if (detail.distributor && detail.distributor !== "Unknown") score += 5
  return score
}

function festivalScore(festivalHistory, labels) {
  if (!festivalHistory.length) return 0
  let score = Math.min(18, festivalHistory.length * 4)
  if (["Cannes Selection", "Venice Selection", "TIFF Selection", "Telluride Selection", "NYFF Selection", "Sundance Selection"].some((label) => labels.has(label))) {
    score += 8
  }
  if (labels.has("Festival Breakout") || labels.has("Acclaimed Premiere") || labels.has("Jury Prize Winner")) {
    score += 16
  }
  return score
}

function festivalOnlyPenalty(item) {
  const tile = item.tile || {}
  const detail = item.detail || {}
  const hasImages = Boolean(tile.poster_url || detail.poster_url) && Boolean(detail.backdrop_url || tile.backdrop_url)
  if (!hasImages) return 44
  if (isTimely(item)) return 16
  return 30
}

function isFestivalOnly(item) {
  const labels = labelSet(item)
  const ai = item.tile?.awards_intelligence || item.detail?.awards_intelligence || {}
  return hasFestivalSignal(item) && !ai.awards_status && !isMajorRelease(item) && !labels.has("Festival Breakout") && !labels.has("Acclaimed Premiere")
}

function isAwarded(item) {
  const ai = item.tile?.awards_intelligence || item.detail?.awards_intelligence || {}
  return Boolean(ai.awards_status)
}

function isMajorRelease(item) {
  const labels = labelSet(item)
  const primary = item.tile?.primary_category || item.detail?.primary_category || ""
  const badge = item.tile?.public_badge?.label || item.tile?.discover_primary_tag?.label || ""
  return [primary, badge, ...labels].some((value) => /major release|franchise|event film|event release|blockbuster|prestige blockbuster|major filmmaker/i.test(String(value || "")))
}

function hasFestivalSignal(item) {
  const labels = labelSet(item)
  return Boolean((item.detail?.festival_history || []).length || [...labels].some((label) => /festival|cannes|venice|tiff|telluride|nyff|sundance/i.test(label)))
}

function isTimely(item) {
  const timingKey = item.tile?.release_timing?.release_timing_key || ""
  if (["out_now", "this_week", "next_week", "this_month", "next_30_days", "later_this_year"].includes(timingKey)) return true
  const releaseDate = item.tile?.release_date
  if (!releaseDate) return false
  const date = new Date(`${releaseDate}T00:00:00-07:00`)
  if (Number.isNaN(date.getTime())) return false
  const days = Math.round((date.getTime() - currentDate.getTime()) / 86400000)
  return days >= -60 && days <= 180
}

function labelSet(item) {
  return new Set([
    ...(item.tile?.contextual_labels?.labels || []),
    ...(item.detail?.contextual_labels?.labels || []),
    item.tile?.contextual_labels?.primary_label,
    item.detail?.contextual_labels?.primary_label,
    item.tile?.public_badge?.label,
    item.tile?.discover_primary_tag?.label,
    item.detail?.awards_profile,
    item.detail?.primary_category,
  ].filter(Boolean))
}

function filmId(item) {
  const tile = item.tile || item || {}
  const detail = item.detail || {}
  return String(tile.profile_id || tile.id || detail.profile_id || detail.id || tile.canonical_film_id || detail.canonical_film_id || tile.tmdb_id || detail.tmdb_id || "")
}

function titleOf(item) {
  return item.tile?.title || item.detail?.title || item.title || ""
}

function spotlightFromItem(item) {
  const tile = item.tile || {}
  const detail = item.detail || {}
  return {
    attention_hook: detail.why_watching || detail.latest_intelligence || "",
    backdrop_url: detail.backdrop_url || tile.backdrop_url || "",
    director: detail.director || "",
    poster_url: tile.poster_url || detail.poster_url || "",
    profile_id: filmId(item),
    profile_url: tile.profile_url || detail.profile_url || "",
    release_display: tile.release_display || detail.release_display || "",
    signal_labels: tile.contextual_labels?.labels || detail.contextual_labels?.labels || [],
    title: titleOf(item),
    tmdb_id: tile.tmdb_id || detail.tmdb_id || "",
  }
}
