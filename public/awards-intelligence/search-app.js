const input = document.getElementById("globalSearch");
const panel = document.getElementById("searchPanel");
const heading = document.getElementById("searchHeading");
const subhead = document.getElementById("searchSubhead");
const resultsRoot = document.getElementById("searchResults");

async function initSearchPage() {
  AwardsSearch.wireGlobalSearch(input, panel);
  const query = new URLSearchParams(window.location.search).get("q") || "";
  input.value = query;
  renderSearchLoading();
  setSearchSeo(query, 0);
  try {
    const index = await AwardsSearch.loadIndex();
    const results = AwardsSearch.search(query, index, 80);
    renderResults(query, results);
    setSearchSeo(query, results.length);
    if (query.trim()) track("search_performed", { query: query.trim(), surface: "results_page", result_count: results.length });
  } catch (error) {
    resultsRoot.innerHTML = `<div class="empty error-state" role="alert"><strong>Search data could not load.</strong><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function renderSearchLoading() {
  resultsRoot.innerHTML = `
    <div class="search-results" aria-busy="true" aria-label="Loading search results">
      ${Array.from({ length: 6 }, () => `
        <div class="search-result">
          <div class="skeleton skeleton-search-thumb"></div>
          <span><span class="skeleton skeleton-line short"></span><span class="skeleton skeleton-line wide"></span><span class="skeleton skeleton-line"></span></span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderResults(query, results) {
  heading.textContent = query ? `Search: ${query}` : "Search";
  subhead.textContent = query ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Search across films, filmmakers, studios, genres, and distributors.";
  if (!query.trim()) {
    resultsRoot.innerHTML = `<div class="empty" role="status"><strong>Start typing to search The Screening Room.</strong><p>Search by title, filmmaker, distributor, genre, or franchise.</p></div>`;
    return;
  }
  if (!results.length) {
    resultsRoot.innerHTML = `<div class="empty" role="status"><strong>No films match this search yet.</strong><p>Check the spelling or search by a director, distributor, genre, or franchise.</p></div>`;
    return;
  }
  resultsRoot.innerHTML = `<div class="search-results">${results.map(resultCard).join("")}</div>`;
  resultsRoot.querySelectorAll("[data-search-result]").forEach((link) => {
    link.addEventListener("click", () => track("search_result_clicked", {
      query: query.trim(),
      tmdb_id: link.dataset.searchResult,
      title: link.dataset.title || "",
    }));
  });
}

function resultCard(result) {
  return `
    <a class="search-result" href="${escapeHtml(result.destination_url)}" data-search-result="${escapeHtml(result.tmdb_id)}" data-title="${escapeHtml(result.title)}">
      ${result.poster ? `<img src="${escapeHtml(result.poster)}" alt="${escapeHtml(result.title)} poster" loading="lazy">` : `<span class="search-result-placeholder" role="img" aria-label="Poster unavailable for ${escapeHtml(result.title)}">${escapeHtml(result.title)}</span>`}
      <span>
        <span class="badge search-badge">${escapeHtml(result.primary_badge || "Film")}</span>
        <strong>${escapeHtml(result.title)}</strong>
        <small>${escapeHtml([result.release_display, result.director, result.distributor].filter(Boolean).join(" · "))}</small>
        <span>${escapeHtml(result.editorial_summary || "")}</span>
        <em>${escapeHtml(result.why_it_matters || "")}</em>
      </span>
    </a>
  `;
}

function setSearchSeo(query, resultCount) {
  if (!window.AwardsSeo) return;
  const clean = query.trim();
  AwardsSeo.setMetadata({
    title: clean ? `The Screening Room - Search: ${clean}` : "The Screening Room - Search",
    description: clean ? `${resultCount} The Screening Room result${resultCount === 1 ? "" : "s"} for ${clean}.` : "Search The Screening Room film database.",
    url: window.location.href,
  });
}

function track(eventName, payload = {}) {
  if (window.AwardsAnalytics) AwardsAnalytics.track(eventName, payload);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

initSearchPage();
