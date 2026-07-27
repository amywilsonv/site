const view = document.getElementById("filmView");

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
  if (!id) {
    renderFilmError("Film not found", "No film ID was provided.", "Return to Discover to choose a tracked film.");
    return;
  }
  try {
    const [profile, timeline] = await Promise.all([
      loadJson(`data/films/${encodeURIComponent(id)}.json`),
      loadJson(`data/timelines/${encodeURIComponent(id)}.json`),
    ]);
    setFilmSeo(profile);
    renderFilm(profile, timeline);
    track("film_page_viewed", { tmdb_id: id, title: profile.film_identity.title });
  } catch (error) {
    renderFilmError("Film not found", error.message, "The film may not have a production profile yet.");
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

function renderFilmError(title, message, detail) {
  view.innerHTML = `
    <section class="intro error-state" role="alert">
      <p class="eyebrow">Film</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <p>${escapeHtml(detail)}</p>
      <a class="chip" href="./discovery.html#discover">Back to Discover</a>
    </section>
  `;
}

function renderFilm(profile, timeline) {
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
      <div>
        ${identity.poster ? `<img class="poster-img-static film-page-poster" src="${escapeHtml(identity.poster)}" alt="${escapeHtml(identity.title)} poster" loading="eager">` : `<div class="poster-img-static placeholder film-page-poster" role="img" aria-label="Poster unavailable for ${escapeHtml(identity.title)}">${escapeHtml(identity.title)}</div>`}
      </div>
      <div class="film-profile-copy">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./discovery.html">Home</a><span>/</span><a href="./discovery.html#discover">Discover</a><span>/</span><span>${escapeHtml(identity.title)}</span></nav>
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
  return `
    <article class="hero-snapshot-card">
      <strong>Ratings</strong>
      <div class="ratings-snapshot">
        ${ratingPill("IMDb", ratings.imdb)}
        ${ratingPill("Letterboxd", ratings.letterboxd)}
        ${ratingPill("Rotten Tomatoes Tomatometer", ratings.rotten_tomatoes_tomatometer || ratings.rotten_tomatoes || ratings.rottenTomatoes)}
        ${ratingPill("Metacritic", ratings.metacritic)}
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
  return `
    <article class="hero-snapshot-card">
      <strong>Box Office</strong>
      <p>${escapeHtml(formatMoney(boxOffice.domestic_gross || boxOffice.domestic) || prereleaseBoxOfficeState(profile))}</p>
      <span>${escapeHtml(boxOffice.status || commercial.release_strategy || "Results unavailable")}</span>
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
  return [
    { label: "IMDb", value: formatRating("IMDb", ratings.imdb) },
    { label: "Letterboxd", value: formatRating("Letterboxd", ratings.letterboxd) },
    { label: "Rotten Tomatoes Popcornmeter", value: formatRating("Rotten Tomatoes Popcornmeter", ratings.rotten_tomatoes_popcornmeter || ratings.popcornmeter) },
  ];
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
  return [
    { label: "Opening weekend", value: formatMoney(boxOffice.opening_weekend) || state },
    { label: "Domestic", value: formatMoney(boxOffice.domestic_gross || boxOffice.domestic) || state },
    { label: "International", value: formatMoney(boxOffice.international_gross || boxOffice.international) || state },
    { label: "Worldwide", value: formatMoney(boxOffice.worldwide_gross || boxOffice.worldwide) || state },
    { label: "Projection", value: formatMoney(boxOffice.projection) || "Unavailable" },
  ];
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
      ${oscarModelPanel("Nomination Model", "Coming Soon", "Will estimate nomination probability by Academy Award category.", "nomination_probability", probabilities)}
      ${oscarModelPanel("Winner Model", "Coming Soon", "Will estimate win probability and recalculate after nominees are announced.", "win_probability", probabilities)}
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
  const events = profile.timeline?.events || [];
  const event = events.find((item) => String(item.event_type || "").toLowerCase().includes("trailer"));
  if (!event && !hasTrailerEvidence(profile)) return null;
  return {
    title: event?.title || "Official Trailer",
    url: event?.metadata?.url || event?.metadata?.trailer_url || profile.media?.latest_trailer_url || "",
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
