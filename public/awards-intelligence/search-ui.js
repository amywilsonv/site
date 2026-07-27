window.AwardsSearch = (() => {
  let indexPromise = null;
  let activeIndex = -1;
  let currentResults = [];

  async function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch("data/search_index.json").then((response) => {
        if (!response.ok) throw new Error("Could not load search index");
        return response.json();
      });
    }
    return indexPromise;
  }

  function search(query, index, limit = 20) {
    const normalized = normalize(query);
    if (!normalized) return [];
    return index.records
      .map((record) => ({ record, ...scoreRecord(normalized, record) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
      .slice(0, limit)
      .map((item) => ({ ...item.record, score: item.score, match_type: item.match_type }));
  }

  function autocomplete(query, index, limit = 8) {
    return search(query, index, limit).map((result) => ({
      id: result.id,
      tmdb_id: result.tmdb_id,
      poster: result.poster,
      title: result.title,
      release_year: result.release_year,
      primary_badge: result.primary_badge,
      editorial_summary: result.editorial_summary,
      destination_url: result.destination_url,
      score: result.score,
      match_type: result.match_type,
    }));
  }

  function scoreRecord(query, record) {
    const title = record.normalized_title || normalize(record.title);
    const alternates = (record.alternate_titles || []).map(normalize);
    const titlePool = [title, ...alternates].filter(Boolean);
    if (titlePool.includes(query)) return { score: 1000, match_type: "exact_title" };
    if (titlePool.some((item) => item.startsWith(query))) return { score: 850, match_type: "prefix_title" };
    if (titlePool.some((item) => item.includes(query))) return { score: 700, match_type: "partial_title" };
    const fuzzy = Math.max(0, ...titlePool.map((item) => fuzzyRatio(query, item)));
    if (fuzzy >= 0.78) return { score: Math.round(560 * fuzzy), match_type: "fuzzy_title" };
    const metadata = [record.director, record.distributor, record.franchise, (record.genres || []).join(" "), record.search_text].map(normalize);
    if (metadata.some((item) => item && (item === query || item.startsWith(query) || item.includes(query)))) {
      return { score: 320, match_type: "metadata_match" };
    }
    return { score: 0, match_type: "" };
  }

  function wireGlobalSearch(input, panel) {
    if (!input || !panel) return;
    input.setAttribute("autocomplete", "off");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", panel.id || "searchPanel");
    input.setAttribute("aria-expanded", "false");
    input.addEventListener("input", async () => {
      activeIndex = -1;
      try {
        const index = await loadIndex();
        currentResults = autocomplete(input.value, index);
        renderPanel(panel, currentResults, input);
        if (input.value.trim()) track("search_performed", { query: input.value.trim(), surface: "autocomplete", result_count: currentResults.length });
      } catch {
        currentResults = [];
        panel.innerHTML = `<div class="search-suggestion search-message" role="status">Search is temporarily unavailable.</div>`;
        panel.classList.remove("hidden");
        input.setAttribute("aria-expanded", "true");
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = Math.min(currentResults.length - 1, activeIndex + 1);
        renderPanel(panel, currentResults, input);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = Math.max(0, activeIndex - 1);
        renderPanel(panel, currentResults, input);
      } else if (event.key === "Enter") {
        if (activeIndex >= 0 && currentResults[activeIndex]) {
          track("autocomplete_selection", { query: input.value.trim(), tmdb_id: currentResults[activeIndex].tmdb_id, title: currentResults[activeIndex].title });
          window.location.href = currentResults[activeIndex].destination_url;
        } else if (input.value.trim()) {
          track("search_performed", { query: input.value.trim(), surface: "global_enter" });
          window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
        }
      } else if (event.key === "Escape") {
        panel.classList.add("hidden");
        input.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("click", (event) => {
      if (!panel.contains(event.target) && event.target !== input) {
        panel.classList.add("hidden");
        input.setAttribute("aria-expanded", "false");
      }
    });
  }

  function renderPanel(panel, results, input) {
    if (!results.length) {
      panel.classList.add("hidden");
      panel.innerHTML = "";
      input?.setAttribute("aria-expanded", "false");
      input?.removeAttribute("aria-activedescendant");
      return;
    }
    panel.innerHTML = results.map((result, index) => `
      <a id="search-option-${index}" class="search-suggestion ${index === activeIndex ? "active" : ""}" href="${escapeHtml(result.destination_url)}" role="option" aria-selected="${index === activeIndex ? "true" : "false"}" data-autocomplete-selection="${escapeHtml(result.tmdb_id)}">
        ${result.poster ? `<img src="${escapeHtml(result.poster)}" alt="">` : `<span class="search-thumb"></span>`}
        <span><strong>${escapeHtml(result.title)}</strong><small>${escapeHtml([result.release_year, result.primary_badge].filter(Boolean).join(" · "))}</small></span>
      </a>
    `).join("");
    panel.querySelectorAll("[data-autocomplete-selection]").forEach((link, index) => {
      link.addEventListener("click", () => track("autocomplete_selection", { tmdb_id: results[index].tmdb_id, title: results[index].title, query: input?.value.trim() || "" }));
    });
    panel.classList.remove("hidden");
    input?.setAttribute("aria-expanded", "true");
    if (activeIndex >= 0) input?.setAttribute("aria-activedescendant", `search-option-${activeIndex}`);
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[:\-]/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function fuzzyRatio(a, b) {
    if (!a || !b) return 0;
    const longer = a.length >= b.length ? a : b;
    const shorter = a.length >= b.length ? b : a;
    const distance = levenshtein(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  function levenshtein(a, b) {
    const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      let previous = dp[0];
      dp[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const temp = dp[j];
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
        previous = temp;
      }
    }
    return dp[b.length];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function track(eventName, payload = {}) {
    if (window.AwardsAnalytics) AwardsAnalytics.track(eventName, payload);
  }

  return { loadIndex, search, autocomplete, wireGlobalSearch };
})();
