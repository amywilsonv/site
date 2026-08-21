const state = {
  homepage: null,
  discover: null,
  route: "home",
  view: "all",
  homeFilter: "all",
  timing: "",
  query: "",
  visible: 30,
  hoverTimer: null,
};

const SCREENING_ROOM_NAV = {
  home: { key: "home", label: "Home", route: "home", view: "", hash: "" },
  discover: { key: "discover", label: "Discover", route: "discover", view: "all", hash: "#discover" },
  festivals: { key: "festivals", label: "Festival Radar", route: "discover", view: "festivals", hash: "#festival-radar" },
  awards: { key: "awards", label: "Awards Intelligence", route: "discover", view: "awards", hash: "#awards-intelligence" },
};

const DISCOVERY_STATE_KEY = "screening-room:return-context";
const DISCOVER_PRIMARY_TAG_PRIORITY = [
  "Cannes Selection",
  "Venice Selection",
  "TIFF Selection",
  "Telluride Selection",
  "Sundance Selection",
  "NYFF Selection",
  "Festival Breakout",
  "Jury Prize Winner",
  "Acclaimed Premiere",
  "Best Picture Watch",
  "Acting Showcase",
  "Craft Contender",
  "Animation Contender",
  "Awards Breakout",
  "Trailer Released",
  "Opening Soon",
  "Limited Release",
  "Streaming Soon",
  "Franchise Return",
  "Event Film",
  "Blockbuster Watch",
  "Prestige Blockbuster",
  "Streaming Event",
  "Family Event",
  "Major Filmmaker",
  "Star-Driven",
  "Ensemble Spotlight",
  "Breakthrough Director",
  "Auteur Watch",
  "Most Anticipated",
  "Trending",
  "Breakout Buzz",
  "Cultural Event",
  "Under the Radar",
  "Indie Spotlight",
];
const GENERIC_DISCOVER_TAGS = new Set(["Film", "On the Radar", "General Watch", "Updated"]);

const home = document.getElementById("homeView");
const discover = document.getElementById("discoverView");
const preview = document.getElementById("hoverPreview");
const modal = document.getElementById("filmModal");
const scrim = document.getElementById("modalScrim");
const aboutPanel = document.getElementById("aboutPanel");
const SCREENING_ROOM_SCORE_METHODOLOGY = {
  range: "0 to 140 points",
  families: [
    ["Audience momentum", "TMDb popularity and TMDb vote count"],
    ["Audience quality", "TMDb vote average when vote data exists"],
    ["Festival and awards context", "festival selections, festival awards, awards categories, precursor awards, and legacy dashboard award/festival context"],
    ["Availability", "US watch-provider counts and flatrate streaming-provider counts"],
    ["Campaign activity", "canonical trailer volume"],
    ["Talent profile", "principal cast and credited talent counts, including legacy dashboard talent context"],
  ],
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function init() {
  renderLoadingShell();
  setHomeSeo();
  try {
    const [homepage, discoverPayload] = await Promise.all([
      loadJson("data/discovery_homepage.json"),
      loadJson("data/discovery_discover.json"),
    ]);
    state.homepage = homepage;
    state.discover = discoverPayload;
    wireNavigation();
    renderHome();
    renderDiscover();
    setRoute(routeFromLocation(), { replace: true });
  } catch (error) {
    document.body.innerHTML = `<main class="app-shell">${errorState("Discovery data could not load", error.message, "Refresh the page or check that dashboard/data/discovery_homepage.json exists.")}</main>`;
    console.error(error);
  }
}

function wireNavigation() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (button.tagName === "BUTTON") {
        event.preventDefault();
        if (button.dataset.navView) state.view = button.dataset.navView;
        setRoute(button.dataset.route);
      }
    });
  });
  document.getElementById("globalSearch")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.visible = 30;
    if (state.route !== "discover") setRoute("discover");
    else renderDiscover();
  });
  if (window.AwardsSearch) {
    AwardsSearch.wireGlobalSearch(document.getElementById("globalSearch"), document.getElementById("searchPanel"));
  }
  document.querySelectorAll("[data-about-open]").forEach((button) => button.addEventListener("click", openAbout));
  window.addEventListener("popstate", () => setRoute(routeFromLocation(), { replace: true }));
  window.addEventListener("hashchange", () => setRoute(routeFromLocation(), { replace: true }));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      preview.classList.remove("open");
      closeModal();
      closeAbout();
    }
  });
  scrim.addEventListener("click", closeModal);
  scrim.addEventListener("click", closeAbout);
}

function renderLoadingShell() {
  home.innerHTML = `
    <section class="intro" aria-busy="true">
      <p class="eyebrow">Home</p>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line wide"></div>
    </section>
    <div class="poster-grid slate" aria-label="Loading homepage films">
      ${Array.from({ length: 10 }, () => `<div class="skeleton skeleton-card"></div>`).join("")}
    </div>
  `;
  discover.innerHTML = `
    <section class="intro" aria-busy="true">
      <p class="eyebrow">Discover</p>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line"></div>
    </section>
    <div class="poster-grid supporting" aria-label="Loading discovery films">
      ${Array.from({ length: 12 }, () => `<div class="skeleton skeleton-card small"></div>`).join("")}
    </div>
  `;
}

function renderHome() {
  const h = state.homepage;
  const spotlight = h.spotlight || spotlightFromFirstCard(h.screening_room[0]);
  const festivalItems = state.discover?.views?.festivals?.all_items || [];
  home.innerHTML = `
    ${routeHeading(SCREENING_ROOM_NAV.home.label, "Films worth following.", "homeRouteHeading")}
    ${renderLastUpdatedIndicator(h.metadata?.last_updated)}
    ${methodologyIntro()}
    ${nowInFocus(spotlight)}
    ${comingSoonSection(dedupeItems(h.opening_soon, [spotlight.tmdb_id]))}
    ${festivalRadarSection(festivalItems, h.latest_signals || [])}
    ${awardsBriefingSection(h.awards_watch || [])}
    ${changesSection(h.latest_signals || [])}
  `;
  wireContent(home);
  track("spotlight_viewed", { tmdb_id: spotlight.tmdb_id, title: spotlight.title });
  home.querySelectorAll("[data-collection]").forEach((section) => {
    track("collection_viewed", { collection: section.dataset.collection });
  });
}

function routeHeading(title, subtitle = "", id = "routeHeading") {
  return `
    <section class="route-heading" aria-labelledby="${escapeHtml(id)}">
      <h1 id="${escapeHtml(id)}">${escapeHtml(title)}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    </section>
  `;
}

function methodologyIntro() {
  return `
    <div class="methodology-strip">
      <span>The Screening Room Score combines available momentum, campaign, availability, awards/festival, and talent signals.</span>
      <button class="methodology-link" type="button" data-methodology-open aria-haspopup="dialog">How the Screening Room Score works</button>
    </div>
  `;
}

function renderLastUpdatedIndicator(value) {
  const formatted = formatLastUpdatedDate(value);
  return formatted ? `<p class="last-updated">Last updated ${escapeHtml(formatted)}</p>` : "";
}

function formatLastUpdatedDate(value) {
  if (!value || typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function nowInFocus(spotlight) {
  const backdrop = heroBackdrop(spotlight);
  const label = spotlightPrimaryLabel(spotlight);
  const meta = [spotlight.release_display, label].filter(Boolean).join(" · ");
  return `
    <article class="now-focus" data-spotlight-id="${escapeHtml(spotlight.tmdb_id || "")}">
      <div class="now-focus-copy">
        <p class="eyebrow">Now in Focus</p>
        <h2>${escapeHtml(spotlight.title || "Now in Focus")}</h2>
        <p class="focus-hook">${escapeHtml(spotlightLead(spotlight))}</p>
        ${meta ? `<p class="focus-release">${escapeHtml(meta)}</p>` : ""}
        <button class="spotlight-action" type="button" data-signal="${escapeHtml(spotlight.tmdb_id || "")}">View Film <span aria-hidden="true">→</span></button>
      </div>
      <div class="now-focus-image">
        ${backdrop ? `<img src="${escapeHtml(backdrop)}" alt="${escapeHtml(spotlight.title || "Featured film")}">` : `<div class="now-focus-placeholder">${escapeHtml(spotlight.title || "Featured film")}</div>`}
      </div>
    </article>
  `;
}

function heroBackdrop(spotlight) {
  return spotlight.backdrop_url || spotlight.backdropUrl || spotlight.hero_image || spotlight.heroImage || spotlight.landscape_image || spotlight.landscapeImage || spotlight.still_image || spotlight.stillImage || "";
}

function spotlightLead(spotlight) {
  if ((spotlight.title || "").toLowerCase() === "the odyssey") {
    return "Christopher Nolan’s next epic combines blockbuster scale with major cultural and awards attention.";
  }
  return spotlight.attention_hook || "A film with current cultural, festival, release, or awards signals worth watching.";
}

function spotlightPrimaryLabel(spotlight) {
  if ((spotlight.title || "").toLowerCase() === "the odyssey" && (spotlight.signal_labels || []).includes("Event Film")) {
    return "Event Film";
  }
  return chooseContextualLabel([
    ...(spotlight.contextual_labels?.labels || []),
    spotlight.contextual_labels?.primary_label,
    spotlight.primary_label,
    ...(spotlight.signal_labels || []),
  ]);
}

function sectionHeader(title, subtitle, action = "", id = "") {
  return `
    <div class="section-head editorial-head">
      <div>
        <h2${id ? ` id="${escapeHtml(id)}"` : ""}>${escapeHtml(title)}</h2>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
      ${action}
    </div>
  `;
}

function comingSoonSection(items) {
  const clean = dedupeItems(items, []);
  if (!clean.length) return "";
  return `
    <section class="home-section coming-soon-section" data-collection="coming-soon" aria-labelledby="comingSoonTitle">
      ${sectionHeader("Coming Soon", "Release-timing watch for films entering the conversation.", "", "comingSoonTitle")}
      <div class="release-rail" tabindex="0" aria-label="Coming soon films">
        ${clean.map(releaseCard).join("")}
      </div>
    </section>
  `;
}

function releaseCard(item) {
  const label = chooseComingSoonLabel(item);
  return `
    <button class="release-card" type="button" data-id="${escapeHtml(item.tile.tmdb_id)}" aria-label="Open ${escapeHtml(item.tile.title)}">
      <span class="release-poster-wrap">
        ${item.tile.poster_url ? `<img class="release-poster" src="${escapeHtml(item.tile.poster_url)}" alt="${escapeHtml(item.tile.poster_alt)}">` : `<span class="release-placeholder">${escapeHtml(item.tile.title)}</span>`}
      </span>
      <span class="release-title">${escapeHtml(item.tile.title)}</span>
      <span class="release-date">${escapeHtml(compactReleaseDisplay(item.tile.release_display))}</span>
      ${label ? `<span class="release-caption">${escapeHtml(label)}</span>` : ""}
    </button>
  `;
}

function festivalRadarSection(items, signals) {
  const clean = dedupeItems(items, []);
  const action = `<button class="section-action" type="button" data-explore="festivals">View all</button>`;
  return `
    <section class="home-section festival-bulletin" data-collection="festival-radar" aria-labelledby="festivalRadarTitle">
      ${sectionHeader("Festival Radar", "Verified festival signals worth tracking.", action, "festivalRadarTitle")}
      ${clean.length ? `<div class="festival-list">${clean.map((item) => festivalItem(item, signals)).join("")}</div>` : emptyState("No verified festival signals yet.", "Festival updates will appear here after they are supported by the current dataset.")}
    </section>
  `;
}

function festivalItem(item, signals) {
  const signal = signals.find((entry) => entry.tmdb_id === item.tile.tmdb_id && /festival|selected|opening-night|premiere|nyff/i.test(entry.signal || ""));
  const note = normalizeSignalCopy(signal?.signal || item.detail.whats_changed || item.detail.festival_display_status || "");
  const context = festivalContextLabel(note, item);
  return `
    <button class="festival-item" type="button" data-id="${escapeHtml(item.tile.tmdb_id)}" aria-label="Open ${escapeHtml(item.tile.title)}">
      ${item.tile.poster_url ? `<img src="${escapeHtml(item.tile.poster_url)}" alt="${escapeHtml(item.tile.poster_alt)}">` : `<span class="festival-thumb-placeholder">${escapeHtml(item.tile.title)}</span>`}
      <span>
        <small>${escapeHtml(context)}</small>
        <strong>${escapeHtml(item.tile.title)}</strong>
        <em>${escapeHtml(note || "Verified festival information is available in the current dataset.")}</em>
      </span>
    </button>
  `;
}

function awardsBriefingSection(items) {
  const clean = dedupeItems(items, []);
  if (!clean.length) return "";
  const action = `<button class="section-action" type="button" data-explore="awards">View all</button>`;
  return `
    <section class="home-section awards-briefing" data-collection="awards-intelligence" aria-labelledby="awardsIntelligenceTitle">
      ${sectionHeader("Awards Intelligence", "Current awards context without treating monitoring as prediction.", action, "awardsIntelligenceTitle")}
      <div class="awards-brief-grid">
        ${clean.slice(0, 6).map(awardsBriefCard).join("")}
      </div>
      <button class="awards-mobile-link" type="button" data-explore="awards">View all awards intelligence <span aria-hidden="true">→</span></button>
    </section>
  `;
}

function awardsBriefCard(item) {
  const label = chooseCardLabel(item, "section-awards-intelligence") || item.detail.awards_profile || "Awards Watch";
  const explanation = homepageAwardsExplanation(item);
  return `
    <button class="awards-brief-card" type="button" data-id="${escapeHtml(item.tile.tmdb_id)}" aria-label="Open ${escapeHtml(item.tile.title)}">
      ${item.tile.poster_url ? `<img src="${escapeHtml(item.tile.poster_url)}" alt="${escapeHtml(item.tile.poster_alt)}">` : `<span class="awards-thumb-placeholder">${escapeHtml(item.tile.title)}</span>`}
      <span>
        <small>${escapeHtml(label)}</small>
        <strong>${escapeHtml(item.tile.title)}</strong>
        ${explanation ? `<em>${escapeHtml(explanation)}</em>` : ""}
      </span>
    </button>
  `;
}

function changesSection(signals) {
  const meaningful = signals.filter(isMeaningfulHomepageSignal).slice(0, 6);
  if (!meaningful.length) return "";
  const grouped = meaningful.reduce((groups, signal) => {
    const date = signal.date || "Recent";
    if (!groups[date]) groups[date] = [];
    groups[date].push(signal);
    return groups;
  }, {});
  return `
    <section class="home-section what-changed" aria-labelledby="whatChangedTitle">
      ${sectionHeader("What Changed", "Recent meaningful movement across tracked films.", "", "whatChangedTitle")}
      <div class="dispatch-list">
        ${Object.entries(grouped).map(([date, entries]) => `
          <section class="dispatch-group" aria-label="${escapeHtml(formatDateline(date))}">
            <p class="dispatch-date">${escapeHtml(formatDateline(date))}</p>
            ${entries.map((signal) => `
              <article class="dispatch-entry">
                <p><strong>${escapeHtml(signal.title)}</strong> ${escapeHtml(normalizeSignalCopy(signal.signal))} <button class="dispatch-link" type="button" data-signal="${escapeHtml(signal.tmdb_id)}">View Film <span aria-hidden="true">→</span></button></p>
              </article>
            `).join("")}
          </section>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDiscover() {
  const source = state.discover.views[state.view];
  const items = filteredItems();
  const shown = items.slice(0, state.visible);
  const title = currentNavItem().label;
  discover.innerHTML = `
    ${routeHeading(title, "Browse films by editorial category and release timing.", "discoverRouteHeading")}
    <div class="filter-bar">
      <div class="category-tabs">
        ${state.discover.top_categories.map((category) => `<button class="tab ${category.key === state.view ? "active" : ""}" type="button" data-view="${category.key}">${escapeHtml(category.label)}</button>`).join("")}
      </div>
      <div class="filter-row">
        <select id="timingFilter" aria-label="Release timing">
          <option value="">Release Timing</option>
          ${state.discover.secondary_filters.release_timing.map((item) => `<option value="${item.key}" ${item.key === state.timing ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
        </select>
        <select aria-label="Genre"><option>Genre</option></select>
        <select aria-label="Festival"><option>Festival</option></select>
        <select aria-label="Distributor"><option>Distributor</option></select>
        <select aria-label="Awards profile"><option>Awards Profile</option></select>
        <select aria-label="Sort"><option>Sort: Editorial</option></select>
      </div>
    </div>
    <div class="section-head"><span class="muted">Showing ${shown.length} of ${items.length}</span></div>
    ${shown.length ? `<div class="poster-grid supporting">${shown.map((item) => card(item, "discover-card")).join("")}</div>` : emptyState("No films match this filter yet.", "Try a broader category, clear the search box, or switch release timing.")}
    ${shown.length < items.length ? `<button class="chip load-more" type="button" id="loadMore">Load More</button>` : ""}
  `;
  wireContent(discover);
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      state.visible = 30;
      renderDiscover();
    });
  });
  document.getElementById("timingFilter")?.addEventListener("change", (event) => {
    state.timing = event.target.value;
    state.visible = 30;
    renderDiscover();
  });
  document.getElementById("loadMore")?.addEventListener("click", () => {
    state.visible += 30;
    renderDiscover();
  });
}

function filteredItems() {
  let items = state.discover.views[state.view].all_items;
  if (state.timing) items = items.filter((item) => item.tile.release_timing.release_timing_key === state.timing);
  if (state.query.trim()) {
    const query = state.query.trim().toLowerCase();
    items = items.filter((item) => [item.tile.title, item.detail.director, (item.detail.principal_cast || []).join(" ")].join(" ").toLowerCase().includes(query));
  }
  return items;
}

function card(item, variant = "") {
  const cardVariant = typeof variant === "string" ? variant : "";
  const badge = displayBadgeForCard(item, cardVariant);
  const labels = cardVariant.includes("discover-card") || cardVariant.includes("single-label")
    ? [badge?.label].filter(Boolean)
    : contextualLabels(item).slice(0, 3);
  return `
    <button class="poster-card ${cardVariant} ${item.tile.is_awards_contender ? "awards" : ""} ${item.tile.is_lead ? "lead" : ""}" type="button" data-id="${item.tile.tmdb_id}" aria-label="Open ${escapeHtml(item.tile.title)}">
      ${labels.length ? `<span class="badge-row">${labels.map((label, index) => `<span class="badge ${index ? "secondary-badge" : escapeHtml(badge?.class || "major")}">${index ? "" : icon(badge?.icon || "diamond")}${escapeHtml(label)}</span>`).join("")}</span>` : ""}
      ${item.tile.poster_url ? `<img class="poster-img" src="${escapeHtml(item.tile.poster_url)}" alt="${escapeHtml(item.tile.poster_alt)}">` : `<div class="placeholder">${escapeHtml(item.tile.title)}</div>`}
      <span class="poster-overlay"><span class="poster-title">${escapeHtml(item.tile.title_overlay)}</span><span class="poster-line">${escapeHtml(item.tile.release_display)}</span></span>
    </button>
  `;
}

function displayBadgeForCard(item, cardVariant = "") {
  if (cardVariant.includes("discover-card")) {
    return item.tile.discover_primary_tag || badgeFromPrimaryDiscoverLabel(item);
  }
  if (cardVariant.includes("single-label")) {
    const label = chooseCardLabel(item, cardVariant);
    return label ? badgeForLabel(item, label) : null;
  }
  return item.tile.public_badge;
}

function badgeFromPrimaryDiscoverLabel(item) {
  const explicit = explicitPrimaryTag(item);
  if (explicit) return badgeForLabel(item, explicit);
  const labels = contextualLabels(item).filter((label) => !GENERIC_DISCOVER_TAGS.has(label));
  if (!labels.length) return null;
  const selected = labels
    .map((label, index) => ({
      label,
      index,
      priority: DISCOVER_PRIMARY_TAG_PRIORITY.includes(label) ? DISCOVER_PRIMARY_TAG_PRIORITY.indexOf(label) : DISCOVER_PRIMARY_TAG_PRIORITY.length,
    }))
    .sort((a, b) => a.priority - b.priority || a.index - b.index || a.label.localeCompare(b.label))[0];
  return selected ? badgeForLabel(item, selected.label) : null;
}

function explicitPrimaryTag(item) {
  for (const source of [item.tile || {}, item.detail || {}]) {
    for (const key of ["manual_primary_tag", "editorial_primary_tag", "primary_tag", "primary_label"]) {
      const value = source[key];
      const label = typeof value === "object" && value !== null ? value.label : value;
      if (label && !GENERIC_DISCOVER_TAGS.has(String(label))) return String(label);
    }
  }
  return "";
}

function badgeForLabel(item, label) {
  const evidence = [
    ...(item.tile.contextual_labels?.evidence || []),
    ...(item.detail.contextual_labels?.evidence || []),
  ].find((entry) => entry.label === label);
  const family = evidence?.family || "attention";
  const byFamily = {
    attention: { icon: "radar", class: "major" },
    commercial: { icon: "diamond", class: "major" },
    talent: { icon: "spark", class: "major" },
    festival: { icon: "spark", class: "festival" },
    awards: { icon: "star", class: "awards" },
    release: { icon: "frame", class: "under" },
  };
  const style = byFamily[family] || { icon: item.tile.public_badge?.icon || "diamond", class: item.tile.public_badge?.class || "major" };
  return { label, ...style };
}

function contextualLabels(item) {
  const labels = item.tile.contextual_labels?.labels || item.detail.contextual_labels?.labels || [];
  const fallback = item.tile.public_badge?.label ? [item.tile.public_badge.label] : [];
  return (labels.length ? labels : fallback).filter(Boolean).slice(0, 3);
}

function chooseCardLabel(item, cardVariant = "") {
  if (cardVariant.includes("section-coming-soon")) {
    return chooseComingSoonLabel(item);
  }
  if (cardVariant.includes("section-awards-intelligence")) {
    return chooseContextualLabel([
      ...(item.tile.contextual_labels?.labels || []),
      ...(item.detail.contextual_labels?.labels || []),
      item.tile.public_badge?.label,
    ], ["Best Picture Watch", "Craft Contender", "Awards Watch", "NYFF Selection", "Festival Selection"]);
  }
  if (cardVariant.includes("section-festival-radar")) {
    return chooseContextualLabel([
      ...(item.tile.contextual_labels?.labels || []),
      ...(item.detail.contextual_labels?.labels || []),
      item.tile.public_badge?.label,
    ], ["NYFF Selection", "Festival Selection", "Major Festival", "Best Picture Watch", "Craft Contender"]);
  }
  return chooseContextualLabel([
    ...(item.tile.contextual_labels?.labels || []),
    ...(item.detail.contextual_labels?.labels || []),
    item.tile.public_badge?.label,
  ]);
}

function chooseComingSoonLabel(item) {
  const labels = [
    ...(item.tile.contextual_labels?.labels || []),
    ...(item.detail.contextual_labels?.labels || []),
  ];
  const distributor = (item.detail.distributor || "").toLowerCase();
  const awardsProfile = item.detail.awards_profile || "";
  const derived = [
    item.tile.primary_category,
    item.detail.primary_category,
    /netflix|apple|prime video|amazon|hulu|max|disney/.test(distributor) ? "Streaming Premiere" : "",
    awardsProfile === "Craft Potential" ? "Craft Contender" : "",
  ];
  return chooseContextualLabel([...labels, ...derived], [
    "Franchise Return",
    "Streaming Premiere",
    "Major Release",
    "Craft Contender",
    "Major Filmmaker",
    "Blockbuster Watch",
    "Event Film",
    "Event Release",
    "Most Anticipated",
  ]);
}

function chooseContextualLabel(labels, sectionPriority = []) {
  const clean = [...new Set(labels.filter(Boolean))];
  // Homepage rails use one label, preferring section-specific editorial context over generic anticipation.
  const priority = [
    ...sectionPriority,
    "NYFF Selection",
    "Best Picture Watch",
    "Craft Contender",
    "Franchise Return",
    "Festival Selection",
    "Streaming Premiere",
    "Indie Breakout",
    "Major Filmmaker",
    "Major Release",
    "Craft Watch",
    "Awards Watch",
    "Breakout Watch",
    "Blockbuster Watch",
    "Event Film",
    "Event Release",
    "Most Anticipated",
  ];
  return priority.find((label) => clean.includes(label)) || clean[0] || "";
}

function wireContent(root) {
  root.querySelectorAll(".poster-card, .release-card, .festival-item, .awards-brief-card").forEach((element) => {
    element.addEventListener("mouseenter", () => schedulePreview(element));
    element.addEventListener("focus", () => schedulePreview(element));
    element.addEventListener("mouseleave", clearPreview);
    element.addEventListener("click", () => {
      track("homepage_card_click", { tmdb_id: element.dataset.id, route: state.route });
      track("film_opened", { tmdb_id: element.dataset.id, route: state.route });
      openDetail(findItem(element.dataset.id));
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetail(findItem(element.dataset.id));
      }
    });
  });
  root.querySelectorAll("[data-explore]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.explore;
      setRoute("discover");
    });
  });
  root.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.route));
  });
  root.querySelectorAll("[data-signal]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("spotlight-action")) track("spotlight_clicked", { tmdb_id: button.dataset.signal });
      openDetail(findItem(button.dataset.signal));
    });
  });
  root.querySelectorAll("[data-methodology-open]").forEach((button) => {
    button.addEventListener("click", openMethodology);
  });
}

function allItems() {
  return [
    ...(state.homepage.most_anticipated || []),
    ...(state.homepage.awards_watch || []),
    ...state.homepage.screening_room,
    ...state.homepage.opening_soon,
    ...state.homepage.building_buzz,
    ...Object.values(state.discover.views).flatMap((view) => view.all_items),
  ];
}

function dedupeItems(items, excludeIds) {
  const seen = new Set(excludeIds.filter(Boolean));
  const clean = [];
  for (const item of items || []) {
    const id = item.tile?.tmdb_id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    clean.push(item);
  }
  return clean;
}

function spotlightFromFirstCard(item) {
  if (!item) return {};
  return {
    tmdb_id: item.tile.tmdb_id,
    title: item.tile.title,
    poster_url: item.tile.poster_url,
    release_display: item.tile.release_display,
    director: item.detail.director,
    attention_hook: item.detail.why_watching,
    signal_labels: contextualLabels(item),
  };
}

function findItem(id) {
  return allItems().find((item) => item.tile.tmdb_id === id);
}

function schedulePreview(element) {
  clearTimeout(state.hoverTimer);
  state.hoverTimer = setTimeout(() => showPreview(element), 180);
}

function clearPreview() {
  clearTimeout(state.hoverTimer);
  setTimeout(() => {
    if (!preview.matches(":hover")) preview.classList.remove("open");
  }, 120);
}

preview.addEventListener("mouseleave", () => preview.classList.remove("open"));

function showPreview(element) {
  const item = findItem(element.dataset.id);
  if (!item) return;
  preview.innerHTML = `
    <h3>${escapeHtml(item.preview.title)}</h3>
    <strong>${escapeHtml(item.preview.editorial_category || "")}</strong>
    <p>${escapeHtml(item.preview.release_line)}${item.preview.director ? ` · Directed by ${escapeHtml(item.preview.director)}` : ""}</p>
    <p>${escapeHtml(item.preview.why_it_matters)}</p>
    ${item.preview.primary_signal ? `<p>${escapeHtml(item.preview.primary_signal)}</p>` : ""}
    <button class="chip" type="button" id="previewOpen">View film</button>
  `;
  const rect = element.getBoundingClientRect();
  const width = 320;
  const height = 220;
  let left = rect.right + 12;
  if (left + width > innerWidth) left = rect.left - width - 12;
  if (left < 12) left = 12;
  const top = Math.min(Math.max(12, rect.top), innerHeight - height - 12);
  preview.style.left = `${left}px`;
  preview.style.top = `${top}px`;
  preview.classList.add("open");
  document.getElementById("previewOpen").addEventListener("click", () => openDetail(item));
}

async function openDetail(item) {
  if (!item) return;
  persistReturnContext();
  scrim.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.innerHTML = `
    <button class="chip close" type="button" id="closeModal">Close</button>
    <div class="modal-grid" aria-busy="true">
      ${item.detail.poster_url ? `<img class="poster-img-static" src="${escapeHtml(item.detail.poster_url)}" alt="${escapeHtml(item.detail.title)} poster">` : ""}
      <div>
        <p class="eyebrow">${escapeHtml(item.detail.release_timing_label || item.detail.primary_category || "Film")}</p>
        <h2>${escapeHtml(item.detail.title)}</h2>
        <p>${escapeHtml(item.detail.release_display)}${item.detail.director ? ` · Directed by ${escapeHtml(item.detail.director)}` : ""}</p>
        <div class="skeleton skeleton-line wide"></div>
      </div>
    </div>
  `;
  document.getElementById("closeModal").addEventListener("click", closeModal);
  const profile = await loadModalProfile(item);
  const timeline = await loadModalTimeline(item);
  const identity = profile?.film_identity || {};
  const detail = item.detail || {};
  const title = identity.title || detail.title;
  const releaseLine = identity.release_display || detail.release_display || detail.release_timing_label || "Release date unavailable";
  const director = profile?.talent?.director || detail.director || "";
  modal.innerHTML = `
    <button class="chip close" type="button" id="closeModal">Close</button>
    <div class="modal-grid">
      ${identity.poster || detail.poster_url ? `<img class="poster-img-static" src="${escapeHtml(identity.poster || detail.poster_url)}" alt="${escapeHtml(title)} poster">` : ""}
      <div class="modal-intelligence">
        <p class="eyebrow">${escapeHtml(detail.release_timing_label || detail.primary_category || "Film Intelligence")}</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(releaseLine)}${director ? ` · Directed by ${escapeHtml(director)}` : ""}</p>
        ${modalRatingsSnapshot(profile)}
        ${modalOscarSnapshot(profile, detail)}
        ${modalBoxOfficeSnapshot(profile)}
        ${modalWatchProviderSnapshot(profile)}
        ${modalMediaSnapshot(profile, timeline)}
        <p class="modal-outlook">${escapeHtml(modalSynopsis(profile, detail))}</p>
        ${detail.profile_url ? `<a class="chip" href="${escapeHtml(filmProfileUrl(detail.profile_url))}" data-film-profile-link>Open Film Intelligence</a>` : ""}
      </div>
    </div>
  `;
  document.getElementById("closeModal").addEventListener("click", closeModal);
  modal.querySelectorAll("[data-film-profile-link]").forEach((link) => link.addEventListener("click", persistReturnContext));
  modal.querySelectorAll("[data-methodology-open]").forEach((button) => button.addEventListener("click", openMethodology));
  track("film_detail_opened", { tmdb_id: item.tile.tmdb_id, title });
}

async function loadModalProfile(item) {
  const path = item.detail?.profile_payload_url || item.tile?.profile_payload_url;
  if (!path) return null;
  try {
    return await loadJson(path);
  } catch {
    return null;
  }
}

async function loadModalTimeline(item) {
  const id = item.tile?.tmdb_id || item.detail?.tmdb_id;
  if (!id) return null;
  try {
    return await loadJson(`data/timelines/${encodeURIComponent(id)}.json`);
  } catch {
    return null;
  }
}

function modalRatingsSnapshot(profile) {
  const ratings = profile?.ratings || profile?.performance?.ratings || {};
  const tmdb = ratings.tmdb || {};
  const legacyPills = [
    ratings.imdb ? ratingPill("IMDb", ratings.imdb) : "",
    ratings.letterboxd ? ratingPill("Letterboxd", ratings.letterboxd) : "",
    ratings.rotten_tomatoes_tomatometer || ratings.rotten_tomatoes || ratings.rottenTomatoes
      ? ratingPill("Rotten Tomatoes Tomatometer", ratings.rotten_tomatoes_tomatometer || ratings.rotten_tomatoes || ratings.rottenTomatoes)
      : "",
    ratings.metacritic ? ratingPill("Metacritic", ratings.metacritic) : "",
  ].join("");
  return `
    <div class="modal-snapshot">
      <strong>TMDb Data</strong>
      <div class="ratings-snapshot">
        ${ratingPill("TMDb rating", tmdb)}
        ${ratingPill("TMDb popularity", profile?.performance?.tmdb_popularity || tmdb.popularity)}
        ${legacyPills}
      </div>
    </div>
  `;
}

function modalOscarSnapshot(profile, detail) {
  const awards = profile?.awards || {};
  const probabilities = realOscarProbabilities(awards.probabilities || {});
  const intelligence = profile?.intelligence || detail?.intelligence || {};
  const score = profile?.screening_room_score || profile?.signals?.screening_room_score || detail?.screening_room_score || {};
  const numericScore = Number(score.score);
  if (Number.isFinite(numericScore) || intelligence.summary) {
    return `
      <div class="modal-snapshot">
        <div class="score-panel-title">
          <strong>Screening Room Score</strong>
          <button class="methodology-link" type="button" data-methodology-open aria-haspopup="dialog">How this score works</button>
        </div>
        ${Number.isFinite(numericScore) ? `<p>${Math.round(numericScore)} · ${escapeHtml(intelligence.confidence || score.confidence || "Unavailable")} confidence</p>` : ""}
        <span>${escapeHtml(intelligence.summary || score.explanation || "No current explanation available.")}</span>
      </div>
    `;
  }
  const categories = awards.predicted_categories || detail.awards_path || [];
  if (!Object.keys(probabilities).length) {
    return `
      <div class="modal-snapshot">
        <strong>Oscar Intelligence</strong>
        <p>Coming Soon</p>
        <span>Nomination and win probabilities will appear here.</span>
      </div>
    `;
  }
  return `
    <div class="modal-snapshot">
      <strong>Oscar Intelligence</strong>
      ${categories.slice(0, 3).map((category) => {
        const probability = probabilities[category];
        return probability ? `<p>${escapeHtml(category)} · ${Math.round(probability.value)}% ${escapeHtml(probability.label.toLowerCase())}</p>` : "";
      }).join("") || `<span>Model not yet available</span>`}
    </div>
  `;
}

function modalBoxOfficeSnapshot(profile) {
  const boxOffice = profile?.performance?.box_office || profile?.box_office || {};
  const commercial = profile?.commercial || {};
  const budget = formatMoney(boxOffice.budget);
  const revenue = formatMoney(boxOffice.revenue);
  if (budget || revenue) {
    return `
      <div class="modal-snapshot">
        <strong>TMDb Box Office</strong>
        ${budget ? `<p>Budget · ${escapeHtml(budget)}</p>` : ""}
        ${revenue ? `<p>Revenue · ${escapeHtml(revenue)}</p>` : ""}
      </div>
    `;
  }
  return `
    <div class="modal-snapshot">
      <strong>Box Office</strong>
      <p>${escapeHtml(formatMoney(boxOffice.domestic_gross || boxOffice.domestic) || prereleaseBoxOfficeState(profile))}</p>
      <span>${escapeHtml(boxOffice.status || commercial.release_strategy || "Commercial data unavailable")}</span>
    </div>
  `;
}

function modalWatchProviderSnapshot(profile) {
  const rows = watchProviderRows(profile?.performance?.watch_providers || {});
  if (!rows.length) return "";
  return `
    <div class="modal-snapshot">
      <strong>TMDb Watch Options</strong>
      ${rows.map((row) => `<p>${escapeHtml(row.label)} · ${escapeHtml(row.value)}</p>`).join("")}
    </div>
  `;
}

function modalMediaSnapshot(profile, timeline) {
  const trailer = latestTrailer(profile, timeline);
  if (!trailer) return "";
  return `
    <div class="modal-snapshot">
      <strong>Latest Media</strong>
      <p>${escapeHtml(trailer.title)}</p>
      ${trailer.url ? `<a class="modal-text-link" href="${escapeHtml(trailer.url)}" target="_blank" rel="noopener">Watch trailer</a>` : ""}
    </div>
  `;
}

function modalSynopsis(profile, detail) {
  return profile?.film_identity?.synopsis || detail.synopsis || "Synopsis unavailable.";
}

function ratingPill(label, value) {
  return `
    <span class="rating-pill">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(formatRating(label, value))}</strong>
    </span>
  `;
}

function realOscarProbabilities(probabilities) {
  const output = {};
  Object.entries(probabilities || {}).forEach(([category, raw]) => {
    const probability = normalizeProbability(raw);
    if (probability) output[category] = probability;
  });
  return output;
}

function normalizeProbability(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number") return { value: raw <= 1 ? raw * 100 : raw, label: "Nomination probability" };
  if (typeof raw !== "object") return null;
  const candidate = raw.nomination_probability ?? raw.nominationProbability ?? raw.win_probability ?? raw.winProbability ?? raw.win_probability_among_nominees ?? raw.winProbabilityAmongNominees;
  const type = raw.nomination_probability !== undefined || raw.nominationProbability !== undefined
    ? "Nomination probability"
    : raw.win_probability !== undefined || raw.winProbability !== undefined
      ? "Win probability"
      : raw.win_probability_among_nominees !== undefined || raw.winProbabilityAmongNominees !== undefined
        ? "Win probability among confirmed nominees"
        : "";
  const numeric = Number(candidate);
  if (!Number.isFinite(numeric) || !type) return null;
  return { value: numeric <= 1 ? numeric * 100 : numeric, label: type, key: typeKey(type) };
}

function typeKey(type) {
  if (type === "Nomination probability") return "nomination_probability";
  if (type === "Win probability") return "win_probability";
  return "win_probability_among_nominees";
}

function latestTrailer(profile, timeline) {
  const canonical = profile?.media?.canonical_trailer;
  if (canonical?.url && isValidUrl(canonical.url)) {
    return {
      title: canonical.title || "Official Trailer",
      url: canonical.url,
    };
  }
  const events = timeline?.events || profile?.timeline?.events || [];
  const event = events.find((item) => String(item.event_type || "").toLowerCase().includes("trailer"));
  if (!event && !hasTrailerEvidence(profile)) return null;
  const url = event?.metadata?.url || event?.metadata?.trailer_url || profile?.media?.latest_trailer_url || "";
  if (url && !isValidUrl(url)) return null;
  return {
    title: event?.title || "Official Trailer",
    url,
  };
}

function hasTrailerEvidence(profile) {
  const attention = profile?.attention_intelligence || {};
  return (attention.evidence_sources || []).some((source) => source.source === "trailer_available")
    || (attention.attention_reasons || []).includes("Trailer Available")
    || (profile?.signals?.watch_triggers || []).includes("Trailer Available");
}

function formatRating(label, value) {
  if (value === undefined || value === null || value === "") return "N/A";
  if (label === "TMDb rating" && typeof value === "object") {
    const average = Number(value.vote_average);
    const count = Number(value.vote_count);
    if (!Number.isFinite(average) || average <= 0 || !Number.isFinite(count) || count <= 0) return "Not yet rated";
    return `${average.toFixed(average % 1 ? 1 : 0)}/10 (${count.toLocaleString()} votes)`;
  }
  if (label === "TMDb popularity") return formatPopularity(value);
  if (typeof value === "string") return value;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "N/A";
  if (label === "Letterboxd") return `${numeric.toFixed(numeric % 1 ? 1 : 0)}/5`;
  if (label === "IMDb") return `${numeric.toFixed(numeric % 1 ? 1 : 0)}/10`;
  if (label === "Rotten Tomatoes Tomatometer") return numeric <= 1 ? `${Math.round(numeric * 100)}%` : `${Math.round(numeric)}%`;
  if (label === "Metacritic") return `${Math.round(numeric)}`;
  return String(numeric);
}

function formatPopularity(value) {
  const source = typeof value === "object" && value !== null ? value.value : value;
  const numeric = Number(source);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Unavailable";
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function watchProviderRows(providers) {
  return [
    { key: "flatrate", label: "Streaming" },
    { key: "rent", label: "Rent" },
    { key: "buy", label: "Buy" },
    { key: "ads", label: "With ads" },
    { key: "free", label: "Free" },
  ].map((group) => ({
    label: group.label,
    value: providerNames(providers[group.key]),
  })).filter((row) => row.value);
}

function providerNames(items) {
  if (!Array.isArray(items)) return "";
  return items.map((item) => item?.provider_name).filter(Boolean).join(", ");
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  if (numeric >= 1000000000) return `$${(numeric / 1000000000).toFixed(1)}B`;
  if (numeric >= 1000000) return `$${Math.round(numeric / 1000000)}M`;
  if (numeric >= 1000) return `$${Math.round(numeric / 1000)}K`;
  return `$${numeric}`;
}

function prereleaseBoxOfficeState(profile) {
  const releaseDate = profile?.film_identity?.release_date;
  if (releaseDate) {
    const date = new Date(`${releaseDate}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date > new Date()) return "Coming Soon";
  }
  return "Not yet reported";
}

function closeModal() {
  scrim.classList.add("hidden");
  modal.classList.add("hidden");
}

function openAbout() {
  scrim.classList.remove("hidden");
  aboutPanel.classList.remove("hidden");
  aboutPanel.setAttribute("aria-label", "About The Screening Room");
  aboutPanel.innerHTML = `
    <button class="chip close" type="button" id="closeAbout">Close</button>
    <p class="eyebrow">About</p>
    <h2>The Screening Room</h2>
    <p>A movie-intelligence platform for films generating meaningful cultural, commercial, festival, and awards momentum.</p>
    <p>Monitoring is separate from prediction: a movie can be worth watching before it has a mature Oscar case.</p>
    <p>Designed and built by Amy Wilson.</p>
    <a class="chip" href="/projects/awards-intelligence" data-portfolio-return>Portfolio case study</a>
  `;
  document.getElementById("closeAbout").addEventListener("click", closeAbout);
  aboutPanel.querySelector("[data-portfolio-return]").addEventListener("click", () => track("portfolio_return_clicked", { surface: "about_panel" }));
  track("about_opened", { surface: "app_nav" });
}

function closeAbout() {
  aboutPanel?.classList.add("hidden");
}

function openMethodology() {
  scrim.classList.remove("hidden");
  aboutPanel.classList.remove("hidden");
  aboutPanel.setAttribute("aria-label", "How the Screening Room Score works");
  aboutPanel.innerHTML = methodologyDialogHtml("How the Screening Room Score works");
  document.getElementById("closeMethodology").addEventListener("click", closeMethodology);
  document.getElementById("closeMethodology").focus();
  track("methodology_opened", { surface: state.route });
}

function closeMethodology() {
  aboutPanel?.classList.add("hidden");
}

function methodologyDialogHtml(title) {
  return `
    <button class="chip close" type="button" id="closeMethodology">Close</button>
    <p class="eyebrow">Methodology</p>
    <h2>${escapeHtml(title)}</h2>
    <div class="methodology-copy">
      <p>The Screening Room Score is a film-intelligence signal score. It combines available audience momentum, TMDb audience rating data, campaign activity, watch availability, festival and awards context, and talent-profile signals.</p>
      <p>The current configured range is ${escapeHtml(SCREENING_ROOM_SCORE_METHODOLOGY.range)}. Higher scores mean more supported signals are present or stronger; lower scores usually mean fewer public, audience, campaign, availability, festival, awards, or talent signals are available yet.</p>
      <ul>
        ${SCREENING_ROOM_SCORE_METHODOLOGY.families.map(([label, detail]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(detail)}.</li>`).join("")}
      </ul>
      <p>The score is not a critic grade, box-office result, Oscar prediction, or guarantee of quality. It does not use Rotten Tomatoes, Metacritic, Letterboxd, IMDb, box office, news, or social/search data unless those sources are explicitly added to the scoring rules later.</p>
      <p>Upcoming films often have fewer audience, critic, commercial, and availability signals. Missing signals do not subtract points; they simply do not contribute until real data exists.</p>
      <p>Confidence describes the current explanation evidence, not a separate prediction model. It rises when the explanation has stronger fresh drivers and more available-source support, and falls when usable signals are stale or absent.</p>
      <p>Scores can change as TMDb data, trailers, availability, festival context, awards context, or talent-profile signals refresh.</p>
    </div>
  `;
}

function setRoute(route, options = {}) {
  if (route === "discover" && !state.view) state.view = "all";
  state.route = route;
  document.body.dataset.route = route;
  document.querySelectorAll("[data-route]").forEach((button) => {
    const routeMatches = button.dataset.route === route;
    const navView = button.dataset.navView || "";
    const viewMatches = route === "discover" ? navView === state.view : !navView;
    button.classList.toggle("active", routeMatches && viewMatches);
    if (routeMatches && viewMatches) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  home.classList.toggle("hidden", route !== "home");
  discover.classList.toggle("hidden", route !== "discover");
  if (!options.replace) {
    const target = route === "discover" ? discoverHashForView() : window.location.pathname;
    history.pushState({ route }, "", target);
  }
  if (route === "home") {
    setHomeSeo();
    renderHome();
  } else {
    setDiscoverSeo(currentNavItem());
    renderDiscover();
  }
  restoreReturnStateIfRequested();
}

function routeFromLocation() {
  const target = Object.values(SCREENING_ROOM_NAV).find((item) => item.hash === window.location.hash);
  if (!target) return "home";
  if (target.view) state.view = target.view;
  return target.route;
}

function discoverHashForView() {
  return currentNavItem().hash || "#discover";
}

function currentNavItem() {
  if (state.route === "home") return SCREENING_ROOM_NAV.home;
  return Object.values(SCREENING_ROOM_NAV).find((item) => item.view === state.view) || SCREENING_ROOM_NAV.discover;
}

function setHomeSeo() {
  if (!window.AwardsSeo) return;
  AwardsSeo.setMetadata({
    title: "The Screening Room",
    description: "Films worth following.",
    url: window.location.href.split("#")[0],
  });
}

function setDiscoverSeo(item = SCREENING_ROOM_NAV.discover) {
  if (!window.AwardsSeo) return;
  AwardsSeo.setMetadata({
    title: `The Screening Room - ${item.label}`,
    description: "Browse films by editorial category, release timing, awards path, and studio signal.",
    url: `${window.location.href.split("#")[0]}${item.hash || "#discover"}`,
  });
}

function persistReturnContext() {
  const item = currentNavItem();
  const context = {
    key: item.key,
    label: item.label,
    route: item.route,
    view: state.view,
    hash: item.hash,
    url: `./discovery.html${item.hash || ""}`,
    timing: state.timing,
    query: state.query,
    visible: state.visible,
    scrollY: Math.max(0, Math.round(window.scrollY || 0)),
    savedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(DISCOVERY_STATE_KEY, JSON.stringify(context));
  } catch {
    // Session storage is a convenience for state restoration; navigation remains valid without it.
  }
  return context;
}

function filmProfileUrl(profileUrl) {
  const context = persistReturnContext();
  const url = new URL(profileUrl, window.location.href);
  url.searchParams.set("from", context.key);
  return `${url.pathname.split("/").pop()}${url.search}${url.hash}`;
}

function restoreReturnStateIfRequested() {
  const shouldRestore = new URLSearchParams(window.location.search).get("sr_restore") === "1";
  if (!shouldRestore) return;
  try {
    const context = JSON.parse(sessionStorage.getItem(DISCOVERY_STATE_KEY) || "{}");
    if (!context || context.hash !== window.location.hash) return;
    state.timing = context.timing || "";
    state.query = context.query || "";
    state.visible = Math.max(30, Number(context.visible) || 30);
    const input = document.getElementById("globalSearch");
    if (input) input.value = state.query;
    if (state.route === "discover") renderDiscover();
    window.requestAnimationFrame(() => window.scrollTo(0, Math.max(0, Number(context.scrollY) || 0)));
    const clean = `${window.location.pathname}${window.location.hash}`;
    history.replaceState({ route: state.route, restored: true }, "", clean);
  } catch {
    // Invalid saved context should not block route rendering.
  }
}

function emptyState(title, detail) {
  return `<div class="empty" role="status"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>`;
}

function formatDateline(value) {
  if (!value || value === "Recent") return "Recent";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(date);
}

function compactReleaseDisplay(value) {
  return String(value || "")
    .replace(/^In theaters\s+/i, "")
    .replace(/^Streaming\s+/i, "Streaming ")
    .trim();
}

function homepageAwardsExplanation(item) {
  const detail = item.detail || {};
  const title = item.tile?.title || detail.title || "";
  const labels = [
    ...(item.tile?.contextual_labels?.labels || []),
    ...(detail.contextual_labels?.labels || []),
    item.tile?.public_badge?.label,
  ].filter(Boolean);
  const awardsPath = detail.awards_path || [];
  const genres = detail.genres || [];
  const hasAnimation = includesAny([...genres, ...awardsPath, ...labels], ["Animation", "Animated Feature", "Animation Contender"]);
  const hasCraft = includesAny([...awardsPath, ...labels], ["Craft Categories", "Craft Contender"]);
  const hasSongScore = includesAny(awardsPath, ["Song / Score"]);
  const hasFestival = /nyff|new york film festival|opening-night|selected as/i.test([
    detail.whats_changed,
    detail.why_watching,
    labels.join(" "),
  ].filter(Boolean).join(" "));
  const hasDirector = Boolean(detail.director && detail.director !== "Unknown");
  const distributor = detail.distributor && detail.distributor !== "Unknown" ? detail.distributor : "";
  const isVisibleFranchise = /\b(PAW Patrol|Spider-Man|Angry Birds|Movie 3|Beyond the Spider-Verse)\b/i.test(title);

  if (hasFestival && detail.director && distributor) {
    return `NYFF opening-night selection gives ${detail.director}’s ${distributor} release an early awards-season foothold.`;
  }
  if (hasAnimation && hasCraft && isVisibleFranchise && distributor) {
    return `High-profile animation from ${distributor} keeps it visible across animated-feature and craft races.`;
  }
  if (hasAnimation && hasCraft && isVisibleFranchise) {
    return "A known animated franchise gives it a clear path into feature-animation and craft consideration.";
  }
  if (hasAnimation && isVisibleFranchise) {
    return "A returning animated franchise keeps it relevant to the feature-animation race.";
  }
  if (hasAnimation && hasSongScore) {
    return "Animation and music elements give it multiple paths into craft and song-score consideration.";
  }
  if (hasAnimation && hasCraft && hasDirector) {
    return "Animation and genre craft give it a defined path beyond general release tracking.";
  }
  if (hasAnimation) {
    return "Its animation profile gives it a clear awards category to watch.";
  }
  return "";
}

function includesAny(values, needles) {
  return values.some((value) => needles.some((needle) => String(value || "").toLowerCase().includes(needle.toLowerCase())));
}

function festivalContextLabel(note, item) {
  if (/nyff/i.test(note)) return "NYFF 2026";
  const circuit = Array.isArray(item.detail.festival_circuit) ? item.detail.festival_circuit.find(Boolean) : "";
  if (circuit) return circuit;
  if (item.detail.festival_status) return item.detail.festival_status;
  return "Festival Signal";
}

function isMeaningfulHomepageSignal(signal) {
  const text = String(signal.signal || "");
  if (!text || /record refreshed|refreshed/i.test(text)) return false;
  if (/tmdb audience ratings are now available/i.test(text)) return false;
  return true;
}

function normalizeSignalCopy(value) {
  const text = String(value || "").trim();
  const releaseMatch = text.match(/^Release moved(?:\s+\w+)?\s+to\s+(\d{4}-\d{2}-\d{2})$/i);
  if (releaseMatch) return `Release moved to ${formatShortDateWithoutYear(releaseMatch[1])}.`;
  const isoDate = text.match(/(\d{4}-\d{2}-\d{2})/);
  let clean = text;
  if (isoDate) clean = text.replace(isoDate[1], formatShortDateWithoutYear(isoDate[1]));
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function formatShortDateWithoutYear(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" }).format(date);
  const dotted = ["Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].includes(month) ? `${month}.` : month;
  return `${dotted} ${day}`;
}

function errorState(title, message, detail) {
  return `<section class="intro error-state" role="alert"><p class="eyebrow">Error</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><p>${escapeHtml(detail)}</p></section>`;
}

function track(eventName, payload = {}) {
  if (window.AwardsAnalytics) AwardsAnalytics.track(eventName, payload);
}

function icon(name) {
  const paths = {
    star: '<path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9L12 3z"/>',
    spark: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
    diamond: '<path d="M12 3l8 9-8 9-8-9 8-9z"/>',
    radar: '<path d="M4 12a8 8 0 0 1 16 0"/><path d="M7 12a5 5 0 0 1 10 0"/><path d="M12 12l6-6"/>',
    frame: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 5v14M16 5v14"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name] || paths.diamond}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
