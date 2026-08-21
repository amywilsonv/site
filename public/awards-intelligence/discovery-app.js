const state = {
  homepage: null,
  discover: null,
  route: "home",
  view: "all",
  homeFilter: "all",
  timing: "",
  genre: "",
  festival: "",
  distributor: "",
  awardsProfile: "",
  sort: "Editorial",
  query: "",
  visible: 30,
  searchIndex: null,
};

const SCREENING_ROOM_NAV = {
  home: { key: "home", label: "Spotlight", route: "home", view: "", hash: "" },
  discover: { key: "discover", label: "Discover", route: "discover", view: "all", hash: "#discover" },
  awards: { key: "awards", label: "Awards Intelligence", route: "awards", view: "", hash: "#awards-intelligence" },
  about: { key: "about", label: "About", route: "about", view: "", hash: "#about" },
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
const about = document.getElementById("aboutView");
const modal = document.getElementById("filmModal");
const scrim = document.getElementById("modalScrim");
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
    const [homepage, discoverPayload, searchIndex] = await Promise.all([
      loadJson("data/discovery_homepage.json"),
      loadJson("data/discovery_discover.json"),
      loadJson("data/search_index.json").catch(() => null),
    ]);
    state.homepage = homepage;
    state.discover = discoverPayload;
    state.searchIndex = searchIndex;
    wireNavigation();
    renderHome();
    renderDiscover();
    renderAbout();
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
  window.addEventListener("popstate", () => setRoute(routeFromLocation(), { replace: true }));
  window.addEventListener("hashchange", () => setRoute(routeFromLocation(), { replace: true }));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
  scrim.addEventListener("click", closeModal);
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
  const spotlight = h.homepage_hero || spotlightFromFirstCard(h.awards_watch?.[0] || h.screening_room[0]);
  const festivalItems = state.discover?.views?.festivals?.all_items || [];
  home.innerHTML = `
    ${renderLastUpdatedIndicator(h.metadata?.last_updated)}
    ${nowInFocus(spotlight)}
    ${newNotableSection(dedupeItems(h.new_notable || h.screening_room, [filmPublicId({ tile: spotlight })]))}
    ${comingSoonSection(dedupeItems(h.opening_soon, [filmPublicId({ tile: spotlight })]))}
    ${festivalRadarSection(festivalItems, h.latest_signals || [])}
    ${awardsBriefingSection(h.awards_watch || [])}
    ${changesSection(h.latest_signals || [])}
  `;
  wireContent(home);
  track("spotlight_viewed", { profile_id: filmPublicId({ tile: spotlight }), tmdb_id: spotlight.tmdb_id, title: spotlight.title });
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
  const item = findItem(filmPublicId({ tile: spotlight }));
  const awardsMeta = awardsMetaForSpotlight(spotlight, item);
  return `
    <article class="now-focus" data-spotlight-id="${escapeHtml(filmPublicId({ tile: spotlight }))}">
      <div class="now-focus-copy">
        <p class="eyebrow">Now in Focus</p>
        <h2>${escapeHtml(spotlight.title || "Now in Focus")}</h2>
        <p class="focus-hook">${escapeHtml(spotlightLead(spotlight, item))}</p>
        ${awardsMeta.status ? awardsMarker(awardsMeta, "hero") : ""}
        ${spotlight.release_display ? `<p class="focus-release">${escapeHtml(spotlight.release_display)}</p>` : ""}
        <button class="spotlight-action" type="button" data-signal="${escapeHtml(filmPublicId({ tile: spotlight }))}">View Film <span aria-hidden="true">→</span></button>
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

function spotlightLead(spotlight, item) {
  return editorialAwardsExplanation(item || { tile: spotlight, detail: spotlight }, {
    fallback: spotlight.attention_hook,
    status: spotlight.awards_status,
    rank: spotlight.best_picture_rank,
  });
}

function newNotableSection(items) {
  const clean = dedupeItems(items, []);
  if (!clean.length) return "";
  return `
    <section class="home-section new-notable-section" data-collection="new-notable" aria-labelledby="newNotableTitle">
      ${sectionHeader("New & Notable", "Discovery picks from the full Film Discovery Universe.", "", "newNotableTitle")}
      <div class="poster-grid supporting compact-home-grid">
        ${clean.slice(0, 8).map((item) => card(item, "single-label")).join("")}
      </div>
    </section>
  `;
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
    <button class="release-card" type="button" data-id="${escapeHtml(filmPublicId(item))}" aria-label="Open ${escapeHtml(item.tile.title)}">
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
  const preview = clean.slice(0, 10);
  const action = `<button class="section-action" type="button" data-explore="festivals">View all${clean.length ? ` ${clean.length}` : ""}</button>`;
  return `
    <section class="home-section festival-bulletin" data-collection="festival-radar" aria-labelledby="festivalRadarTitle">
      ${sectionHeader("Festival Radar", "Verified festival signals worth tracking.", action, "festivalRadarTitle")}
      ${preview.length ? `<div class="festival-list">${preview.map((item) => festivalItem(item, signals)).join("")}</div>` : emptyState("No verified festival signals yet.", "Festival updates will appear here after they are supported by the current dataset.")}
    </section>
  `;
}

function festivalItem(item, signals) {
  const id = filmPublicId(item);
  const signal = signals.find((entry) => filmPublicId({ tile: entry }) === id && /festival|selected|opening-night|premiere|nyff/i.test(entry.signal || ""));
  const note = normalizeSignalCopy(signal?.signal || item.detail.whats_changed || item.detail.festival_display_status || "");
  const context = festivalContextLabel(note, item);
  return `
    <button class="festival-item" type="button" data-id="${escapeHtml(filmPublicId(item))}" aria-label="Open ${escapeHtml(item.tile.title)}">
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
  const action = `<button class="section-action" type="button" data-route="awards">View the full race <span aria-hidden="true">→</span></button>`;
  return `
    <section class="home-section awards-briefing" data-collection="awards-intelligence" aria-labelledby="awardsIntelligenceTitle">
      ${sectionHeader("Awards Watch", "Stabilized early-season outlook from Awards Intelligence.", action, "awardsIntelligenceTitle")}
      <div class="awards-brief-grid">
        ${clean.slice(0, 8).map(awardsBriefCard).join("")}
      </div>
      <button class="awards-mobile-link" type="button" data-route="awards">View the full race <span aria-hidden="true">→</span></button>
    </section>
  `;
}

function awardsBriefCard(item) {
  const ai = awardsIntelligenceForItem(item);
  const explanation = homepageAwardsExplanation(item);
  return `
    <button class="awards-brief-card" type="button" data-id="${escapeHtml(filmPublicId(item))}" aria-label="Open ${escapeHtml(item.tile.title)}">
      ${item.tile.poster_url ? `<img src="${escapeHtml(item.tile.poster_url)}" alt="${escapeHtml(item.tile.poster_alt)}">` : `<span class="awards-thumb-placeholder">${escapeHtml(item.tile.title)}</span>`}
      <span>
        ${awardsMarker(ai, "brief")}
        <strong>${escapeHtml(item.tile.title)}</strong>
        ${explanation ? `<em>${escapeHtml(explanation)}</em>` : ""}
      </span>
    </button>
  `;
}

function renderAwardsIntelligence() {
  const items = awardsRaceItems();
  const leader = items[0];
  const primaryRace = items.filter((item) => ["AWARDS LEADER", "STRONG CONTENDER", "CONTENDER"].includes(awardsIntelligenceForItem(item).awards_status));
  const bubble = items.filter((item) => awardsIntelligenceForItem(item).awards_status === "ON THE BUBBLE");
  const watchlist = items.filter((item) => awardsIntelligenceForItem(item).awards_status === "WATCHLIST");
  const stage = publicForecastStage(leader);
  discover.innerHTML = `
    <section class="awards-intelligence-route" aria-labelledby="awardsRouteHeading">
      <div class="awards-kicker">
        <span>Awards Intelligence</span>
        <span>Best Picture</span>
        <span>2027 Academy Awards</span>
      </div>
      <div class="awards-route-head">
        <div>
          <p class="eyebrow">${escapeHtml(stage.label)}</p>
          <h1 id="awardsRouteHeading">Best Picture Forecast</h1>
          <p>The current model-driven view of the Best Picture race. This forecast will evolve as festival, precursor, release, and campaign signals arrive through the season.</p>
        </div>
        <div class="awards-stage-card" aria-label="Current forecast stage">
          <strong>${escapeHtml(stage.shortLabel)}</strong>
          <span>${escapeHtml(stage.detail)}</span>
          ${stage.updated ? `<small>Updated ${escapeHtml(stage.updated)}</small>` : ""}
        </div>
      </div>
      ${leader ? awardsLeaderHero(leader) : emptyState("No public Best Picture forecast yet.", "Awards Intelligence will appear here when public-rankable contenders are available.")}
      ${primaryRace.length ? awardsRaceSection(primaryRace) : ""}
      ${bubble.length ? awardsQuietGroup("On The Bubble", "Films near the edge of the current public forecast, pending stronger season evidence.", bubble) : ""}
      ${watchlist.length ? awardsQuietGroup("Awards Watch", "Films tracked for possible movement as additional public awards evidence develops.", watchlist) : ""}
      ${awardsHowToRead(stage)}
    </section>
  `;
  wireContent(discover);
  track("collection_viewed", { collection: "awards-intelligence-race" });
}

function awardsLeaderHero(item) {
  const ai = awardsIntelligenceForItem(item);
  const image = item.detail.backdrop_url || item.tile.backdrop_url || item.tile.poster_url || item.detail.poster_url || "";
  return `
    <article class="awards-leader-hero">
      <div class="awards-leader-copy">
        ${awardsMarker(ai, "leader")}
        <h2>${escapeHtml(item.tile.title)}</h2>
        <p>${escapeHtml(editorialAwardsExplanation(item))}</p>
        ${item.tile.release_display ? `<span class="awards-release-line">${escapeHtml(item.tile.release_display)}</span>` : ""}
        ${movementMarker(ai)}
        <button class="spotlight-action" type="button" data-signal="${escapeHtml(filmPublicId(item))}">View Film <span aria-hidden="true">→</span></button>
      </div>
      <div class="awards-leader-image">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.tile.title)}">` : `<span>${escapeHtml(item.tile.title)}</span>`}
      </div>
    </article>
  `;
}

function awardsRaceSection(items) {
  return `
    <section class="awards-race-section" aria-labelledby="awardsRaceHeading">
      <div class="section-head editorial-head">
        <div>
          <p class="eyebrow">The Race</p>
          <h2 id="awardsRaceHeading">Ranked Contenders</h2>
        </div>
      </div>
      <div class="awards-race-list">
        ${items.map((item) => awardsRaceRow(item)).join("")}
      </div>
    </section>
  `;
}

function awardsRaceRow(item) {
  const ai = awardsIntelligenceForItem(item);
  return `
    <button class="awards-race-row" type="button" data-id="${escapeHtml(filmPublicId(item))}" aria-label="Open ${escapeHtml(item.tile.title)}">
      ${awardsIndex(ai)}
      ${item.tile.poster_url ? `<img src="${escapeHtml(item.tile.poster_url)}" alt="${escapeHtml(item.tile.poster_alt)}">` : `<span class="awards-race-placeholder">${escapeHtml(item.tile.title)}</span>`}
      <span class="awards-race-copy">
        <strong>${escapeHtml(item.tile.title)}</strong>
        <em>${escapeHtml(editorialAwardsExplanation(item))}</em>
        ${item.tile.release_display ? `<small>${escapeHtml(item.tile.release_display)}</small>` : ""}
      </span>
      ${movementMarker(ai)}
    </button>
  `;
}

function awardsQuietGroup(title, description, items) {
  return `
    <section class="awards-quiet-group" aria-labelledby="${escapeHtml(slugify(title))}">
      <div class="section-head editorial-head">
        <div>
          <p class="eyebrow">${escapeHtml(title)}</p>
          <h2 id="${escapeHtml(slugify(title))}">${escapeHtml(title)}</h2>
          <p>${escapeHtml(description)}</p>
        </div>
      </div>
      <div class="awards-quiet-list">
        ${items.map((item) => awardsQuietRow(item)).join("")}
      </div>
    </section>
  `;
}

function awardsQuietRow(item) {
  const ai = awardsIntelligenceForItem(item);
  return `
    <button class="awards-quiet-row" type="button" data-id="${escapeHtml(filmPublicId(item))}" aria-label="Open ${escapeHtml(item.tile.title)}">
      ${awardsIndex(ai)}
      <span>
        <strong>${escapeHtml(item.tile.title)}</strong>
        <em>${escapeHtml(editorialAwardsExplanation(item))}</em>
      </span>
      ${movementMarker(ai)}
    </button>
  `;
}

function awardsIndex(ai) {
  const rank = Number(ai?.best_picture_rank);
  if (!Number.isFinite(rank)) return `<span class="awards-list-index" aria-hidden="true">—</span>`;
  return `<span class="awards-list-index" aria-label="Current rank ${escapeHtml(rank)}">${escapeHtml(String(rank).padStart(2, "0"))}</span>`;
}

function awardsHowToRead(stage) {
  const steps = ["Early Season", "Festival Season", "Precursors", "Final Forecast"];
  return `
    <section class="awards-reading-guide" aria-labelledby="awardsReadHeading">
      <div>
        <p class="eyebrow">${escapeHtml(stage.shortLabel)}</p>
        <h2 id="awardsReadHeading">How to read this forecast</h2>
        <p>The forecast currently relies on release information, film characteristics, and available festival or awards signals. As the season progresses, additional awards indicators will enter the public view.</p>
      </div>
      <ol class="season-steps" aria-label="Awards season progression">
        ${steps.map((step, index) => `<li class="${index === 0 ? "active" : ""}"><span>${escapeHtml(step)}</span></li>`).join("")}
      </ol>
    </section>
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
                <p><strong>${escapeHtml(signal.title)}</strong> ${escapeHtml(normalizeSignalCopy(signal.signal))} <button class="dispatch-link" type="button" data-signal="${escapeHtml(filmPublicId({ tile: signal }))}">View Film <span aria-hidden="true">→</span></button></p>
              </article>
            `).join("")}
          </section>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDiscover() {
  const items = filteredItems();
  const shown = items.slice(0, state.visible);
  const title = SCREENING_ROOM_NAV.discover.label;
  const filterOptions = discoverFilterOptions();
  discover.innerHTML = `
    ${routeHeading(title, "Browse films by editorial category and release timing.", "discoverRouteHeading")}
    <div class="filter-bar">
      <div class="category-tabs">
        ${state.discover.top_categories.map((category) => `<button class="tab ${category.key === state.view ? "active" : ""}" type="button" data-view="${category.key}">${escapeHtml(category.label)}</button>`).join("")}
      </div>
      <div class="filter-row">
        ${filterSelect("timingFilter", "Release Timing", state.timing, filterOptions.releaseTiming)}
        ${filterSelect("genreFilter", "Genre", state.genre, filterOptions.genre)}
        ${filterSelect("festivalFilter", "Festival", state.festival, filterOptions.festival)}
        ${filterSelect("distributorFilter", "Distributor", state.distributor, filterOptions.distributor)}
        ${filterSelect("awardsProfileFilter", "Awards Profile", state.awardsProfile, filterOptions.awardsProfile)}
        ${filterSelect("sortFilter", "Sort: Editorial", state.sort, filterOptions.sort, { includeEmpty: false, prefix: "Sort: " })}
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
  wireFilterSelect("timingFilter", "timing");
  wireFilterSelect("genreFilter", "genre");
  wireFilterSelect("festivalFilter", "festival");
  wireFilterSelect("distributorFilter", "distributor");
  wireFilterSelect("awardsProfileFilter", "awardsProfile");
  wireFilterSelect("sortFilter", "sort");
  document.getElementById("loadMore")?.addEventListener("click", () => {
    state.visible += 30;
    renderDiscover();
  });
}

function filterSelect(id, label, value, options, config = {}) {
  const includeEmpty = config.includeEmpty !== false;
  const normalized = options || [];
  const prefix = config.prefix || "";
  return `
    <select id="${escapeHtml(id)}" aria-label="${escapeHtml(label)}" ${normalized.length ? "" : "disabled"}>
      ${includeEmpty ? `<option value="">${escapeHtml(label)}</option>` : ""}
      ${normalized.map((item) => {
        const optionValue = typeof item === "object" ? item.key : item;
        const optionLabel = typeof item === "object" ? item.label : item;
        return `<option value="${escapeHtml(optionValue)}" ${optionValue === value ? "selected" : ""}>${escapeHtml(prefix)}${escapeHtml(optionLabel)}</option>`;
      }).join("")}
    </select>
  `;
}

function wireFilterSelect(id, key) {
  document.getElementById(id)?.addEventListener("change", (event) => {
    state[key] = event.target.value;
    state.visible = 30;
    renderDiscover();
  });
}

function discoverFilterOptions() {
  const filters = state.discover.secondary_filters || {};
  return {
    releaseTiming: filters.release_timing || [],
    genre: genreOptions(),
    festival: (filters.festival || []).filter((item) => item !== "All Festivals"),
    distributor: filters.distributor || [],
    awardsProfile: filters.awards_profile || [],
    sort: filters.sort || ["Editorial", "Release Date", "Title"],
  };
}

function renderAbout() {
  about.innerHTML = `
    ${routeHeading("About", "A film-intelligence product for understanding which films matter, why they matter, and what changed.", "aboutRouteHeading")}
    <div class="about-route-grid">
      <section class="about-route-copy" aria-labelledby="aboutProductHeading">
        <p class="eyebrow">The Product</p>
        <h2 id="aboutProductHeading">The Screening Room turns release noise into film context.</h2>
        <p>It brings release timing, festival activity, audience attention, critical reception, awards signals, and availability into one editorial browsing experience.</p>
        <p>The goal is not to rank taste or replace criticism. It is a public-facing watch surface for films that are starting to matter commercially, culturally, or competitively.</p>
      </section>
      <section class="about-route-panel" aria-labelledby="aboutTracksHeading">
        <p class="eyebrow">What It Tracks</p>
        <h2 id="aboutTracksHeading">Signals in the current build</h2>
        <ul class="about-signal-list">
          <li><span>01</span><strong>Release timing</strong><em>Coming soon, opening windows, streaming availability, and theatrical context.</em></li>
          <li><span>02</span><strong>Festival radar</strong><em>Verified selections, premieres, awards, and meaningful festival positioning.</em></li>
          <li><span>03</span><strong>Awards context</strong><em>Category paths, precursor context, campaign activity, and current awards profile.</em></li>
          <li><span>04</span><strong>Audience momentum</strong><em>Public attention, rating volume, popularity, and availability signals where data exists.</em></li>
        </ul>
      </section>
      <section class="about-route-copy" aria-labelledby="aboutScoreHeading">
        <p class="eyebrow">Methodology</p>
        <h2 id="aboutScoreHeading">How the Screening Room Score works</h2>
        <p>The Screening Room Score is a film-intelligence signal score. It combines available audience momentum, TMDb audience rating data, campaign activity, watch availability, festival and awards context, and talent-profile signals.</p>
        <p>The current configured range is ${escapeHtml(SCREENING_ROOM_SCORE_METHODOLOGY.range)}. Higher scores mean more supported signals are present or stronger; lower scores usually mean fewer public, audience, campaign, availability, festival, awards, or talent signals are available yet.</p>
        <ul class="methodology-inline-list">
          ${SCREENING_ROOM_SCORE_METHODOLOGY.families.map(([label, detail]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(detail)}.</li>`).join("")}
        </ul>
        <p>The score is not a critic grade, box-office result, Oscar prediction, or guarantee of quality. Missing signals do not subtract points; they simply do not contribute until real data exists.</p>
      </section>
    </div>
  `;
}

function filteredItems() {
  let items = state.discover.views[state.view].all_items;
  if (state.timing) items = items.filter((item) => item.tile.release_timing.release_timing_key === state.timing);
  if (state.genre) items = items.filter((item) => itemGenres(item).includes(state.genre));
  if (state.festival) items = items.filter((item) => itemFestivalNames(item).includes(state.festival));
  if (state.distributor) items = items.filter((item) => item.detail.distributor === state.distributor);
  if (state.awardsProfile) items = items.filter((item) => item.detail.awards_profile === state.awardsProfile);
  if (state.query.trim()) {
    const query = state.query.trim().toLowerCase();
    items = items.filter((item) => [item.tile.title, item.detail.director, (item.detail.principal_cast || []).join(" ")].join(" ").toLowerCase().includes(query));
  }
  return sortItems(items, state.sort);
}

function genreOptions() {
  const values = allDiscoverItems()
    .flatMap((item) => itemGenres(item))
    .filter(Boolean);
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function allDiscoverItems() {
  return state.discover ? state.discover.views.all.all_items : [];
}

function itemGenres(item) {
  const indexed = searchRecordForItem(item);
  return [
    ...(item.detail.genres || []),
    ...(item.tile.genres || []),
    ...(indexed?.genres || []),
  ].filter(Boolean);
}

function searchRecordForItem(item) {
  const records = state.searchIndex?.records || [];
  if (!records.length) return null;
  const ids = new Set([
    filmPublicId(item),
    item.tile?.tmdb_id,
    item.detail?.tmdb_id,
    item.tile?.canonical_film_id,
    item.detail?.canonical_film_id,
  ].filter(Boolean).map(String));
  return records.find((record) => [record.id, record.tmdb_id].some((value) => ids.has(String(value || "")))) || null;
}

function itemFestivalNames(item) {
  const names = (item.detail.festival_history || []).map((festival) => festival.festival_name).filter(Boolean);
  const labels = [
    ...(item.tile.contextual_labels?.labels || []),
    ...(item.detail.contextual_labels?.labels || []),
  ];
  if (labels.some((label) => /multiple festivals/i.test(label)) || names.length > 1) names.push("Multiple Festivals");
  if (labels.some((label) => /nyff|new york film festival/i.test(label))) names.push("NYFF", "New York Film Festival");
  if (labels.some((label) => /cannes/i.test(label))) names.push("Cannes");
  if (labels.some((label) => /tiff|toronto/i.test(label))) names.push("TIFF");
  if (labels.some((label) => /venice/i.test(label))) names.push("Venice");
  if (labels.some((label) => /sundance/i.test(label))) names.push("Sundance");
  return [...new Set(names)];
}

function sortItems(items, sort) {
  const sorted = [...items];
  if (sort === "Title") {
    return sorted.sort((a, b) => itemTitle(a).localeCompare(itemTitle(b)));
  }
  if (sort === "Release Date") {
    return sorted.sort((a, b) => releaseTimestamp(a) - releaseTimestamp(b) || itemTitle(a).localeCompare(itemTitle(b)));
  }
  return sorted;
}

function itemTitle(item) {
  return item.tile?.title || item.detail?.title || "";
}

function releaseTimestamp(item) {
  const value = item.tile?.release_date || item.detail?.release_date || "";
  const time = value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function card(item, variant = "") {
  const cardVariant = typeof variant === "string" ? variant : "";
  const badge = displayBadgeForCard(item, cardVariant);
  const labels = cardVariant.includes("discover-card") || cardVariant.includes("single-label")
    ? [badge?.label].filter(Boolean)
    : contextualLabels(item).slice(0, 3);
  return `
    <button class="poster-card ${cardVariant} ${item.tile.is_awards_contender ? "awards" : ""} ${item.tile.is_lead ? "lead" : ""}" type="button" data-id="${escapeHtml(filmPublicId(item))}" aria-label="Open ${escapeHtml(item.tile.title)}">
      ${labels.length ? `<span class="badge-row">${labels.map((label, index) => `<span class="badge ${index ? "secondary-badge" : escapeHtml(badge?.class || "major")}">${index ? "" : icon(badge?.icon || "diamond")}${escapeHtml(label)}</span>`).join("")}</span>` : ""}
      ${item.tile.poster_url ? `<img class="poster-img" src="${escapeHtml(item.tile.poster_url)}" alt="${escapeHtml(item.tile.poster_alt)}">` : `<div class="placeholder">${escapeHtml(item.tile.title)}</div>`}
      <span class="poster-overlay"><span class="poster-title">${escapeHtml(item.tile.title_overlay)}</span><span class="poster-line">${escapeHtml(item.tile.release_display)}</span></span>
    </button>
  `;
}

function displayBadgeForCard(item, cardVariant = "") {
  const awardsBadge = awardsBadgeForItem(item, cardVariant);
  if (awardsBadge) return awardsBadge;
  if (cardVariant.includes("discover-card")) {
    return item.tile.discover_primary_tag || badgeFromPrimaryDiscoverLabel(item);
  }
  if (cardVariant.includes("single-label")) {
    const label = chooseCardLabel(item, cardVariant);
    return label ? badgeForLabel(item, label) : null;
  }
  return item.tile.public_badge;
}

function awardsBadgeForItem(item, cardVariant = "") {
  const ai = awardsIntelligenceForItem(item);
  if (!ai.public_card_behavior) return null;
  const allowWatchlist = cardVariant.includes("section-awards-intelligence") || state.view === "awards";
  const allowRanked = cardVariant.includes("section-awards-intelligence") || state.view === "awards" || !cardVariant.includes("discover-card");
  if (ai.public_card_behavior === "show_awards_status_and_rank" && ai.awards_status && allowRanked) {
    return { label: awardsStatusLabel(ai, cardVariant.includes("section-awards-intelligence")), icon: "star", class: "awards" };
  }
  if (ai.public_card_behavior === "optional_watchlist_badge" && allowWatchlist) {
    return { label: "WATCHLIST", icon: "star", class: "awards-muted" };
  }
  return null;
}

function awardsIntelligenceForItem(item) {
  return item?.detail?.awards_intelligence || item?.tile?.awards_intelligence || {};
}

function awardsStatusLabel(ai) {
  if (!ai) return "";
  return ai.awards_status || "";
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
    const ai = awardsIntelligenceForItem(item);
    if (ai.awards_status) return awardsStatusLabel(ai, true);
    if (ai.public_card_behavior === "optional_watchlist_badge") return "WATCHLIST";
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
  root.querySelectorAll(".poster-card, .release-card, .festival-item, .awards-brief-card, .awards-race-row, .awards-quiet-row").forEach((element) => {
    element.addEventListener("click", () => {
      track("homepage_card_click", { profile_id: element.dataset.id, route: state.route });
      track("film_opened", { profile_id: element.dataset.id, route: state.route });
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
      if (button.classList.contains("spotlight-action")) track("spotlight_clicked", { profile_id: button.dataset.signal });
      openDetail(findItem(button.dataset.signal));
    });
  });
  root.querySelectorAll("[data-methodology-open]").forEach((button) => {
    button.addEventListener("click", openMethodology);
  });
}

function allItems() {
  return [
    heroLookupItem(state.homepage.homepage_hero),
    ...(state.homepage.most_anticipated || []),
    ...(state.homepage.awards_watch || []),
    ...(state.homepage.new_notable || []),
    ...state.homepage.screening_room,
    ...state.homepage.opening_soon,
    ...state.homepage.building_buzz,
    ...Object.values(state.discover.views).flatMap((view) => view.all_items),
  ].filter(Boolean);
}

function heroLookupItem(hero) {
  if (!hero) return null;
  return {
    tile: hero,
    detail: {
      ...hero,
      id: filmPublicId(hero),
      profile_id: filmPublicId(hero),
      title: hero.title,
      release_display: hero.release_display || "",
      poster_url: hero.poster_url || "",
      backdrop_url: hero.backdrop_url || "",
      director: hero.director || "",
      why_watching: hero.attention_hook || "",
    },
  };
}

function filmPublicId(item) {
  const tile = item?.tile || item || {};
  const detail = item?.detail || {};
  return String(tile.profile_id || tile.id || detail.profile_id || detail.id || tile.canonical_film_id || detail.canonical_film_id || tile.tmdb_id || detail.tmdb_id || "");
}

function dedupeItems(items, excludeIds) {
  const seen = new Set(excludeIds.filter(Boolean));
  const clean = [];
  for (const item of items || []) {
    const id = filmPublicId(item);
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
    profile_id: filmPublicId(item),
    title: item.tile.title,
    poster_url: item.tile.poster_url,
    release_display: item.tile.release_display,
    director: item.detail.director,
    attention_hook: item.detail.why_watching,
    signal_labels: contextualLabels(item),
  };
}

function findItem(id) {
  return allItems().find((item) => filmPublicId(item) === id);
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
  track("film_detail_opened", { profile_id: filmPublicId(item), tmdb_id: item.tile.tmdb_id, title });
}

async function loadModalProfile(item) {
  const path = item.detail?.profile_payload_url || item.tile?.profile_payload_url;
  const id = filmPublicId(item);
  const candidates = [
    path,
    path && !path.startsWith("/") ? `/awards-intelligence/${path}` : "",
    id ? `data/films/${encodeURIComponent(id)}.json` : "",
    id ? `/awards-intelligence/data/films/${encodeURIComponent(id)}.json` : "",
  ].filter(Boolean);
  for (const candidate of [...new Set(candidates)]) {
    try {
      return await loadJson(candidate);
    } catch {
      // Try the next public data path; clean /screening-room routes are aliases.
    }
  }
  return null;
}

async function loadModalTimeline(item) {
  const id = filmPublicId(item);
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
  const ai = profile?.awards_intelligence || detail?.awards_intelligence || {};
  const intelligence = profile?.intelligence || detail?.intelligence || {};
  const score = profile?.screening_room_score || profile?.signals?.screening_room_score || detail?.screening_room_score || {};
  const numericScore = Number(score.score);
  if (ai.public_card_behavior === "show_awards_status_and_rank" || ai.public_card_behavior === "optional_watchlist_badge") {
    const explanation = editorialAwardsExplanation({ tile: detail, detail: { ...detail, awards_intelligence: ai } });
    return `
      <div class="modal-snapshot awards-outlook-snapshot">
        <strong>Best Picture Outlook</strong>
        ${awardsMarker(ai, "modal")}
        ${publicForecastStage({ detail: { awards_intelligence: ai } }).shortLabel ? `<span>${escapeHtml(publicForecastStage({ detail: { awards_intelligence: ai } }).shortLabel)}</span>` : ""}
        <p>${escapeHtml(explanation)}</p>
        ${ai.ranking_last_updated_at ? `<small>Updated ${escapeHtml(formatLastUpdatedDate(ai.ranking_last_updated_at))}</small>` : ""}
      </div>
    `;
  }
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
  return "";
}

function modalBoxOfficeSnapshot(profile) {
  const boxOffice = profile?.performance?.box_office || profile?.box_office || {};
  const commercial = profile?.commercial || {};
  const revenue = formatMoney(boxOffice.revenue || boxOffice.worldwide_gross || boxOffice.worldwide);
  const budget = formatMoney(boxOffice.budget);
  const revenueState = revenue || prereleaseBoxOfficeState(profile);
  const rows = [
    ["Revenue", revenueState],
    budget ? ["Budget", budget] : null,
    !budget && !revenue && boxOffice.status ? ["Status", boxOffice.status] : null,
    !budget && !revenue && commercial.release_strategy ? ["Release strategy", commercial.release_strategy] : null,
  ].filter(Boolean);
  return rows.length ? `
    <div class="modal-snapshot">
      <strong>TMDb Box Office</strong>
      <div class="box-office-snapshot modal-box-office-snapshot">
        ${rows.map(([label, value]) => `
          <div>
            <span>${escapeHtml(label)}</span>
            <p>${escapeHtml(value)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";
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

function openMethodology() {
  scrim.classList.remove("hidden");
  const aboutPanel = ensureMethodologyPanel();
  aboutPanel.classList.remove("hidden");
  aboutPanel.setAttribute("aria-label", "How the Screening Room Score works");
  aboutPanel.innerHTML = methodologyDialogHtml("How the Screening Room Score works");
  document.getElementById("closeMethodology").addEventListener("click", closeMethodology);
  document.getElementById("closeMethodology").focus();
  track("methodology_opened", { surface: state.route });
}

function closeMethodology() {
  document.getElementById("methodologyPanel")?.classList.add("hidden");
  scrim.classList.add("hidden");
}

function ensureMethodologyPanel() {
  let panel = document.getElementById("methodologyPanel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "methodologyPanel";
    panel.className = "film-modal about-modal hidden";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    document.body.append(panel);
  }
  return panel;
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
  const browserTitle = document.getElementById("browserTitle");
  if (browserTitle) browserTitle.textContent = `The Screening Room — ${currentNavItem().label}`;
  document.querySelectorAll("[data-route]").forEach((button) => {
    const routeMatches = button.dataset.route === route;
    const navView = button.dataset.navView || "";
    const viewMatches = route === "discover" ? navView === "all" : !navView;
    button.classList.toggle("active", routeMatches && viewMatches);
    if (routeMatches && viewMatches) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  home.classList.toggle("hidden", route !== "home");
  discover.classList.toggle("hidden", !["discover", "awards"].includes(route));
  about.classList.toggle("hidden", route !== "about");
  if (!options.replace) {
    const target = route === "discover" ? discoverHashForView() : currentNavItem().hash || window.location.pathname;
    history.pushState({ route }, "", target);
  }
  if (route === "home") {
    setHomeSeo();
    renderHome();
  } else if (route === "discover") {
    setDiscoverSeo(currentNavItem());
    renderDiscover();
  } else if (route === "awards") {
    setAwardsSeo();
    renderAwardsIntelligence();
  } else {
    setAboutSeo();
    renderAbout();
  }
  restoreReturnStateIfRequested();
}

function routeFromLocation() {
  if (window.location.hash === "#festival-radar") {
    state.view = "festivals";
    return "discover";
  }
  const target = Object.values(SCREENING_ROOM_NAV).find((item) => item.hash === window.location.hash);
  if (!target) return "home";
  if (target.view) state.view = target.view;
  return target.route;
}

function discoverHashForView() {
  return SCREENING_ROOM_NAV.discover.hash;
}

function currentNavItem() {
  if (state.route === "home") return SCREENING_ROOM_NAV.home;
  if (state.route === "awards") return SCREENING_ROOM_NAV.awards;
  if (state.route === "about") return SCREENING_ROOM_NAV.about;
  return SCREENING_ROOM_NAV.discover;
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

function setAwardsSeo() {
  if (!window.AwardsSeo) return;
  AwardsSeo.setMetadata({
    title: "Awards Intelligence | The Screening Room",
    description: "The current model-driven Best Picture forecast inside The Screening Room.",
    url: `${window.location.href.split("#")[0]}#awards-intelligence`,
  });
}

function setAboutSeo() {
  if (!window.AwardsSeo) return;
  AwardsSeo.setMetadata({
    title: "About | The Screening Room",
    description: "How The Screening Room tracks films, signals, and release context.",
    url: `${window.location.href.split("#")[0]}#about`,
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
    url: `/screening-room/${item.hash || ""}`,
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

function awardsRaceItems() {
  const allowed = new Set(["AWARDS LEADER", "STRONG CONTENDER", "CONTENDER", "ON THE BUBBLE", "WATCHLIST"]);
  return dedupeItems(state.discover?.views?.awards?.all_items || [], [])
    .filter((item) => allowed.has(awardsIntelligenceForItem(item).awards_status))
    .sort((a, b) => awardsRank(a) - awardsRank(b) || a.tile.title.localeCompare(b.tile.title));
}

function awardsRank(item) {
  const ai = awardsIntelligenceForItem(item);
  const rank = Number(ai.best_picture_rank);
  return Number.isFinite(rank) ? rank : 999;
}

function awardsMetaForSpotlight(spotlight, item) {
  const ai = awardsIntelligenceForItem(item) || {};
  return {
    best_picture_rank: ai.best_picture_rank || spotlight.best_picture_rank,
    awards_status: ai.awards_status || spotlight.awards_status,
    status: ai.awards_status || spotlight.awards_status || "",
  };
}

function awardsMarker(source, variant = "") {
  const ai = source || {};
  const rank = Number(ai.best_picture_rank);
  const status = ai.awards_status || ai.status || "";
  if (!status && !Number.isFinite(rank)) return "";
  const displayRank = Number.isFinite(rank) ? `Current rank ${String(rank).padStart(2, "0")}` : "";
  const label = status || "WATCHLIST";
  return `
    <span class="awards-rank-marker ${variant ? `awards-rank-${escapeHtml(variant)}` : ""}">
      <span class="awards-rank-label">${escapeHtml(label)}</span>
      ${displayRank ? `<span class="awards-rank-number">${escapeHtml(displayRank)}</span>` : ""}
    </span>
  `;
}

function publicForecastStage(item) {
  const ai = awardsIntelligenceForItem(item);
  const updated = formatLastUpdatedDate(ai.ranking_last_updated_at || state.homepage?.metadata?.last_updated);
  return {
    label: "Early Season Forecast",
    shortLabel: "Early Season",
    detail: "Release profiles and early festival signals carry more weight before precursor awards arrive.",
    updated,
  };
}

function editorialAwardsExplanation(item, options = {}) {
  const ai = awardsIntelligenceForItem(item);
  const status = options.status || ai.awards_status || "";
  const rank = Number(options.rank || ai.best_picture_rank);
  const reasons = (ai.why_it_ranks || [])
    .map(publicAwardsReason)
    .filter(Boolean);
  const unique = [...new Set(reasons)].slice(0, 2);
  if (unique.length) return unique.join(" ");
  const fallback = String(options.fallback || "");
  if (fallback && !isRawAwardsReason(fallback)) return normalizeSignalCopy(fallback);
  if (status === "AWARDS LEADER" || rank === 1) return "Currently leads the model's early Best Picture forecast, with the race still developing as more season evidence arrives.";
  if (status === "STRONG CONTENDER") return "Ranks among the strongest early-season contenders in the current public forecast.";
  if (status === "CONTENDER") return "Currently holds a competitive early-season position in the Best Picture race.";
  if (status === "ON THE BUBBLE") return "Sits near the edge of the current race and needs more season evidence.";
  if (status === "WATCHLIST") return "Remains on the awards watchlist pending stronger public signals.";
  return "Currently ranks among the model's early-season films to watch.";
}

function publicAwardsReason(reason) {
  const code = String(reason?.code || "").toUpperCase();
  const text = String(reason?.text || "");
  if (!code && isRawAwardsReason(text)) return "";
  if (/FALL_AWARDS_WINDOW_RELEASE/.test(code)) return "Positioned in the traditional awards-season release window.";
  if (/SELECTED_AT_NYFF/.test(code)) return "Building visibility through a New York Film Festival selection.";
  if (/CANNES|VENICE|TIFF|TELLURIDE|SUNDANCE|FESTIVAL/.test(code) && !/LIMITED_MODEL_EVIDENCE/.test(code)) return "Building visibility on the festival circuit.";
  if (/LIMITED_MODEL_EVIDENCE/.test(code)) return "Current placement is based on limited public evidence and may move as the season develops.";
  if (isRawAwardsReason(text)) return "";
  return normalizeSignalCopy(text);
}

function isRawAwardsReason(value) {
  return /runtime bucket|static metadata|production metadata|genre profile|feature bucket|raw_|logistic|probability|country metadata/i.test(String(value || ""));
}

function movementMarker(ai) {
  const movement = ai?.rank_change ?? ai?.movement;
  if (movement === null || movement === undefined || movement === "") return "";
  if (movement === "NEW") return `<span class="awards-movement is-new">NEW</span>`;
  const numeric = Number(movement);
  if (!Number.isFinite(numeric) || numeric === 0) return `<span class="awards-movement">—</span>`;
  const direction = numeric > 0 ? "up" : "down";
  const symbol = numeric > 0 ? "↑" : "↓";
  return `<span class="awards-movement is-${direction}">${symbol} ${escapeHtml(Math.abs(numeric))}</span>`;
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function homepageAwardsExplanation(item) {
  return editorialAwardsExplanation(item);
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
