const state = {
  predictions: [],
  summary: null,
  features: [],
  selectedCategory: "all",
  featureLimit: 6,
};

const categoryOrder = [
  "best_picture",
  "best_director",
  "best_actor",
  "best_actress",
  "best_supporting_actor",
  "best_supporting_actress",
];

const categoryNames = {
  best_picture: "Best Picture",
  best_director: "Directing",
  best_actor: "Actor in a Leading Role",
  best_actress: "Actress in a Leading Role",
  best_supporting_actor: "Actor in a Supporting Role",
  best_supporting_actress: "Actress in a Supporting Role",
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }
  return response.json();
}

async function init() {
  try {
    const [summary, features] = await Promise.all([
      loadJson("data/model_summary.json"),
      loadJson("data/feature_importance.json"),
    ]);
    const predictions = await loadJson(`data/oscar_predictions_${summary.prediction_year}.json`);
    state.summary = summary;
    state.features = features;
    state.predictions = predictions;
    setupControls();
    renderAll();
  } catch (error) {
    document.body.innerHTML = `<main class="section"><h1>Dashboard data could not load</h1><p>${error.message}</p></main>`;
    console.error(error);
  }
}

function setupControls() {
  const select = document.querySelector("#categoryFilter");
  select.innerHTML = [
    `<option value="all">All Big Six Categories</option>`,
    ...categoryOrder.map((key) => `<option value="${key}">${categoryNames[key]}</option>`),
  ].join("");
  select.addEventListener("change", (event) => {
    state.selectedCategory = event.target.value;
    renderAll();
  });

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const target = document.querySelector(`#${button.dataset.view}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelector("#toggleFeatures").addEventListener("click", (event) => {
    state.featureLimit = state.featureLimit === 6 ? 12 : 6;
    event.currentTarget.textContent = state.featureLimit === 6 ? "Show More Features" : "Show Fewer Features";
    renderFeatures();
  });
}

function renderAll() {
  renderHero();
  renderPredictionCards();
  renderRankingTable();
  renderPerformance();
  renderFeatures();
  renderMisses();
  renderMethodology();
}

function filteredPredictions() {
  if (state.selectedCategory === "all") return state.predictions;
  return state.predictions.filter((row) => row.category_key === state.selectedCategory);
}

function renderHero() {
  document.querySelector("#predictionYear").textContent = state.summary.prediction_year;
  document.querySelector("#averageAccuracy").textContent = percent(state.summary.average_winner_accuracy);
  document.querySelector("#averageTop3").textContent = percent(state.summary.average_top3_accuracy);
  document.querySelector("#nomineeCount").textContent = state.summary.nominee_count;
}

function renderPredictionCards() {
  const winners = filteredPredictions()
    .filter((row) => Number(row.predicted_winner) === 1)
    .sort((a, b) => categoryOrder.indexOf(a.category_key) - categoryOrder.indexOf(b.category_key));

  document.querySelector("#predictionCards").innerHTML = winners.map((row) => `
    <article class="card" data-category="${row.category_key}">
      <div class="card-top">
        <span class="category-pill">${escapeHtml(row.category)}</span>
        <span class="confidence">${escapeHtml(row.confidence_level)}</span>
      </div>
      <div>
        <h3 class="winner-name">${escapeHtml(row.film)}</h3>
        ${row.person ? `<div class="person">${escapeHtml(row.person)}</div>` : ""}
      </div>
      <div class="probability">
        <span class="small-label">Predicted win probability</span>
        <strong>${percent(row.predicted_win_probability)}</strong>
        <div class="meter"><span style="width:${clamp(Number(row.predicted_win_probability) * 100, 0, 100)}%"></span></div>
      </div>
      <div class="meta-row">
        <div><span class="small-label">Model</span><br>${escapeHtml(row.model_type_used)}</div>
        <div><span class="small-label">Backtested Accuracy</span><br>${percent(row.backtested_winner_accuracy)}</div>
      </div>
      <div class="factor-box">
        <span class="small-label">Top positive factors</span>
        ${factorList(row.top_positive_factors)}
      </div>
      <button class="details-toggle" type="button">Show risks and context</button>
      <div class="card-details">
        <div class="factor-box">
          <span class="small-label">Top negative factors</span>
          ${factorList(row.top_negative_factors, "negative")}
        </div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".details-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".card");
      card.classList.toggle("expanded");
      button.textContent = card.classList.contains("expanded") ? "Hide risks and context" : "Show risks and context";
    });
  });
}

function renderRankingTable() {
  const rows = filteredPredictions().sort((a, b) => {
    const categoryDelta = categoryOrder.indexOf(a.category_key) - categoryOrder.indexOf(b.category_key);
    return categoryDelta || Number(a.predicted_rank) - Number(b.predicted_rank);
  });
  const context = state.selectedCategory === "all" ? "Showing all categories" : `Showing ${categoryNames[state.selectedCategory]}`;
  document.querySelector("#tableContext").textContent = context;
  document.querySelector("#rankingTable").innerHTML = rows.map((row) => `
    <tr>
      <td class="rank">${row.predicted_rank}</td>
      <td>${escapeHtml(row.film)}</td>
      <td>${escapeHtml(row.person || "")}</td>
      <td>${percent(row.predicted_win_probability)}</td>
      <td>${escapeHtml(row.model_type_used)}</td>
      <td>${escapeHtml(row.confidence_level)}</td>
      <td>${escapeHtml(firstFactor(row.top_positive_factors) || firstFactor(row.top_negative_factors) || "")}</td>
    </tr>
  `).join("");
}

function renderPerformance() {
  const models = state.summary.best_models
    .filter((row) => state.selectedCategory === "all" || row.category_key === state.selectedCategory)
    .sort((a, b) => categoryOrder.indexOf(a.category_key) - categoryOrder.indexOf(b.category_key));

  document.querySelector("#performanceCards").innerHTML = models.map((row) => `
    <article class="performance-card">
      <div>
        <span class="category-pill">${escapeHtml(displayCategory(row.category_key, row.category))}</span>
        <h3>${escapeHtml(row.model_name)}</h3>
      </div>
      ${statLine("Winner accuracy", row.winner_accuracy)}
      ${statLine("Top-3 accuracy", row.top3_accuracy)}
      <div class="meta-row">
        <div><span class="small-label">Avg winner rank</span><br>${Number(row.average_rank_of_actual_winner).toFixed(2)}</div>
        <div><span class="small-label">Correct years</span><br>${row.number_of_correct_winner_predictions}/${row.number_of_test_years}</div>
      </div>
    </article>
  `).join("");
}

function renderFeatures() {
  const grouped = groupBy(
    state.features.filter((row) => state.selectedCategory === "all" || row.category_key === state.selectedCategory),
    "category_key",
  );
  const html = categoryOrder
    .filter((key) => grouped[key])
    .map((key) => {
      const rows = grouped[key].sort((a, b) => Number(a.rank) - Number(b.rank)).slice(0, state.featureLimit);
      return `
        <article class="feature-panel">
          <h3>${escapeHtml(displayCategory(key, rows[0]?.category))}</h3>
          ${rows.map((row) => `
            <div class="feature-row">
              <span>${escapeHtml(cleanName(row.feature))}</span>
              <div class="bar" title="${Number(row.importance).toFixed(4)}">
                <span style="width:${featureWidth(row.importance, rows)}%"></span>
              </div>
            </div>
          `).join("")}
        </article>
      `;
    }).join("");
  document.querySelector("#featurePanels").innerHTML = html;
}

function renderMisses() {
  const misses = state.summary.historical_misses
    .filter((row) => state.selectedCategory === "all" || row.category_key === state.selectedCategory)
    .slice(0, state.selectedCategory === "all" ? 10 : 24);

  document.querySelector("#missesList").innerHTML = misses.map((row) => `
    <article class="miss-card">
      <div class="miss-year">${row.test_year}</div>
      <div>
        <strong>${escapeHtml(displayCategory(row.category_key, row.category))}</strong>
        <p>Actual winner: ${escapeHtml(row.actual_winner_film)}</p>
        <p>Model picked: ${escapeHtml(row.predicted_winner_film)}. Actual winner ranked #${row.actual_winner_rank}.</p>
      </div>
    </article>
  `).join("") || `<article class="miss-card"><div></div><div>No historical misses for this view.</div></article>`;
}

function renderMethodology() {
  const method = state.summary.methodology;
  const cards = [
    ["Data Sources", method.data_sources],
    ["Feature Layers", method.feature_layers],
    ["Validation", [method.validation, "Category-specific winner models are selected from walk-forward backtests."]],
    ["Limitations", method.limitations],
  ];
  document.querySelector("#methodologyGrid").innerHTML = cards.map(([title, items]) => `
    <article class="method-card">
      <h3>${escapeHtml(title)}</h3>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function statLine(label, value) {
  return `
    <div class="stat-line">
      <span>${escapeHtml(label)}</span>
      <div class="bar"><span style="width:${clamp(Number(value) * 100, 0, 100)}%"></span></div>
      <strong>${percent(value)}</strong>
    </div>
  `;
}

function factorList(value, className = "") {
  const items = String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!items.length) return `<p class="person">No factors available.</p>`;
  return `<ul class="factor-list ${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function firstFactor(value) {
  return String(value || "").split(";").map((item) => item.trim()).filter(Boolean)[0];
}

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = acc[row[key]] || [];
    acc[row[key]].push(row);
    return acc;
  }, {});
}

function featureWidth(value, rows) {
  const max = Math.max(...rows.map((row) => Number(row.importance) || 0), 0.0001);
  return clamp((Number(value) / max) * 100, 4, 100);
}

function cleanName(value) {
  return String(value || "").replaceAll("_", " ");
}

function displayCategory(key, fallback) {
  return categoryNames[key] || fallback || key;
}

function percent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  return `${(number * 100).toFixed(number >= 0.1 ? 1 : 2)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
