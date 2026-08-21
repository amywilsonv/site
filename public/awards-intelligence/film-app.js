const view = document.getElementById("filmView");
const SCREENING_ROOM_NAV = {
  home: { key: "home", label: "Home", href: "./discovery.html" },
  discover: { key: "discover", label: "Discover", href: "./discovery.html#discover" },
  festivals: { key: "festivals", label: "Festival Radar", href: "./discovery.html#festival-radar" },
  awards: { key: "awards", label: "Awards Intelligence", href: "./discovery.html#awards-intelligence" },
};

const DISCOVERY_STATE_KEY = "screening-room:return-context";
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
  renderFilmLoading();
  if (window.AwardsSearch) {
    AwardsSearch.wireGlobalSearch(document.getElementById("globalSearch"), document.getElementById("searchPanel"));
  }
  const id = new URLSearchParams(window.location.search).get("id");
  const returnContext = filmReturnContext();
  updatePrimaryNavForReturnContext(returnContext);
  if (!id) {
    renderFilmError("Film not found", "No film ID was provided.", "Choose another tracked film.", returnContext);
    return;
  }
  try {
    const [profile, timeline, homepage] = await Promise.all([
      loadJson(`data/films/${encodeURIComponent(id)}.json`),
      loadJson(`data/timelines/${encodeURIComponent(id)}.json`),
      loadJson("data/discovery_homepage.json").catch(() => null),
    ]);
    setFilmSeo(profile);
    renderFilm(profile, timeline, homepage?.metadata?.last_updated, returnContext);
    track("film_page_viewed", { tmdb_id: id, title: profile.film_identity.title });
  } catch (error) {
    renderFilmError("Film not found", error.message, "The film may not have a production profile yet.", returnContext);
  }
}

function renderFilmLoading() {
  view.innerHTML = `
    <section class="intro film-intelligence-head" aria-busy="true">
      <p class="eyebrow">Film</p>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line wide"></div>
    </section>
    <section class="film-intelligence-layout" aria-label="Loading film profile">
      <div class="skeleton skeleton-poster"></div>
      <div class="film-intelligence-main">
        ${Array.from({ length: 6 }, () => `<div class="detail-section"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line wide"></div></div>`).join("")}
      </div>
    </section>
  `;
}

function renderFilmError(title, message, detail, returnContext = filmReturnContext()) {
  view.innerHTML = `
    <section class="intro error-state" role="alert">
      <p class="eyebrow">Film</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <p>${escapeHtml(detail)}</p>
      ${returnControl(returnContext)}
    </section>
  `;
  wireReturnControl(returnContext);
}

function renderFilm(profile, timeline, lastUpdated, returnContext) {
  const identity = profile.film_identity;
  const editorial = profile.editorial;
  const festival = profile.festival;
  const commercial = profile.commercial;
  const talent = profile.talent;
  const attention = profile.attention_intelligence || {};
  const reasons = attention.attention_reasons || [];
  const allEvents = timeline?.events || profile.timeline?.events || [];
  const signalEvents = meaningfulSignalEvents(allEvents);
  view.innerHTML = `
    <section class="film-profile-hero film-profile-v2">
      <div class="film-profile-backdrop" style="${identity.backdrop ? `background-image:url('${escapeAttribute(identity.backdrop)}')` : ""}"></div>
      ${renderLastUpdatedIndicator(lastUpdated)}
      <div class="film-return-slot">${returnControl(returnContext)}</div>
      <div>
        ${identity.poster ? `<img class="poster-img-static film-page-poster" src="${escapeHtml(identity.poster)}" alt="${escapeHtml(identity.title)} poster" loading="eager">` : `<div class="poster-img-static placeholder film-page-poster" role="img" aria-label="Poster unavailable for ${escapeHtml(identity.title)}">${escapeHtml(identity.title)}</div>`}
      </div>
      <div class="film-profile-copy">
        <p class="eyebrow">${escapeHtml(editorial.editorial_category)}</p>
        <h1>${escapeHtml(identity.title)}</h1>
        <p>${escapeHtml(identity.release_display)}${talent.director ? ` · Directed by ${escapeHtml(talent.director)}` : ""}</p>
        <div class="signal-chips">${reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}</div>
        <p>${escapeHtml(heroSummary(profile))}</p>
        <div class="hero-snapshot-grid" aria-label="Film intelligence snapshots">
          ${heroRatingsSnapshot(profile)}
          ${heroOscarSnapshot(profile)}
          ${heroBoxOfficeSnapshot(profile)}
        </div>
      </div>
    </section>

    ${filmSection("Reception & Performance", `
      <div class="performance-dashboard">
        ${performancePanel("Audience", audienceMetrics(profile))}
        ${performancePanel("Critics", criticsMetrics(profile))}
        ${performancePanel("Box Office", boxOfficeMetrics(profile))}
        ${watchProviderPanel(profile)}
        ${latestMediaPanel(profile)}
      </div>
    `)}

    ${filmSection("Oscar Intelligence", `
      ${renderOscarIntelligence(profile)}
    `)}

    ${filmSection("Latest Developments", `
      <div class="signal-feed" aria-label="Recent intelligence signals">
        ${renderSignalFeed(signalEvents, profile)}
      </div>
    `)}

    ${filmSection("Cast & Crew", `
      <div class="person-grid">
        ${intelligenceCard("Director", talent.director || "Director unavailable")}
        ${intelligenceCard("Principal cast", (talent.principal_cast || []).slice(0, 8).join(", ") || "Cast unavailable")}
        ${intelligenceCard("Production companies", (commercial.studio || []).join(", ") || "Production companies unavailable")}
        ${intelligenceCard("Festival", festival.display_status || festival.festival_status || "No verified festival information in the current dataset.", renderFestivalRecords(festival.festival_history || []), { htmlMeta: true })}
      </div>
    `)}
  `;
  wireMethodologyControls();
  wireReturnControl(returnContext);
}

function returnControl(context) {
  const clean = sanitizeReturnContext(context);
  return `<a class="film-return-link" href="${escapeHtml(clean.href)}" data-film-return>${escapeHtml(`Back to ${clean.label}`)}</a>`;
}

function wireReturnControl(context) {
  view.querySelectorAll("[data-film-return]").forEach((link) => {
    link.addEventListener("click", () => {
      persistReturnContext(sanitizeReturnContext(context));
      track("film_return_clicked", { destination: sanitizeReturnContext(context).key });
    });
  });
}

function filmReturnContext() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get("from") || "";
  const nav = SCREENING_ROOM_NAV[from];
  const stored = storedReturnContext();
  if (nav) {
    return sanitizeReturnContext({ ...stored, ...nav, href: returnHref(nav) });
  }
  return sanitizeReturnContext({ ...SCREENING_ROOM_NAV.home, href: returnHref(SCREENING_ROOM_NAV.home), fallback: true });
}

function storedReturnContext() {
  try {
    return JSON.parse(sessionStorage.getItem(DISCOVERY_STATE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function sanitizeReturnContext(context) {
  const nav = SCREENING_ROOM_NAV[context?.key] || SCREENING_ROOM_NAV.home;
  return {
    ...context,
    key: nav.key,
    label: nav.label,
    href: returnHref(nav),
  };
}

function returnHref(nav) {
  const base = nav.href || SCREENING_ROOM_NAV.home.href;
  return `${base.includes("?") ? `${base}&` : `${base.split("#")[0]}?`}sr_restore=1${base.includes("#") ? `#${base.split("#")[1]}` : ""}`;
}

function persistReturnContext(context) {
  try {
    sessionStorage.setItem(DISCOVERY_STATE_KEY, JSON.stringify({ ...context, savedAt: new Date().toISOString() }));
  } catch {
    // Navigation remains safe when session storage is unavailable.
  }
}

function updatePrimaryNavForReturnContext(context) {
  const key = sanitizeReturnContext(context).key;
  document.querySelectorAll("[data-nav-key]").forEach((link) => {
    if (link.dataset.navKey === key) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function renderLastUpdatedIndicator(value) {
  const formatted = formatLastUpdatedDate(value);
  return formatted ? `<p class="last-updated">Last updated ${escapeHtml(formatted)}</p>` : "";
}

function formatLastUpdatedDate(value) {
  if (!value || typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date).replace(/^([A-Za-z]{3}) /, "$1. ");
}

function filmSection(title, content) {
  return `
    <section class="film-section" aria-labelledby="${sectionId(title)}">
      <div class="section-head film-section-head"><h2 id="${sectionId(title)}">${escapeHtml(title)}</h2></div>
      ${content}
    </section>
  `;
}

function heroRatingsSnapshot(profile) {
  const ratings = profile.ratings || profile.performance?.ratings || {};
  const tmdb = ratings.tmdb || {};
  return `
    <article class="hero-snapshot-card">
      <strong>TMDb Data</strong>
      <div class="ratings-snapshot">
        ${ratingPill("TMDb rating", tmdb)}
        ${ratingPill("TMDb popularity", profile.performance?.tmdb_popularity || tmdb.popularity)}
      </div>
    </article>
  `;
}

function heroOscarSnapshot(profile) {
  const probabilities = realOscarProbabilities(profile.awards?.probabilities || {});
  if (!Object.keys(probabilities).length) {
    return `
      <article class="hero-snapshot-card">
        <strong>Oscar Intelligence</strong>
        <p>Coming Soon</p>
        <span>Nomination and win probabilities will appear here.</span>
      </article>
    `;
  }
  return `
    <article class="hero-snapshot-card">
      <strong>Oscar Intelligence</strong>
      <p>Model available</p>
      <span>${escapeHtml(Object.keys(probabilities).slice(0, 2).join(", "))}</span>
    </article>
  `;
}

function heroBoxOfficeSnapshot(profile) {
  const boxOffice = profile.performance?.box_office || profile.box_office || {};
  const commercial = profile.commercial || {};
  const revenue = positiveNumber(boxOffice.revenue || boxOffice.worldwide_gross || boxOffice.worldwide);
  const budget = positiveNumber(boxOffice.budget);
  return `
    <article class="hero-snapshot-card">
      <strong>TMDb Box Office</strong>
      <p>${escapeHtml(formatMoney(revenue) || formatMoney(budget) || prereleaseBoxOfficeState(profile))}</p>
      <span>${escapeHtml(revenue ? "Reported revenue" : budget ? "Reported budget" : boxOffice.status || commercial.release_strategy || "Results unavailable")}</span>
    </article>
  `;
}

function ratingPill(label, value) {
  return `
    <span class="rating-pill">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(formatRating(label, value))}</strong>
    </span>
  `;
}

function intelligenceCard(title, body, meta = "", options = {}) {
  const htmlMeta = options.htmlMeta ? meta : escapeHtml(meta);
  return `
    <article class="intelligence-card ${options.featured ? "featured" : ""}">
      <strong>${escapeHtml(title)}</strong>
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
      ${meta ? `<div class="${options.htmlMeta ? "card-meta-html" : "card-meta"}">${htmlMeta}</div>` : ""}
    </article>
  `;
}

function performancePanel(title, metrics) {
  return `
    <article class="performance-panel">
      <strong>${escapeHtml(title)}</strong>
      <div>
        ${metrics.map((metric) => `
          <div class="performance-row">
            <span>${escapeHtml(metric.label)}</span>
            <b>${escapeHtml(metric.value)}</b>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function audienceMetrics(profile) {
  const ratings = profile.ratings || profile.performance?.ratings || {};
  const tmdb = ratings.tmdb || {};
  const rows = [
    { label: "TMDb rating", value: formatRating("TMDb rating", tmdb) },
    { label: "TMDb popularity", value: formatPopularity(profile.performance?.tmdb_popularity || tmdb.popularity) },
  ];
  const voteCount = formatVoteCount(tmdb.vote_count);
  if (voteCount) rows.splice(1, 0, { label: "TMDb vote count", value: voteCount });
  if (ratings.imdb) rows.push({ label: "IMDb", value: formatRating("IMDb", ratings.imdb) });
  if (ratings.letterboxd) rows.push({ label: "Letterboxd", value: formatRating("Letterboxd", ratings.letterboxd) });
  if (ratings.rotten_tomatoes_popcornmeter || ratings.popcornmeter) {
    rows.push({ label: "Rotten Tomatoes Popcornmeter", value: formatRating("Rotten Tomatoes Popcornmeter", ratings.rotten_tomatoes_popcornmeter || ratings.popcornmeter) });
  }
  return rows;
}

function criticsMetrics(profile) {
  const ratings = profile.ratings || profile.performance?.ratings || {};
  return [
    { label: "Rotten Tomatoes Tomatometer", value: formatRating("Rotten Tomatoes Tomatometer", ratings.rotten_tomatoes_tomatometer || ratings.rotten_tomatoes || ratings.rottenTomatoes) },
    { label: "Metacritic", value: formatRating("Metacritic", ratings.metacritic) },
    { label: "Status", value: profile.performance?.critics?.status || "Reviews pending" },
  ];
}

function boxOfficeMetrics(profile) {
  const boxOffice = profile.performance?.box_office || profile.box_office || {};
  const state = prereleaseBoxOfficeState(profile);
  const rows = [];
  const budget = formatMoney(boxOffice.budget);
  const revenue = formatMoney(boxOffice.revenue);
  if (budget) rows.push({ label: "TMDb budget", value: budget });
  if (revenue) rows.push({ label: "TMDb revenue", value: revenue });
  if (boxOffice.opening_weekend) rows.push({ label: "Opening weekend", value: formatMoney(boxOffice.opening_weekend) || state });
  if (boxOffice.domestic_gross || boxOffice.domestic) rows.push({ label: "Domestic", value: formatMoney(boxOffice.domestic_gross || boxOffice.domestic) || state });
  if (boxOffice.international_gross || boxOffice.international) rows.push({ label: "International", value: formatMoney(boxOffice.international_gross || boxOffice.international) || state });
  if (boxOffice.worldwide_gross || boxOffice.worldwide) rows.push({ label: "Worldwide", value: formatMoney(boxOffice.worldwide_gross || boxOffice.worldwide) || state });
  if (boxOffice.projection) rows.push({ label: "Projection", value: formatMoney(boxOffice.projection) || "Unavailable" });
  return rows.length ? rows : [{ label: "Status", value: state }];
}

function watchProviderPanel(profile) {
  const providers = profile.performance?.watch_providers || {};
  const rows = watchProviderRows(providers);
  if (!rows.length) return "";
  return `
    <article class="performance-panel">
      <strong>TMDb Watch Options</strong>
      <div>
        ${rows.map((row) => `
          <div class="performance-row">
            <span>${escapeHtml(row.label)}</span>
            <b>${escapeHtml(row.value)}</b>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function latestMediaPanel(profile) {
  const trailer = latestTrailer(profile);
  const rows = latestMediaRows(profile, trailer);
  return `
    <article class="performance-panel latest-media-panel">
      <strong>Latest Media</strong>
      <div>
        ${rows.length ? rows.map((row) => `
          <div class="performance-row">
            <span>${escapeHtml(row.label)}</span>
            <b>${row.url ? `<a href="${escapeHtml(row.url)}" target="_blank" rel="noopener">Watch trailer</a>` : escapeHtml(row.value)}</b>
          </div>
        `).join("") : `<p class="panel-empty">No media items available yet.</p>`}
      </div>
    </article>
  `;
}

function renderSignalFeed(events) {
  if (!events.length) {
    return `<div class="empty compact-empty" role="status"><strong>No major developments yet.</strong><p>This section will surface trailers, festival announcements, reviews, release-date changes, box-office updates, Oscar probability movement, and major industry news.</p></div>`;
  }
  return events.slice(0, 5).map((event) => signalFeedItem(event)).join("");
}

function signalFeedItem(event) {
  return `
    <article class="signal-feed-item ${escapeHtml((event.importance || "Medium").toLowerCase())}">
      <time>${escapeHtml(formatDate(event.timestamp))}</time>
      <div>
        <strong>${escapeHtml(event.title || event.event_type || "Signal changed")}</strong>
        <p>${escapeHtml(signalWhatHappened(event))}</p>
        <p><b>Why it matters:</b> ${escapeHtml(signalWhyItMatters(event))}</p>
        ${signalMetricsChanged(event) ? `<p><b>Measurable impact:</b> ${escapeHtml(signalMetricsChanged(event))}</p>` : ""}
      </div>
    </article>
  `;
}

function renderOscarIntelligence(profile) {
  const probabilities = realOscarProbabilities(profile.awards?.probabilities || {});
  return `
    <div class="oscar-model-grid">
      ${screeningRoomIntelligencePanel(profile)}
      ${oscarModelPanel("Nomination Model", "Coming Soon", "Will estimate nomination probability by Academy Award category.", "nomination_probability", probabilities)}
      ${oscarModelPanel("Winner Model", "Coming Soon", "Will estimate win probability and recalculate after nominees are announced.", "win_probability", probabilities)}
    </div>
  `;
}

function screeningRoomIntelligencePanel(profile) {
  const score = profile.screening_room_score || profile.signals?.screening_room_score || {};
  const intelligence = profile.intelligence || {};
  const numericScore = Number(score.score);
  if (!Number.isFinite(numericScore) && !intelligence.summary) return "";
  const confidence = intelligence.confidence || score.confidence || "Unavailable";
  const explanation = intelligence.summary || score.explanation || "No current explanation available.";
  const headline = intelligence.headline || "Screening Room intelligence";
  return `
    <article class="oscar-model-panel">
      <div class="score-panel-title">
        <strong>Screening Room Score</strong>
        <button class="methodology-link" type="button" data-methodology-open aria-haspopup="dialog">How this score works</button>
      </div>
      ${Number.isFinite(numericScore) ? `<div class="oscar-model-row"><strong>${Math.round(numericScore)}</strong><span>${escapeHtml(confidence)} confidence</span><em>Score</em></div>` : ""}
      <p>${escapeHtml(headline)}</p>
      <span>${escapeHtml(explanation)}</span>
    </article>
  `;
}

function wireMethodologyControls() {
  view.querySelectorAll("[data-methodology-open]").forEach((button) => {
    button.addEventListener("click", openMethodologyDialog);
  });
}

function openMethodologyDialog() {
  const { scrim, dialog } = ensureMethodologyDialog();
  scrim.classList.remove("hidden");
  dialog.classList.remove("hidden");
  dialog.innerHTML = methodologyDialogHtml("How the Screening Room Score works");
  dialog.querySelector("[data-methodology-close]")?.addEventListener("click", closeMethodologyDialog);
  scrim.addEventListener("click", closeMethodologyDialog, { once: true });
  dialog.querySelector("[data-methodology-close]")?.focus();
}

function closeMethodologyDialog() {
  document.getElementById("methodologyScrim")?.classList.add("hidden");
  document.getElementById("methodologyDialog")?.classList.add("hidden");
}

function ensureMethodologyDialog() {
  let scrim = document.getElementById("methodologyScrim");
  let dialog = document.getElementById("methodologyDialog");
  if (!scrim) {
    scrim = document.createElement("div");
    scrim.id = "methodologyScrim";
    scrim.className = "modal-scrim hidden";
    document.body.append(scrim);
  }
  if (!dialog) {
    dialog = document.createElement("section");
    dialog.id = "methodologyDialog";
    dialog.className = "film-modal methodology-modal hidden";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "methodologyTitle");
    document.body.append(dialog);
  }
  return { scrim, dialog };
}

function methodologyDialogHtml(title) {
  return `
    <button class="chip close" type="button" data-methodology-close>Close</button>
    <p class="eyebrow">Methodology</p>
    <h2 id="methodologyTitle">${escapeHtml(title)}</h2>
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

function heroSummary(profile) {
  const synopsis = plotSynopsis(profile);
  return synopsis || "Synopsis unavailable.";
}

function plotSynopsis(profile) {
  const synopsis = profile.film_identity?.synopsis || "";
  return synopsis.trim();
}

function oscarModelPanel(title, status, description, probabilityKey, probabilities) {
  const rows = Object.entries(probabilities)
    .filter(([, probability]) => probability.key === probabilityKey)
    .map(([category, probability]) => `
      <div class="oscar-model-row">
        <strong>${escapeHtml(category)}</strong>
        <span>${escapeHtml(probability.label)}</span>
        <em>${Math.round(probability.value)}%</em>
      </div>
    `);
  return `
    <article class="oscar-model-panel">
      <strong>${escapeHtml(title)}</strong>
      ${rows.length ? rows.join("") : `<p>${escapeHtml(status)}</p><span>${escapeHtml(description)}</span>`}
    </article>
  `;
}

function latestMediaRows(profile, trailer) {
  const media = profile.media || {};
  const rows = [];
  if (trailer) rows.push({ label: trailer.kind || "Trailer", value: trailer.title, url: trailer.url });
  if (media.latest_teaser) rows.push({ label: "Teaser", value: media.latest_teaser.title || "Teaser", url: media.latest_teaser.url || "" });
  if (media.latest_featurette) rows.push({ label: "Featurette", value: media.latest_featurette.title || "Featurette", url: media.latest_featurette.url || "" });
  if (media.latest_interview) rows.push({ label: "Interview", value: media.latest_interview.title || "Interview", url: media.latest_interview.url || "" });
  if (media.latest_article) rows.push({ label: "Major Article", value: media.latest_article.title || "Article", url: media.latest_article.url || "" });
  return rows.slice(0, 4);
}

function signalWhyItMatters(event) {
  const type = String(event.event_type || "").toLowerCase();
  if (type.includes("trailer") || type.includes("teaser")) return "New campaign material gives the film a clearer public-facing signal.";
  if (type.includes("festival")) return "Festival placement can create the first meaningful reception and industry-positioning signal.";
  if (type.includes("release")) return "Release timing can reshape campaign windows, box-office context, and awards-season positioning.";
  if (type.includes("cast") || type.includes("director")) return "Talent news can change how the film is evaluated across performance, directing, and pedigree.";
  if (type.includes("review")) return "Reviews provide the first external reception signal.";
  if (type.includes("box office")) return "Commercial results can affect audience momentum and campaign visibility.";
  if (type.includes("nomination probability") || type.includes("win probability")) return "Model movement changes the film's awards outlook.";
  return "This is an external signal worth tracking as the film's profile develops.";
}

function signalMetricsChanged(event) {
  const type = String(event.event_type || "").toLowerCase();
  const metadata = event.metadata || {};
  const metrics = [];
  if (type.includes("festival")) metrics.push("Festival status");
  if (type.includes("release")) metrics.push("Release date");
  if (type.includes("trailer") || type.includes("teaser") || type.includes("featurette")) metrics.push("Latest media");
  if (type.includes("review")) metrics.push("Critics");
  if (type.includes("box office")) metrics.push("Box office");
  if (type.includes("nomination probability")) metrics.push("Nomination probability");
  if (type.includes("win probability")) metrics.push("Win probability");
  if (type.includes("cast")) metrics.push("Cast");
  if (type.includes("director")) metrics.push("Director");
  if (metadata.metric) metrics.push(metadata.metric);
  return [...new Set(metrics)].join(", ");
}

function signalWhatHappened(event) {
  return event.summary || event.title || "A tracked intelligence signal changed.";
}

function meaningfulSignalEvents(events) {
  return (events || []).filter((event) => {
    const type = String(event.event_type || "").toLowerCase();
    const summary = String(event.summary || "").toLowerCase();
    const title = String(event.title || "").toLowerCase();
    if (type === "release scheduled") return false;
    if (type === "homepage featured") return false;
    if (type === "editorial note") return false;
    if (type === "distributor change" && title.includes("distributor set")) return false;
    if (type === "awards tier changed" && title.includes("awards tier assigned")) return false;
    if (summary.includes("currently selected")) return false;
    if (summary.includes("release currently scheduled")) return false;
    return isExternalSignalType(type);
  }).slice(0, 6);
}

function isExternalSignalType(type) {
  return [
    "trailer",
    "teaser",
    "cast",
    "director",
    "festival",
    "release date",
    "reviews",
    "review",
    "box office",
    "streaming",
    "nomination probability",
    "win probability",
    "major industry article",
  ].some((allowed) => type.includes(allowed));
}

function latestTrailer(profile) {
  const canonical = profile.media?.canonical_trailer;
  if (canonical?.url && isValidUrl(canonical.url)) {
    return {
      title: canonical.title || "Official Trailer",
      kind: canonical.type || "Trailer",
      url: canonical.url,
    };
  }
  const events = profile.timeline?.events || [];
  const event = events.find((item) => String(item.event_type || "").toLowerCase().includes("trailer"));
  if (!event && !hasTrailerEvidence(profile)) return null;
  const url = event?.metadata?.url || event?.metadata?.trailer_url || profile.media?.latest_trailer_url || "";
  if (url && !isValidUrl(url)) return null;
  return {
    title: event?.title || "Official Trailer",
    url,
  };
}

function hasTrailerEvidence(profile) {
  const attention = profile.attention_intelligence || {};
  return (attention.evidence_sources || []).some((source) => source.source === "trailer_available")
    || (attention.attention_reasons || []).includes("Trailer Available")
    || (profile.signals?.watch_triggers || []).includes("Trailer Available");
}

function sectionId(title) {
  return `film${String(title).replace(/[^a-z0-9]+/gi, "")}`;
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
  if (label === "Rotten Tomatoes Popcornmeter") return numeric <= 1 ? `${Math.round(numeric * 100)}%` : `${Math.round(numeric)}%`;
  if (label === "Metacritic") return `${Math.round(numeric)}`;
  return String(numeric);
}

function formatVoteCount(value) {
  const numeric = positiveNumber(value);
  return numeric ? numeric.toLocaleString() : "";
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

function positiveNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
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

function renderFestivalRecords(records) {
  if (!records.length) return "";
  return `<ul class="festival-records">${records.slice(0, 3).map((record) => `
    <li><strong>${escapeHtml(record.festival_name || record.festival || "Festival")}</strong>${record.section ? ` · ${escapeHtml(record.section)}` : ""}${record.selection_status ? ` · ${escapeHtml(record.selection_status)}` : ""}<span>${escapeHtml(record.confidence || "Developing")} confidence</span></li>
  `).join("")}</ul>`;
}

function setFilmSeo(profile) {
  const identity = profile.film_identity;
  const editorial = profile.editorial;
  if (!window.AwardsSeo) {
    document.title = `The Screening Room - ${identity.title}`;
    return;
  }
  AwardsSeo.setMetadata({
    title: `The Screening Room - ${identity.title}`,
    description: editorial.editorial_summary || editorial.why_it_matters || `Film intelligence profile for ${identity.title}.`,
    image: identity.poster,
    type: "article",
    url: window.location.href,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Movie",
      name: identity.title,
      datePublished: identity.release_date || undefined,
      image: identity.poster || undefined,
      description: editorial.editorial_summary || editorial.why_it_matters || undefined,
    },
  });
}

function track(eventName, payload = {}) {
  if (window.AwardsAnalytics) AwardsAnalytics.track(eventName, payload);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMethodologyDialog();
});

function formatDate(value) {
  if (!value) return "Date pending";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#039;");
}

init();
