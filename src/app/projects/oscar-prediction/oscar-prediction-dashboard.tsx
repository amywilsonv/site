"use client";

import {
  Award,
  BarChart3,
  Calendar,
  ChevronDown,
  Clapperboard,
  Info,
  Medal,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Prediction = {
  year_film: number;
  category_key: string;
  category: string;
  predicted_rank: number;
  film: string;
  person: string | null;
  predicted_win_probability: number;
  confidence_level: string;
  predicted_winner: number;
  model_type_used: string;
  backtested_winner_accuracy: number;
  top_positive_factors: string;
  top_negative_factors: string;
};

type DisplayPrediction = Prediction & {
  display_win_probability: number;
};

type BestModel = {
  category_key: string;
  category: string;
  model_name: string;
  winner_accuracy: number;
  top3_accuracy: number;
  average_rank_of_actual_winner: number;
  number_of_correct_winner_predictions: number;
  number_of_test_years: number;
};

type ModelPerformance = {
  prediction_year: number;
  average_winner_accuracy: number;
  average_top3_accuracy: number;
  category_count: number;
  nominee_count: number;
  best_models: BestModel[];
};

type FeatureImportance = {
  category_key: string;
  category: string;
  model_name: string;
  feature: string;
  logical_feature?: string;
  signal_label?: string;
  signal_type?: string;
  importance: number;
  rank: number;
  raw_features?: string;
  source_rows?: number;
  aggregation_method?: string;
};

type HistoricalMiss = {
  category_key: string;
  category: string;
  test_year: number;
  actual_winner_film: string;
  predicted_winner_film: string;
  actual_winner_person?: string | null;
  predicted_winner_person?: string | null;
  actual_winner_rank: number;
};

type HistoricalWinnerRow = {
  category_key: string;
  category: string;
  test_year: number;
  winner_correct?: number;
  top3_correct?: number;
  predicted_winner?: number;
  predicted_rank?: number;
  actual_winner_rank: number;
};

type HistoricalPredictions = {
  winner_rows: HistoricalWinnerRow[];
  misses: HistoricalMiss[];
};

type ForecastMetadata = {
  ceremony_year: number;
  year_film: number;
  available: boolean;
  nominees_ranked: number | null;
  category_count: number;
  label: string;
  source_file: string;
};

type Methodology = {
  summary: string;
  data_sources: string[];
  feature_layers: string[];
  validation: string[];
  limitations: string[];
};

type DashboardData = {
  predictions: Prediction[];
  performance: ModelPerformance;
  features: FeatureImportance[];
  historical: HistoricalPredictions;
  forecastMetadata: ForecastMetadata[];
  methodology: Methodology;
};

const categoryOrder = [
  "best_picture",
  "best_director",
  "best_actor",
  "best_actress",
  "best_supporting_actor",
  "best_supporting_actress",
];

const categoryLabels: Record<string, string> = {
  best_picture: "Best Picture",
  best_director: "Best Director",
  best_actor: "Best Actor",
  best_actress: "Best Actress",
  best_supporting_actor: "Supporting Actor",
  best_supporting_actress: "Supporting Actress",
};

const forecastCeremonies = [2025, 2026] as const;

const modelLabels: Record<string, string> = {
  logistic_regression: "Logistic Regression",
  random_forest: "Random Forest",
  xgboost: "XGBoost",
  lightgbm: "LightGBM",
  catboost: "CatBoost",
};

const featureLabels: Record<string, string> = {
  pga_win: "PGA win",
  pga_nomination: "PGA nomination",
  dga_win: "DGA win",
  dga_nomination: "DGA nomination",
  sag_ensemble_win: "SAG Ensemble win",
  sag_ensemble_nomination: "SAG Ensemble nomination",
  sag_acting_win: "SAG acting win",
  sag_acting_nomination: "SAG acting nomination",
  bafta_best_film_win: "BAFTA Best Film win",
  bafta_best_film_nomination: "BAFTA Best Film nomination",
  bafta_director_win: "BAFTA Director win",
  bafta_director_nomination: "BAFTA Director nomination",
  bafta_acting_win: "BAFTA acting win",
  bafta_acting_nomination: "BAFTA acting nomination",
  critics_choice_picture_win: "Critics Choice Picture win",
  critics_choice_picture_nomination: "Critics Choice Picture nomination",
  critics_choice_director_win: "Critics Choice Director win",
  critics_choice_director_nomination: "Critics Choice Director nomination",
  critics_choice_acting_win: "Critics Choice acting win",
  critics_choice_acting_nomination: "Critics Choice acting nomination",
  golden_globe_picture_win: "Golden Globe Picture win",
  golden_globe_picture_nomination: "Golden Globe Picture nomination",
  golden_globe_director_win: "Golden Globe Director win",
  golden_globe_director_nomination: "Golden Globe Director nomination",
  golden_globe_acting_win: "Golden Globe acting win",
  golden_globe_acting_nomination: "Golden Globe acting nomination",
  tmdb_popularity: "TMDb popularity",
  tmdb_vote_average: "TMDb vote average",
  tmdb_vote_count: "TMDb vote count",
  tmdb_is_international: "International production signal",
  tmdb_is_us_production: "US production signal",
  letterboxd_score: "Letterboxd score",
  letterboxd_rating_count: "Letterboxd rating count",
  critic_score_average: "Critic score average",
  box_office_to_budget: "Box office to budget",
  box_office_musd: "Box office",
  budget_musd: "Budget",
  runtime_minutes: "Runtime",
  picture_precursor_strength: "Picture precursor strength",
  directing_precursor_strength: "Director precursor strength",
  acting_precursor_strength: "Acting precursor strength",
  precursor_momentum_score: "Precursor momentum score",
  precursor_consensus_score: "Precursor consensus score",
  precursor_win_percentage: "Precursor win percentage",
  major_precursor_wins: "Major precursor wins",
  major_precursor_nominations: "Major precursor nominations",
  precursor_wins_total: "Precursor wins",
  precursor_nominations_total: "Precursor nominations",
  total_precursor_wins: "Total precursor wins",
  total_precursor_nominations: "Total precursor nominations",
  picture_precursor_wins: "Picture precursor wins",
  picture_precursor_nominations: "Picture precursor nominations",
  director_precursor_wins: "Director precursor wins",
  director_precursor_nominations: "Director precursor nominations",
  person_precursor_strength: "Person precursor strength",
  person_precursor_wins_total: "Person precursor wins",
  person_precursor_nominations_total: "Person precursor nominations",
  sag_person_win: "SAG person win",
  sag_person_nomination: "SAG person nomination",
  bafta_person_win: "BAFTA person win",
  bafta_person_nomination: "BAFTA person nomination",
  critics_choice_person_win: "Critics Choice person win",
  critics_choice_person_nomination: "Critics Choice person nomination",
  golden_globe_person_win: "Golden Globe person win",
  golden_globe_person_nomination: "Golden Globe person nomination",
  release_month: "Release month",
  release_season: "Release season",
  years_since_first_credit: "Years since first credit",
  tmdb_revenue_to_budget: "TMDb revenue to budget",
};

const dataBase = "/oscar-prediction";

const definitions = {
  "Winner Accuracy":
    "How often the model's first choice was the actual Oscar winner.",
  "Winner in Top 3":
    "How often the eventual winner landed somewhere in the model's top three.",
  "Walk-forward backtesting":
    "A test that only lets the model learn from earlier ceremonies before predicting a later one.",
  "Walk-forward Validation":
    "A test that only lets the model learn from earlier ceremonies before predicting a later one.",
  "Current Big 6 Nominees": "Known nominees included in the selected ceremony forecast.",
  "Win Probability":
    "The nominee's share of the category after raw model scores are normalized to 100%.",
  Confidence: "A quick read on how separated the prediction is from the rest of the field.",
  Backtested: "How often this model got past ceremonies right when tested year by year.",
  "Backtested Accuracy": "How often this model got past ceremonies right when tested year by year.",
  "Top signals": "The strongest signals lifting this nominee in the model.",
  "Feature Importance":
    "A readout of which inputs the model leaned on most when learning from past races.",
  "Awards Momentum": "A combined read on how strongly a nominee is showing up across the awards season.",
  "Guild Wins": "Wins from industry groups whose voters overlap with, or strongly mirror, Oscar voters.",
  "Media Signals": "Coverage, buzz, trade press, and narrative signals turned into model features.",
  "Media signal layers": "Coverage, buzz, trade press, and narrative signals turned into model features.",
  "Precursor awards":
    "Awards before the Oscars, such as SAG, BAFTA, DGA, PGA, Golden Globes, and Critics Choice.",
} as const;

type DefinitionTerm = keyof typeof definitions;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${dataBase}/${path}`);
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }
  return response.json() as Promise<T>;
}

function percent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}

function ceremonyYear(filmYear: number) {
  return filmYear + 1;
}

function modelName(value: string) {
  return modelLabels[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function featureName(value: string) {
  if (featureLabels[value]) return featureLabels[value];
  if (value.startsWith("genre_")) return `Genre: ${value.replace("genre_", "").replaceAll("_", " ")}`;
  if (value.startsWith("tmdb_genres_")) {
    return `Genres: ${value.replace("tmdb_genres_", "").replaceAll(";", ",")}`;
  }
  if (value.startsWith("age_bucket_")) return `Age bucket: ${value.replace("age_bucket_", "")}`;
  if (value.startsWith("career_stage_")) return `Career stage: ${value.replace("career_stage_", "").replaceAll("_", " ")}`;
  return value
    .replaceAll("_", " ")
    .replace(/\btmdb\b/gi, "TMDb")
    .replace(/\bpga\b/gi, "PGA")
    .replace(/\bdga\b/gi, "DGA")
    .replace(/\bsag\b/gi, "SAG")
    .replace(/\bbafta\b/gi, "BAFTA");
}

function cleanSignal(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.+?)\s*(\([+-].+\))$/);
  const colonMatch = trimmed.match(/^(.+?):\s*(.+)$/);
  if (colonMatch) {
    return `${featureName(colonMatch[1].trim().replaceAll(" ", "_"))}: ${colonMatch[2].trim()}`;
  }
  if (!match) return featureName(trimmed.replaceAll(" ", "_"));
  const rawFeature = match[1].trim().replaceAll(" ", "_");
  return `${featureName(rawFeature)} ${match[2]}`;
}

function splitFactors(value: string) {
  return value
    .split(";")
    .map(cleanSignal)
    .filter(Boolean)
    .slice(0, 4);
}

function categorySort<T extends { category_key: string; predicted_rank?: number }>(a: T, b: T) {
  const categoryDelta = categoryOrder.indexOf(a.category_key) - categoryOrder.indexOf(b.category_key);
  return categoryDelta || Number(a.predicted_rank ?? 0) - Number(b.predicted_rank ?? 0);
}

function groupPredictionsByCategory<T extends Prediction>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    acc[row.category_key] = acc[row.category_key] || [];
    acc[row.category_key].push(row);
    return acc;
  }, {});
}

function normalizeDisplayProbabilities(rows: Prediction[]): DisplayPrediction[] {
  const categoryTotals = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category_key] = (acc[row.category_key] || 0) + Math.max(0, row.predicted_win_probability || 0);
    return acc;
  }, {});

  const categoryCounts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category_key] = (acc[row.category_key] || 0) + 1;
    return acc;
  }, {});

  return rows.map((row) => {
    const total = categoryTotals[row.category_key] || 0;
    const fallback = 1 / Math.max(categoryCounts[row.category_key] || 1, 1);
    return {
      ...row,
      display_win_probability: total > 0 ? Math.max(0, row.predicted_win_probability || 0) / total : fallback,
    };
  });
}

function displayConfidence(probability: number) {
  if (probability >= 0.65) return "High";
  if (probability >= 0.35) return "Medium";
  return "Low";
}

function isPersonCategory(categoryKey: string) {
  return categoryKey !== "best_picture";
}

function predictionDisplay(row: Pick<Prediction, "category_key" | "film" | "person">) {
  if (!isPersonCategory(row.category_key)) {
    return { primary: row.film, secondary: null };
  }

  return {
    primary: row.person || row.film,
    secondary: row.person ? row.film : null,
  };
}

function MissParticipant({
  categoryKey,
  person,
  film,
}: {
  categoryKey: string;
  person?: string | null;
  film: string;
}) {
  if (!isPersonCategory(categoryKey)) {
    return <span className="font-medium text-[#2f2a23]">{film}</span>;
  }

  return (
    <span className="inline-flex min-w-0 flex-col align-top">
      <span className="font-medium text-[#2f2a23]">{person || film}</span>
      {person ? <span className="text-xs text-[#7a7268]">{film}</span> : null}
    </span>
  );
}

function deriveYearlyPerformance(rows: HistoricalWinnerRow[]) {
  const grouped = rows.reduce<Record<number, HistoricalWinnerRow[]>>((acc, row) => {
    acc[row.test_year] = acc[row.test_year] || [];
    acc[row.test_year].push(row);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([year, yearRows]) => {
      const categoryCount = yearRows.length;
      const correctWinners = yearRows.reduce(
        (sum, row) => sum + Number(row.winner_correct ?? row.predicted_winner ?? 0),
        0,
      );
      const top3Correct = yearRows.reduce(
        (sum, row) => sum + Number(row.top3_correct ?? (Number(row.actual_winner_rank) <= 3 ? 1 : 0)),
        0,
      );
      const averageWinnerRank =
        yearRows.reduce((sum, row) => sum + Number(row.actual_winner_rank || 0), 0) / Math.max(categoryCount, 1);

      return {
        testYear: Number(year),
        ceremonyYear: ceremonyYear(Number(year)),
        categoryCount,
        correctWinners,
        top3Correct,
        winnerAccuracy: correctWinners / Math.max(categoryCount, 1),
        top3Accuracy: top3Correct / Math.max(categoryCount, 1),
        averageWinnerRank,
      };
    })
    .sort((a, b) => a.testYear - b.testYear);
}

export default function OscarPredictionDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCeremony, setSelectedCeremony] = useState<number>(2026);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [predictions, performance, features, historical, forecastMetadata, methodology] = await Promise.all([
          fetchJson<Prediction[]>("predictions.json"),
          fetchJson<ModelPerformance>("model_performance.json"),
          fetchJson<FeatureImportance[]>("feature_importance.json"),
          fetchJson<HistoricalPredictions>("historical_predictions.json"),
          fetchJson<ForecastMetadata[]>("forecast_metadata.json"),
          fetchJson<Methodology>("methodology.json"),
        ]);
        setData({ predictions, performance, features, historical, forecastMetadata, methodology });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Dashboard data failed to load.");
      }
    }
    loadDashboardData();
  }, []);

  const availableCeremonies = useMemo(() => {
    if (!data) return new Set<number>();
    return new Set(
      data.forecastMetadata
        .filter((item) => item.available)
        .map((item) => item.ceremony_year),
    );
  }, [data]);

  const activeCeremony = useMemo(() => {
    if (availableCeremonies.has(selectedCeremony)) return selectedCeremony;
    const years = [...availableCeremonies];
    return years.length ? Math.max(...years) : selectedCeremony;
  }, [availableCeremonies, selectedCeremony]);

  const selectedPredictions = useMemo(() => {
    if (!data) return [];
    return data.predictions.filter((row) => ceremonyYear(row.year_film) === activeCeremony);
  }, [activeCeremony, data]);

  const sortedPredictions = useMemo(() => {
    if (!data) return [];
    return normalizeDisplayProbabilities(selectedPredictions).sort(categorySort);
  }, [data, selectedPredictions]);

  const winnerRows = sortedPredictions.filter((row) => row.predicted_winner === 1);

  const rankingsByCategory = useMemo(() => groupPredictionsByCategory(sortedPredictions), [sortedPredictions]);

  const yearlyPerformance = useMemo(() => {
    if (!data) return [];
    return deriveYearlyPerformance(data.historical.winner_rows);
  }, [data]);

  if (error) {
    return (
      <main className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 bg-[#f7f4ee] p-8 text-[#25231f]">
        <p>{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="relative left-1/2 grid min-h-screen w-screen -translate-x-1/2 place-items-center bg-[#f7f4ee] text-[#25231f]">
        <p className="text-xs uppercase tracking-[0.24em] text-[#8c6f3d]">Loading Awards Intelligence</p>
      </main>
    );
  }

  return (
    <main className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 bg-[#f7f4ee] text-[#25231f]">
      <section className="border-b border-black/10 px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-[clamp(2.7rem,6vw,5.5rem)] font-medium leading-[0.98] tracking-tight text-balance">
                Awards Intelligence
              </h1>
              <p className="mt-6 max-w-3xl text-[clamp(1rem,1.7vw,1.18rem)] leading-8 text-[#5e5a52]">
                A forecasting workbench for the Big 6 Oscar races, built from past nominees,{" "}
                <DefinitionTooltip term="Precursor awards" />, film metadata, person-level history, and{" "}
                <DefinitionTooltip term="Media Signals" />.
              </p>
              <div className="mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["24", "Years Backtested"],
                  ["6", "Award Categories"],
                  ["144", "Historical Predictions"],
                  [String(sortedPredictions.length), "Current Big 6 Nominees"],
                ].map(([value, label]) => (
                  <div className="rounded-lg border border-black/10 bg-white/50 p-3" key={label}>
                    <div className="text-lg font-medium text-[#25231f]">{value}</div>
                    <div className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#6d675d]">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-black/10 bg-white/60 p-3">
              <HeroStat label="Latest forecast" value={`${activeCeremony} Oscars`} />
              <HeroStat label={<DefinitionTooltip term="Current Big 6 Nominees" />} value={String(sortedPredictions.length)} />
              <HeroStat label={<DefinitionTooltip term="Winner Accuracy" />} value={percent(data.performance.average_winner_accuracy)} />
              <HeroStat label={<DefinitionTooltip term="Winner in Top 3" />} value={percent(data.performance.average_top3_accuracy)} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-5 pt-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <SummaryCard
            title="The problem"
            body="Oscar predictions often sound like taste dressed up as certainty. I wanted to test what the data actually says: which signals repeat, which categories behave differently, and where the model still gets surprised."
          />
          <SummaryCard
            title="What I built"
            body="I built a category-by-category model that ranks known nominees, explains the signals behind each pick, and tests itself against past ceremonies before making a current forecast."
          />
        </div>
      </section>

      <section className="px-5 pb-10 pt-3 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Findings"
            title="Key Findings"
            description="The results point to a few patterns that matter more than reputation or gut instinct."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InsightCard
              icon={<TrendingUp className="size-4" />}
              title="Industry Momentum Matters Most"
              body="Across the Big 6, precursor wins and nominations usually outweighed reviews, popularity, and box office. Once industry groups start lining up behind a nominee, that evidence is hard to ignore."
            />
            <InsightCard
              icon={<Clapperboard className="size-4" />}
              title="Each Race Behaves Differently"
              body="Best Picture behaves like a broad film consensus race. Acting and directing rely more on person history and award-branch support. A single universal approach missed those differences."
            />
            <InsightCard
              icon={<BarChart3 className="size-4" />}
              title="Rankings Are More Reliable Than Certainty"
              body="The analysis picked the winner 72.2% of the time, but placed the eventual winner in the top three more than 90% of the time. The ordered field is more useful than a single prediction."
            />
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-xl border border-[#d9c99e] bg-[#fff8e6] px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6f3d]">Current scope</p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#4f493f]">
            This prototype currently ranks known nominees and estimates winner probabilities. It does not yet identify
            likely nominees from the full universe of eligible films.
          </p>
        </div>
      </section>

      <HistoricalPerformanceSection
        performance={data.performance}
        yearlyPerformance={yearlyPerformance}
      />

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:px-12" id="forecast">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionTitle
            eyebrow="Forecast"
            title="Current Forecast"
            description="The current predictions rank known nominees using the best-performing approach for each race."
            compact
          />
          <CeremonySwitcher
            availableCeremonies={availableCeremonies}
            selectedCeremony={activeCeremony}
            setSelectedCeremony={setSelectedCeremony}
          />
        </div>
        {!availableCeremonies.has(2026) ? (
          <div className="mb-5 rounded-xl border border-[#d9c99e] bg-[#fff8e6] px-4 py-3 text-sm leading-6 text-[#4f493f]">
            2026 Ceremony forecast not available yet. This requires adding 2025 film-year nominees and feature data to
            the model pipeline.
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {winnerRows.map((winner) => (
            <PredictionCard
              key={winner.category_key}
              prediction={winner}
              showSignalTooltip={winner.category_key === categoryOrder[0]}
            />
          ))}
        </div>
      </section>

      <WhyModelLikesSection winners={winnerRows} />

      <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-8 lg:px-12">
        <SectionTitle
          eyebrow="Rankings"
          title="Nominee Rankings"
          description={
            <>
              The full ordering matters. <DefinitionTooltip term="Win Probability" /> shows relative strength within a
              race, while <DefinitionTooltip term="Confidence" /> gives a quick read on separation.
            </>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {categoryOrder.map((key) => (
            <RankingCard key={key} rows={rankingsByCategory[key] ?? []} title={categoryLabels[key]} />
          ))}
        </div>
      </section>

      <FeatureSection
        features={data.features}
      />
      <MissesSection misses={data.historical.misses} />
      <MethodologySection />
    </main>
  );
}

function HeroStat({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white/70 p-4">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6d675d]">{label}</span>
      <div className="mt-4 text-[clamp(1.25rem,2.4vw,1.8rem)] font-medium text-[#25231f]">{value}</div>
    </div>
  );
}

function SummaryCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-black/10 bg-white/55 p-5 sm:p-6">
      <h2 className="text-xl font-medium tracking-tight text-[#25231f]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#5e5a52]">{body}</p>
    </article>
  );
}

function InsightCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-xl border border-black/10 bg-white/55 p-5 sm:p-6">
      <div className="mb-4 flex size-8 items-center justify-center rounded-full border border-black/10 bg-[#f7f4ee] text-[#8c6f3d]">
        {icon}
      </div>
      <h3 className="text-lg font-medium tracking-tight text-[#25231f]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#5e5a52]">{body}</p>
    </article>
  );
}

function HistoricalPerformanceSection({
  performance,
  yearlyPerformance,
}: {
  performance: ModelPerformance;
  yearlyPerformance: ReturnType<typeof deriveYearlyPerformance>;
}) {
  return (
    <section className="border-y border-black/10 bg-[#efebe2] px-5 py-14 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Validation"
          title="Historical Performance"
          description={
            <>
              <DefinitionTooltip term="Walk-forward Validation" /> tests each ceremony using only the years that came
              before it.
            </>
          }
        />

        <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-medium">Accuracy by Category</h3>
            </div>
            <span className="text-xs uppercase tracking-[0.14em] text-[#6d675d]">Big 6 categories</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {categoryOrder.map((key) => {
              const row = performance.best_models.find((item) => item.category_key === key);
              if (!row) return null;
              return <CategoryPerformanceChip key={key} row={row} />;
            })}
          </div>
        </article>

        <article className="mt-6 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-medium">Year by Year</h3>
              <p className="mt-1 text-sm text-[#6d675d]">
                One held-out ceremony at a time, with no future data leaking backward.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.14em] text-[#6d675d]">
              {yearlyPerformance.length} ceremonies
            </span>
          </div>
          <YearPerformanceTable years={yearlyPerformance} />
        </article>
      </div>
    </section>
  );
}

function YearPerformanceTable({ years }: { years: ReturnType<typeof deriveYearlyPerformance> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
      <div className="max-h-[380px] overflow-y-auto sm:max-h-[480px] [scrollbar-color:#b8aa8f_transparent] [scrollbar-width:thin]">
        <div className="sticky top-0 z-10 hidden grid-cols-[1fr_1fr_1fr_1fr] border-b border-black/10 bg-[#f7f4ee] px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[#6d675d] shadow-[0_1px_0_rgba(0,0,0,0.05)] sm:grid">
          <div>Ceremony Year</div>
          <div>Correct Winners</div>
          <div><DefinitionTooltip term="Winner Accuracy" /></div>
          <div><DefinitionTooltip term="Winner in Top 3" /></div>
        </div>
        <div className="divide-y divide-black/5">
          {years.map((year) => (
            <div
              className="grid gap-2 px-3 py-2.5 text-sm sm:grid-cols-[1fr_1fr_1fr_1fr] sm:items-center"
              key={year.testYear}
            >
              <div className="flex items-center justify-between gap-3 sm:block">
                <span className="text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Ceremony Year</span>
                <span className="font-medium">{year.ceremonyYear}</span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block">
                <span className="text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Correct Winners</span>
                <span>{year.correctWinners}/{year.categoryCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block">
                <span className="text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Winner Accuracy</span>
                <span>{percent(year.winnerAccuracy)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block">
                <span className="text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Winner in Top 3</span>
                <span>{year.top3Correct}/{year.categoryCount} ({percent(year.top3Accuracy)})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DefinitionTooltip({ term }: { term: DefinitionTerm }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);
  const tooltipId = useId();

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const tooltipWidth = Math.min(288, window.innerWidth - 24);
    const left = Math.min(
      window.innerWidth - tooltipWidth - 12,
      Math.max(12, rect.left + rect.width / 2 - tooltipWidth / 2),
    );
    const preferredTop = rect.bottom + 8;
    const top = preferredTop > window.innerHeight - 120 ? Math.max(12, rect.top - 128) : preferredTop;
    setPosition({ left, top });
  }

  function showTooltip() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    updatePosition();
    setOpen(true);
  }

  function scheduleClose() {
    if (pinned) return;
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  function closeTooltip() {
    setPinned(false);
    setOpen(false);
  }

  return (
    <span className="inline-flex items-center gap-1 align-baseline">
      <button
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        ref={buttonRef}
        className="inline-flex items-center gap-1 border-b border-dotted border-[#8c6f3d] text-left decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c6f3d]/40"
        onBlur={scheduleClose}
        onClick={() => {
          updatePosition();
          const next = !pinned;
          setPinned(next);
          setOpen(next);
        }}
        onFocus={showTooltip}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeTooltip();
        }}
        onPointerEnter={showTooltip}
        onPointerLeave={scheduleClose}
        type="button"
      >
        <span>{term}</span>
        <Info className="size-3 text-[#8c6f3d]" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <span
              className="fixed z-[9999] w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-black/10 bg-white p-3 text-xs normal-case leading-5 tracking-normal text-[#4f493f] shadow-lg"
              id={tooltipId}
              onPointerEnter={showTooltip}
              onPointerLeave={scheduleClose}
              role="tooltip"
              style={{ left: position.left, top: position.top }}
            >
              {definitions[term]}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

function CategoryPerformanceChip({ row }: { row: BestModel }) {
  return (
    <div className="rounded-lg border border-black/10 bg-[#f7f4ee] p-3">
      <div className="text-xs leading-4 text-[#6d675d]">{categoryLabels[row.category_key]}</div>
      <div className="mt-2 text-xl font-medium text-[#25231f]">{percent(row.winner_accuracy)}</div>
      <div className="mt-2 h-1.5 rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[#8c6f3d]" style={{ width: `${row.winner_accuracy * 100}%` }} />
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "mb-7"}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6f3d]">{eyebrow}</p>
      <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-medium tracking-tight text-balance text-[#25231f]">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6d675d] sm:text-base">{description}</p>
    </div>
  );
}

function CeremonySwitcher({
  availableCeremonies,
  selectedCeremony,
  setSelectedCeremony,
}: {
  availableCeremonies: Set<number>;
  selectedCeremony: number;
  setSelectedCeremony: (ceremony: number) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d675d]">Ceremony year</span>
      <div className="inline-flex rounded-full border border-black/10 bg-white/60 p-1 shadow-sm">
        {forecastCeremonies.map((ceremony) => {
          const available = availableCeremonies.has(ceremony);
          const selected = selectedCeremony === ceremony;
          return (
            <button
              aria-pressed={selected}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-[#25231f] text-white"
                  : available
                    ? "text-[#4f493f] hover:bg-white"
                    : "cursor-not-allowed text-[#9d968c]"
              }`}
              disabled={!available}
              key={ceremony}
              onClick={() => setSelectedCeremony(ceremony)}
              type="button"
            >
              {ceremony} Oscars
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PredictionCard({
  prediction,
  showSignalTooltip,
}: {
  prediction: DisplayPrediction;
  showSignalTooltip: boolean;
}) {
  const isBestPicture = prediction.category_key === "best_picture";
  const display = predictionDisplay(prediction);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border border-black/10 bg-[#f7f4ee] px-3 py-1 text-xs font-medium text-[#5e5a52]">
          {categoryLabels[prediction.category_key]}
        </span>
        <span className="rounded-full bg-[#ede2c3] px-3 py-1 text-xs font-medium text-[#5f4a20]">
          {displayConfidence(prediction.display_win_probability)}
        </span>
      </div>
      <div>
        <h3 className={`${isBestPicture ? "text-[1.35rem]" : "text-xl"} font-medium leading-tight text-balance`}>
          {display.primary}
        </h3>
        <p aria-hidden={isBestPicture} className="mt-1 min-h-5 text-sm text-[#6d675d]">
          {display.secondary ?? ""}
        </p>
      </div>
      <div>
        <div className="flex items-end justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d675d]">
            Win Probability
          </span>
          <span className="text-[clamp(1.25rem,2.3vw,1.7rem)] font-medium">
            {percent(prediction.display_win_probability)}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-[#8c6f3d]"
            style={{ width: `${Math.min(100, Math.max(0, prediction.display_win_probability * 100))}%` }}
          />
        </div>
      </div>
      <div className="grid gap-2 text-sm">
        <InfoBox
          label="Backtested Accuracy"
          value={percent(prediction.backtested_winner_accuracy)}
        />
      </div>
      <FactorList
        factors={splitFactors(prediction.top_positive_factors).slice(0, 3)}
        label={showSignalTooltip ? <DefinitionTooltip term="Top signals" /> : "Top signals"}
      />
    </article>
  );
}

function InfoBox({ label, value, compact = false }: { label: ReactNode; value: string; compact?: boolean }) {
  return (
    <div className="flex min-h-[74px] flex-col justify-between rounded-lg border border-black/10 bg-[#f7f4ee] p-3">
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6d675d]">{label}</div>
      <div className={`${compact ? "text-[0.8rem] leading-4" : "text-sm"} mt-2 font-medium text-[#25231f]`}>
        {value}
      </div>
    </div>
  );
}

function RankingCard({ title, rows }: { title: string; rows: DisplayPrediction[] }) {
  const isBestPicture = rows[0]?.category_key === "best_picture";

  return (
    <article className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 bg-[#f1eee7] px-4 py-3">
        <h3 className="font-medium">{title}</h3>
      </div>
      <div
        className={`hidden border-b border-black/10 bg-[#f7f4ee] px-4 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[#6d675d] sm:grid sm:items-center sm:gap-3 ${
          isBestPicture
            ? "sm:grid-cols-[2rem_minmax(0,1.8fr)_5.5rem_6.5rem_4.5rem]"
            : "sm:grid-cols-[2rem_minmax(0,1.15fr)_minmax(0,1.2fr)_5.5rem_6.5rem_4.5rem]"
        }`}
      >
        {isBestPicture ? (
          <>
            <div>Rank</div>
            <div>Film</div>
            <div>Win %</div>
            <div>Model</div>
            <div>Confidence</div>
          </>
        ) : (
          <>
            <div>Rank</div>
            <div>Film</div>
            <div>Nominee</div>
            <div>Win %</div>
            <div>Model</div>
            <div>Confidence</div>
          </>
        )}
      </div>
      <div className="divide-y divide-black/5">
        {rows.map((row) => (
          <div
            className={`grid gap-3 px-4 py-3 sm:items-center ${
              row.predicted_rank === 1 ? "bg-[#fff8e6]" : ""
            } ${
              isBestPicture
                ? "sm:grid-cols-[2rem_minmax(0,1.8fr)_5.5rem_6.5rem_4.5rem]"
                : "sm:grid-cols-[2rem_minmax(0,1.15fr)_minmax(0,1.2fr)_5.5rem_6.5rem_4.5rem]"
            }`}
            key={`${row.category_key}-${row.predicted_rank}-${row.film}-${row.person ?? "film"}`}
          >
            <div className="flex items-center justify-between gap-3 sm:block">
              <span className="text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Rank</span>
              <span className="text-sm font-semibold text-[#8c6f3d]">#{row.predicted_rank}</span>
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Film</div>
              <div className="truncate text-sm font-medium">{row.film}</div>
              {!isBestPicture ? <div className="truncate text-xs text-[#6d675d]">{row.person}</div> : null}
            </div>
            {!isBestPicture ? (
              <div className="min-w-0 text-sm text-[#25231f] sm:text-xs sm:text-[#6d675d]">
                <div className="mb-1 text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Nominee</div>
                <span className="block whitespace-normal break-words">{row.person}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 sm:block">
              <span className="text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Win %</span>
              <span className="text-sm font-medium">{percent(row.display_win_probability)}</span>
            </div>
            <div className="hidden text-xs text-[#6d675d] sm:block">{modelName(row.model_type_used)}</div>
            <div className="flex items-center justify-between gap-3 sm:block">
              <span className="text-xs uppercase tracking-[0.12em] text-[#6d675d] sm:hidden">Confidence</span>
              <span className="text-xs text-[#6d675d]">{displayConfidence(row.display_win_probability)}</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function WhyModelLikesSection({ winners }: { winners: DisplayPrediction[] }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Explanation"
        title="Prediction Breakdown"
        description="A concise read on the evidence behind each category leader."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {winners.map((winner) => {
          const display = predictionDisplay(winner);
          return (
            <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm" key={winner.category_key}>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-black/10 bg-[#f7f4ee] px-3 py-1 text-xs font-medium text-[#5e5a52]">
                  {categoryLabels[winner.category_key]}
                </span>
                <span className="text-xs font-medium text-[#8c6f3d]">{percent(winner.display_win_probability)}</span>
              </div>
              <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6d675d]">Leader</p>
              <h3 className="mt-1 font-medium leading-snug text-[#25231f]">{display.primary}</h3>
              {display.secondary ? <p className="mt-1 text-sm text-[#6d675d]">{display.secondary}</p> : null}
              <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6d675d]">Read</p>
              <p className="mt-1 text-sm leading-6 text-[#5e5a52]">{winnerExplanation(winner)}</p>
              <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6d675d]">Top signals</p>
              <ul className="mt-2 grid gap-1.5 text-sm text-[#4f493f]">
                {winnerSignalGroups(winner).map((signal) => (
                  <li className="flex gap-2" key={signal}>
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#8c6f3d]" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function winnerExplanation(winner: DisplayPrediction) {
  const signals = winnerSignalGroups(winner);
  if (!signals.length) {
    return "The available data gives this nominee the strongest profile in the field.";
  }
  const category = winner.category_key;
  if (signals.some((signal) => signal.includes("Awards")) && signals.some((signal) => signal.includes("Guild"))) {
    return "Awards momentum and guild support are doing most of the work here.";
  }
  if (category === "best_director") {
    return "Director-specific precursor support separates this pick from the field.";
  }
  if (category.includes("actor") || category.includes("actress")) {
    return "Acting-branch support and person-level awards history carry the prediction.";
  }
  return `${formatSignalList(signals.slice(0, 2))} give this nominee the clearest path.`;
}

function formatSignalList(signals: string[]) {
  if (signals.length === 1) return signals[0];
  if (signals.length === 2) return `${signals[0]} and ${signals[1]}`;
  return `${signals.slice(0, -1).join(", ")}, and ${signals[signals.length - 1]}`;
}

function winnerSignalGroups(winner: DisplayPrediction) {
  const rawSignals = splitFactors(winner.top_positive_factors)
    .map((signal) => signal.replace(/\s\([+-].*?\)$/, "").replace(/:.+$/, ""))
    .map(groupSignalName);
  return Array.from(new Set(rawSignals)).filter(Boolean).slice(0, 3);
}

function groupSignalName(signal: string) {
  const normalized = signal.toLowerCase();
  if (normalized.includes("dga") || normalized.includes("directors guild")) return "Directors Guild support";
  if (normalized.includes("pga") || normalized.includes("producers guild")) return "Producers Guild support";
  if (normalized.includes("sag")) return "SAG support";
  if (normalized.includes("bafta")) return "BAFTA support";
  if (normalized.includes("golden globe")) return "Golden Globe support";
  if (normalized.includes("critics choice")) return "Critics Choice support";
  if (normalized.includes("precursor") || normalized.includes("awards momentum") || normalized.includes("awards history")) {
    return "Awards momentum";
  }
  if (normalized.includes("critic") || normalized.includes("letterboxd") || normalized.includes("audience rating")) {
    return "Critical reception";
  }
  if (normalized.includes("tmdb") || normalized.includes("audience visibility") || normalized.includes("vote count")) {
    return "Audience visibility";
  }
  if (normalized.includes("release")) return "Release strategy";
  if (normalized.includes("box office") || normalized.includes("budget")) return "Commercial profile";
  if (normalized.includes("runtime") || normalized.includes("genre")) return "Film profile";
  return signal;
}

function FactorList({ factors, label }: { factors: string[]; label: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6d675d]">{label}</p>
      <ul className="grid gap-1.5 text-sm text-[#4f493f]">
        {factors.map((factor) => (
          <li className="flex gap-2" key={factor}>
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#8c6f3d]" />
            <span>{factor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureSection({
  features,
}: {
  features: FeatureImportance[];
}) {
  const grouped = useMemo(() => {
    return features
      .reduce<Record<string, FeatureImportance[]>>((acc, item) => {
        acc[item.category_key] = acc[item.category_key] || [];
        acc[item.category_key].push(item);
        return acc;
      }, {});
  }, [features]);

  return (
    <section className="border-y border-black/10 bg-[#efebe2] px-5 py-14 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Feature analysis"
          title="Most Influential Signals"
          description={
            <>
              <DefinitionTooltip term="Feature Importance" /> shows which inputs carried the most weight in each race.
            </>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryOrder
            .filter((key) => grouped[key])
            .map((key) => {
              const rows = aggregateSignalRows(grouped[key]).slice(0, 5);
              const max = Math.max(...rows.map((row) => row.importance), 0.001);
              return (
                <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm" key={key}>
                  <h3 className="text-lg font-medium">{categoryLabels[key]}</h3>
                  <div className="mt-4 grid gap-3.5">
                    {rows.map((row, index) => (
                      <div className="grid gap-2" key={`${key}-${row.logical_feature ?? row.feature}-${index}`}>
                        <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-3 text-sm">
                          <div className="flex size-7 items-center justify-center rounded-full border border-black/10 bg-[#f7f4ee] text-[#8c6f3d]">
                            {signalIcon(row.signal_type)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-medium text-[#8c6f3d]">{index + 1}.</span>
                              <span className="truncate font-medium text-[#25231f]" title={signalLabel(row)}>
                                {signalLabel(row)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-10 h-1.5 rounded-full bg-black/10">
                          <div
                            className="h-full rounded-full bg-[#8c6f3d]"
                            style={{ width: `${Math.max(8, (row.importance / max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
        </div>
        <SignalGlossaryAccordion />
        <p className="mt-5 max-w-4xl text-sm leading-6 text-[#6d675d]">
          These signals show relative influence in the historical models. They are not proof that any one factor causes
          an Oscar win.
        </p>
      </div>
    </section>
  );
}

function signalLabel(row: FeatureImportance) {
  const label = row.signal_label || featureName(row.logical_feature || row.feature);
  const replacements: Record<string, string> = {
    "Previous awards momentum": "Awards Momentum",
    "Person precursor strength": "Awards History",
    "Release timing": "Release Strategy",
    "Audience rating": "Audience Reception",
    "Precursor wins": "Guild Wins",
    "DGA win": "Directors Guild Win",
    "Directors Guild win": "Directors Guild Win",
    "PGA win": "Producers Guild Win",
    "Producers Guild win": "Producers Guild Win",
    "SAG acting win": "SAG Acting Win",
    "Golden Globe acting win": "Golden Globe Acting Win",
  };
  return replacements[label] || label;
}

function aggregateSignalRows(rows: FeatureImportance[]) {
  const groupedRows = rows.reduce<Record<string, FeatureImportance>>((acc, row) => {
    const key = row.logical_feature || row.feature.toLowerCase().replaceAll(" ", "_");
    const existing = acc[key];
    if (!existing) {
      acc[key] = { ...row, logical_feature: key };
      return acc;
    }
    acc[key] = {
      ...existing,
      importance: existing.importance + row.importance,
      raw_features: [existing.raw_features, row.raw_features || row.feature].filter(Boolean).join("; "),
    };
    return acc;
  }, {});

  return Object.values(groupedRows).sort((a, b) => b.importance - a.importance);
}

function signalIcon(type: string | undefined) {
  const className = "size-3.5";
  if (type === "awards") return <Award className={className} />;
  if (type === "person") return <UserRound className={className} />;
  if (type === "reception") return <Star className={className} />;
  if (type === "momentum" || type === "visibility") return <TrendingUp className={className} />;
  if (type === "timing") return <Calendar className={className} />;
  return <Clapperboard className={className} />;
}

function MissesSection({ misses }: { misses: HistoricalMiss[] }) {
  const visible = misses.slice(0, 10);

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Limitations"
        title="Where the Model Missed"
        description="The misses show where the analysis struggled with late movement, unusual narratives, or shifts in Academy preference."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((miss) => (
          <article
            className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm"
            key={`${miss.category_key}-${miss.test_year}-${miss.actual_winner_film}`}
          >
            <div className="text-xl font-medium text-[#8c6f3d]">{miss.test_year}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{categoryLabels[miss.category_key]}</h3>
                <span className="rounded-full bg-[#f7f4ee] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-[#8c6f3d]">
                  {missLabel(miss.actual_winner_rank)}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="grid gap-1 sm:grid-cols-[104px_minmax(0,1fr)]">
                  <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#8b8378]">
                    Actual winner
                  </span>
                  <MissParticipant
                    categoryKey={miss.category_key}
                    person={miss.actual_winner_person}
                    film={miss.actual_winner_film}
                  />
                </div>
                <div className="grid gap-1 sm:grid-cols-[104px_minmax(0,1fr)]">
                  <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#8b8378]">
                    Model picked
                  </span>
                  <div className="min-w-0">
                    <MissParticipant
                      categoryKey={miss.category_key}
                      person={miss.predicted_winner_person}
                      film={miss.predicted_winner_film}
                    />
                    <span className="mt-1 block text-xs text-[#7a7268]">
                      Actual winner ranked #{miss.actual_winner_rank}.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function missLabel(rank: number) {
  if (rank === 2) return "Winner ranked #2";
  if (rank <= 3) return `Winner ranked #${rank}`;
  if (rank === 4) return "Winner ranked #4";
  return "Outside Top 3";
}

function SignalGlossaryAccordion() {
  const entries = [
    ["Awards Momentum", "Measures how much support a nominee has built across the season. It matters because Oscar races often harden before final voting."],
    ["Guild Wins", "Tracks wins from major industry groups. These matter because many guild voters overlap with the Academy or mirror its preferences."],
    ["Producers Guild Win", "Captures PGA support. It is especially useful for Best Picture because producers vote on similar full-film consensus."],
    ["Directors Guild Win", "Captures DGA support. It often points to director strength and can spill into Best Picture."],
    ["SAG Acting Win", "Captures actor-branch momentum. Acting races are often strongly shaped by SAG outcomes."],
    ["SAG Ensemble Win", "Measures cast-wide industry support. It can flag broad affection for a film, especially in Best Picture."],
    ["Golden Globe Acting Win", "Adds an early acting-race signal. It matters less alone, but helps when it agrees with SAG or BAFTA."],
    ["Critics Choice Picture Win", "Adds a film-level precursor signal from a critics-adjacent body. It helps when the industry field is still unsettled."],
    ["BAFTA Acting Win", "Adds international industry support. It can catch acting momentum that US-only signals miss."],
    ["Critical Reception", "Summarizes critic response. It matters most when quality consensus reinforces awards momentum."],
    ["Audience Reception", "Captures audience-facing ratings where available. It helps separate broad enthusiasm from industry-only support."],
    ["Audience Visibility", "Measures whether a film or performance is widely seen or discussed. Visibility can help, but rarely wins a race by itself."],
    ["Release Strategy", "Tracks timing, such as release month or awards-season placement. Timing matters because voters remember some campaigns more clearly."],
    ["Career Stage", "Adds career context for performers and filmmakers. The Academy sometimes rewards timing as much as the role itself."],
    ["Awards History", "Tracks prior nominations, wins, and accumulated momentum. It helps the model recognize overdue or already-trusted contenders."],
    ["Person-Level History", "Looks at the nominee's Oscar and awards background. It matters most in acting and directing races."],
    ["Directing Awards Momentum", "Focuses on director-specific precursor support. It helps separate film enthusiasm from support for the director personally."],
    ["Awards Consensus", "Checks whether multiple bodies point to the same nominee. Agreement across groups is usually stronger than one isolated win."],
    ["Precursor Nominations", "Counts appearances across major pre-Oscar awards. Nominations matter because they show consistent presence even without wins."],
    ["Precursor Win Rate", "Measures how often a nominee converts chances into wins. It helps distinguish a frontrunner from a frequent runner-up."],
  ];
  const technicalExamples = [
    "dga_win -> Directors Guild Win",
    "pga_win -> Producers Guild Win",
    "sag_person_win -> SAG Acting Win",
    "person_precursor_strength -> Awards Momentum",
    "release_month -> Release Strategy",
    "tmdb_popularity -> Audience Visibility",
  ];

  return (
    <Accordion
      className="mt-5 bg-white"
      eyebrow="Reference"
      title="Signal Glossary"
      description="Plain-English notes on the inputs used throughout the page."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(([term, definition]) => (
          <article className="rounded-lg border border-black/10 bg-[#f7f4ee] p-4" key={term}>
            <h3 className="text-sm font-medium text-[#25231f]">{term}</h3>
            <p className="mt-2 text-sm leading-6 text-[#5e5a52]">{definition}</p>
          </article>
        ))}
      </div>
      <details className="mt-4 rounded-lg border border-black/10 bg-[#f7f4ee] p-4">
        <summary className="cursor-pointer text-sm font-medium text-[#25231f]">Technical feature examples</summary>
        <div className="mt-3 grid gap-2 text-sm text-[#5e5a52] sm:grid-cols-2">
          {technicalExamples.map((example) => (
            <code className="rounded-md bg-white/70 px-2 py-1 text-xs text-[#4f493f]" key={example}>
              {example}
            </code>
          ))}
        </div>
      </details>
    </Accordion>
  );
}

function Accordion({
  eyebrow,
  title,
  description,
  children,
  className = "",
  defaultOpen = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl border border-black/10 p-5 shadow-sm ${className}`}>
      <button
        aria-expanded={open}
        className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-none"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6f3d]">{eyebrow}</span>
          <span className="mt-2 block text-[clamp(1.5rem,2.4vw,2rem)] font-medium tracking-tight text-[#25231f]">
            {title}
          </span>
          {description ? <span className="mt-2 block text-sm leading-6 text-[#6d675d]">{description}</span> : null}
        </span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/60 text-[#8c6f3d] transition group-hover:bg-white group-focus-visible:ring-2 group-focus-visible:ring-[#8c6f3d]/35">
          <ChevronDown
            className={`size-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function MethodologySection() {
  const pipeline: Array<[string, string, ReactNode]> = [
    ["Past Races", "Start with Big 6 nominees and winners from earlier ceremonies.", <Search className="size-4" key="data" />],
    ["Signal Building", "Add precursors, reviews, release timing, people, and media context.", <Sparkles className="size-4" key="features" />],
    ["Separate Models", "Train each category on its own because the races do not behave the same way.", <Clapperboard className="size-4" key="models" />],
    ["Backtesting", "Predict one future ceremony at a time using only the years before it.", <BarChart3 className="size-4" key="validation" />],
    ["Current Forecast", "Rank the known nominees for the selected ceremony.", <Award className="size-4" key="forecast" />],
    ["Product View", "Export the results into a static page that can live on the site.", <Medal className="size-4" key="dashboard" />],
  ];

  return (
    <section className="border-t border-black/10 bg-white px-5 py-14 sm:px-8 lg:px-12" id="methodology">
      <div className="mx-auto max-w-6xl">
        <Accordion
          className="bg-[#f7f4ee] shadow-none"
          eyebrow="Methodology"
          title="How the Forecast Works"
          defaultOpen
        >
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pipeline.map(([title, body, icon], index) => (
              <article className="rounded-lg border border-black/10 bg-white/65 p-4" key={title}>
                <div className="mb-3 flex items-center gap-2 text-[#8c6f3d]">
                  <span className="flex size-7 items-center justify-center rounded-full border border-black/10 bg-[#f7f4ee]">
                    {icon}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">Step {index + 1}</span>
                </div>
                <h3 className="font-medium text-[#25231f]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5e5a52]">{body}</p>
              </article>
            ))}
          </div>
        </Accordion>
        <div className="mt-4 rounded-xl border border-black/10 bg-[#f7f4ee] p-5">
          <h3 className="font-medium text-[#25231f]">About the probabilities</h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#5e5a52]">
            The displayed win probabilities are normalized within each category, so each race adds up to 100%. The raw
            model scores stay in the exported data for analysis.
          </p>
        </div>
      </div>
    </section>
  );
}
