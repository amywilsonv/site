"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  importance: number;
  rank: number;
};

type HistoricalMiss = {
  category_key: string;
  category: string;
  test_year: number;
  actual_winner_film: string;
  predicted_winner_film: string;
  actual_winner_rank: number;
};

type HistoricalPredictions = {
  misses: HistoricalMiss[];
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
  best_director: "Directing",
  best_actor: "Actor in a Leading Role",
  best_actress: "Actress in a Leading Role",
  best_supporting_actor: "Actor in a Supporting Role",
  best_supporting_actress: "Actress in a Supporting Role",
};

const dataBase = "/oscar-prediction";

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

function cleanFeature(value: string) {
  return value.replaceAll("_", " ");
}

function splitFactors(value: string) {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function categorySort<T extends { category_key: string; predicted_rank?: number }>(a: T, b: T) {
  const categoryDelta = categoryOrder.indexOf(a.category_key) - categoryOrder.indexOf(b.category_key);
  return categoryDelta || Number(a.predicted_rank ?? 0) - Number(b.predicted_rank ?? 0);
}

export default function OscarPredictionDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"predictions" | "performance">("predictions");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [predictions, performance, features, historical, methodology] = await Promise.all([
          fetchJson<Prediction[]>("predictions.json"),
          fetchJson<ModelPerformance>("model_performance.json"),
          fetchJson<FeatureImportance[]>("feature_importance.json"),
          fetchJson<HistoricalPredictions>("historical_predictions.json"),
          fetchJson<Methodology>("methodology.json"),
        ]);
        setData({ predictions, performance, features, historical, methodology });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Dashboard data failed to load.");
      }
    }
    loadDashboardData();
  }, []);

  const visiblePredictions = useMemo(() => {
    if (!data) return [];
    return data.predictions
      .filter((row) => category === "all" || row.category_key === category)
      .sort(categorySort);
  }, [category, data]);

  const winnerRows = visiblePredictions.filter((row) => row.predicted_winner === 1);
  const performanceRows = useMemo(() => {
    if (!data) return [];
    return data.performance.best_models
      .filter((row) => category === "all" || row.category_key === category)
      .sort((a, b) => categoryOrder.indexOf(a.category_key) - categoryOrder.indexOf(b.category_key));
  }, [category, data]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#120f0d] p-8 text-[#f6efe2]">
        <p>{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#120f0d] text-[#f6efe2]">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8b15d]">Loading Oscar model dashboard</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120f0d] text-[#f6efe2]">
      <section className="relative overflow-hidden border-b border-[#d8b15d]/20 px-5 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(216,177,93,0.22),transparent_34%),linear-gradient(135deg,rgba(18,15,13,0.7),rgba(18,15,13,1))]" />
        <div className="relative mx-auto flex min-h-[82vh] max-w-7xl flex-col">
          <header className="flex items-center justify-between border-b border-[#d8b15d]/20 pb-5">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#e7dcc9] transition hover:text-[#f1d89a]"
              href="/"
            >
              <ArrowLeft className="size-4" />
              Amy Wilson
            </Link>
            <span className="text-sm font-semibold text-[#b9aa92]">Portfolio Project</span>
          </header>

          <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-[#f1d89a]">
                Awards intelligence dashboard
              </p>
              <h1 className="max-w-4xl text-6xl font-black leading-[0.88] tracking-tight text-balance sm:text-7xl lg:text-8xl">
                Oscar Prediction Workbench
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#e7dcc9] sm:text-xl">
                {data.methodology.summary}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[#d8b15d] px-5 text-sm font-extrabold text-[#17110a]"
                  href="#predictions"
                >
                  <Trophy className="size-4" />
                  View predictions
                </a>
                <a
                  className="inline-flex h-11 items-center rounded-md border border-[#d8b15d]/30 px-5 text-sm font-extrabold text-[#f6efe2]"
                  href="#methodology"
                >
                  Methodology
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border border-[#d8b15d]/20 bg-[#1a1512]/80 p-4 shadow-2xl backdrop-blur">
              <HeroStat label="Prediction year" value={String(data.performance.prediction_year)} />
              <HeroStat label="Known nominees" value={String(data.performance.nominee_count)} />
              <HeroStat label="Avg winner accuracy" value={percent(data.performance.average_winner_accuracy)} />
              <HeroStat label="Avg top-3 accuracy" value={percent(data.performance.average_top3_accuracy)} />
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-[#d8b15d]/20 bg-[#120f0d]/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b9aa92]" htmlFor="category">
              Category
            </label>
            <select
              className="h-10 min-w-72 rounded-md border border-[#d8b15d]/25 bg-[#231d18] px-3 text-sm text-[#f6efe2]"
              id="category"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="all">All Big Six Categories</option>
              {categoryOrder.map((key) => (
                <option key={key} value={key}>
                  {categoryLabels[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex rounded-md border border-[#d8b15d]/25">
            {(["predictions", "performance"] as const).map((option) => (
              <button
                className={`h-10 px-4 text-sm font-extrabold ${
                  view === option ? "bg-[#d8b15d] text-[#17110a]" : "text-[#b9aa92]"
                }`}
                key={option}
                onClick={() => setView(option)}
                type="button"
              >
                {option === "predictions" ? "Predictions" : "Historical Performance"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12" id="predictions">
        <SectionTitle
          eyebrow="Current forecast"
          title="Predicted Winners"
          description="Each card uses the saved best winner model for that category."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {winnerRows.map((winner) => (
            <PredictionCard
              expanded={expandedCategory === winner.category_key}
              key={winner.category_key}
              onToggle={() =>
                setExpandedCategory(expandedCategory === winner.category_key ? null : winner.category_key)
              }
              prediction={winner}
            />
          ))}
        </div>
      </section>

      {view === "predictions" ? (
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-12">
          <SectionTitle
            eyebrow="Nominee rankings"
            title="Category Table"
            description="Predicted win probability is shown for each known nominee in the selected category view."
          />
          <div className="overflow-x-auto border border-[#d8b15d]/20 bg-[#1a1512]/80">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#d8b15d]/10 text-xs uppercase tracking-[0.12em] text-[#f1d89a]">
                  <th className="p-4">Rank</th>
                  <th className="p-4">Film</th>
                  <th className="p-4">Nominee</th>
                  <th className="p-4">Win probability</th>
                  <th className="p-4">Model</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Top explanation</th>
                </tr>
              </thead>
              <tbody>
                {visiblePredictions.map((row, index) => (
                  <tr
                    className="border-t border-[#d8b15d]/10"
                    key={`${row.category_key}-${row.predicted_rank}-${row.film}-${row.person ?? "film"}-${index}`}
                  >
                    <td className="p-4 font-black text-[#f1d89a]">{row.predicted_rank}</td>
                    <td className="p-4 font-semibold">{row.film}</td>
                    <td className="p-4 text-[#b9aa92]">{row.person}</td>
                    <td className="p-4">{percent(row.predicted_win_probability)}</td>
                    <td className="p-4 text-[#b9aa92]">{row.model_type_used}</td>
                    <td className="p-4">{row.confidence_level}</td>
                    <td className="max-w-sm p-4 text-[#e7dcc9]">{splitFactors(row.top_positive_factors)[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <PerformanceSection rows={performanceRows} />
      )}

      <FeatureSection
        category={category}
        features={data.features}
        showAll={showAllFeatures}
        toggleShowAll={() => setShowAllFeatures(!showAllFeatures)}
      />
      <MissesSection category={category} misses={data.historical.misses} />
      <MethodologySection methodology={data.methodology} />
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-28 border border-white/10 bg-white/[0.035] p-4">
      <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#b9aa92]">{label}</span>
      <div className="mt-6 text-3xl font-black text-[#f6efe2]">{value}</div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[#f1d89a]">{eyebrow}</p>
      <h2 className="text-4xl font-black tracking-tight text-balance sm:text-5xl">{title}</h2>
      <p className="mt-4 max-w-3xl leading-7 text-[#b9aa92]">{description}</p>
    </div>
  );
}

function PredictionCard({
  prediction,
  expanded,
  onToggle,
}: {
  prediction: Prediction;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="flex min-h-[390px] flex-col gap-5 rounded-md border border-[#d8b15d]/20 bg-[#231d18] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-sm border border-[#d8b15d]/30 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#f1d89a]">
          {prediction.category}
        </span>
        <span className="rounded-sm bg-[#d8b15d] px-3 py-1 text-xs font-extrabold uppercase text-[#17110a]">
          {prediction.confidence_level}
        </span>
      </div>
      <div>
        <h3 className="text-3xl font-black leading-none text-balance">{prediction.film}</h3>
        {prediction.person ? <p className="mt-2 text-[#b9aa92]">{prediction.person}</p> : null}
      </div>
      <div>
        <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#b9aa92]">Win probability</div>
        <div className="mt-2 text-4xl font-black">{percent(prediction.predicted_win_probability)}</div>
        <div className="mt-3 h-2 bg-white/10">
          <div
            className="h-full bg-[#d8b15d]"
            style={{ width: `${Math.min(100, Math.max(0, prediction.predicted_win_probability * 100))}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoBox label="Model" value={prediction.model_type_used} />
        <InfoBox label="Backtested" value={percent(prediction.backtested_winner_accuracy)} />
      </div>
      <FactorList factors={splitFactors(prediction.top_positive_factors)} icon={<Sparkles className="size-4" />} />
      <button
        className="mt-auto inline-flex items-center gap-2 text-left text-sm font-extrabold text-[#f1d89a]"
        onClick={onToggle}
        type="button"
      >
        {expanded ? "Hide risk factors" : "Show risk factors"}
        <ChevronDown className={`size-4 transition ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded ? (
        <FactorList
          factors={splitFactors(prediction.top_negative_factors)}
          icon={<AlertTriangle className="size-4 text-[#d77b6f]" />}
        />
      ) : null}
    </article>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.035] p-3">
      <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#b9aa92]">{label}</div>
      <div className="mt-2 font-semibold">{value}</div>
    </div>
  );
}

function FactorList({ factors, icon }: { factors: string[]; icon: React.ReactNode }) {
  return (
    <ul className="grid gap-2 text-sm text-[#e7dcc9]">
      {factors.map((factor) => (
        <li className="flex gap-2" key={factor}>
          <span className="mt-0.5 text-[#d8b15d]">{icon}</span>
          <span>{factor}</span>
        </li>
      ))}
    </ul>
  );
}

function PerformanceSection({ rows }: { rows: BestModel[] }) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Backtested performance"
        title="Model Selection By Category"
        description="The best model family is chosen independently for each category using walk-forward validation."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map((row) => (
          <article className="rounded-md border border-[#d8b15d]/20 bg-[#231d18] p-5" key={row.category_key}>
            <span className="rounded-sm border border-[#d8b15d]/30 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#f1d89a]">
              {categoryLabels[row.category_key]}
            </span>
            <h3 className="mt-4 text-2xl font-black">{row.model_name}</h3>
            <MetricBar label="Winner accuracy" value={row.winner_accuracy} />
            <MetricBar label="Top-3 accuracy" value={row.top3_accuracy} />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InfoBox label="Avg rank" value={row.average_rank_of_actual_winner.toFixed(2)} />
              <InfoBox
                label="Correct years"
                value={`${row.number_of_correct_winner_predictions}/${row.number_of_test_years}`}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-[#b9aa92]">{label}</span>
        <strong>{percent(value)}</strong>
      </div>
      <div className="h-2 bg-white/10">
        <div className="h-full bg-[#d8b15d]" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

function FeatureSection({
  category,
  features,
  showAll,
  toggleShowAll,
}: {
  category: string;
  features: FeatureImportance[];
  showAll: boolean;
  toggleShowAll: () => void;
}) {
  const grouped = useMemo(() => {
    return features
      .filter((feature) => category === "all" || feature.category_key === category)
      .reduce<Record<string, FeatureImportance[]>>((acc, item) => {
        acc[item.category_key] = acc[item.category_key] || [];
        acc[item.category_key].push(item);
        return acc;
      }, {});
  }, [category, features]);

  return (
    <section className="border-y border-[#d8b15d]/20 bg-[#1a1512] px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionTitle
            eyebrow="Feature importance"
            title="Signals The Models Lean On"
            description="Precursor and person-level features show up heavily across the strongest categories."
          />
          <button
            className="h-10 rounded-md border border-[#d8b15d]/30 px-4 text-sm font-extrabold text-[#f1d89a]"
            onClick={toggleShowAll}
            type="button"
          >
            {showAll ? "Show fewer features" : "Show more features"}
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {categoryOrder
            .filter((key) => grouped[key])
            .map((key) => {
              const rows = grouped[key].sort((a, b) => a.rank - b.rank).slice(0, showAll ? 12 : 6);
              const max = Math.max(...rows.map((row) => row.importance), 0.001);
              return (
                <article className="rounded-md border border-[#d8b15d]/20 bg-[#231d18] p-5" key={key}>
                  <h3 className="text-xl font-black">{categoryLabels[key]}</h3>
                  <div className="mt-4 grid gap-3">
                    {rows.map((row, index) => (
                      <div
                        className="grid grid-cols-[1fr_90px] items-center gap-3 text-sm"
                        key={`${key}-${row.model_name}-${row.rank}-${row.feature}-${index}`}
                      >
                        <span className="text-[#e7dcc9]">{cleanFeature(row.feature)}</span>
                        <div className="h-2 bg-white/10">
                          <div className="h-full bg-[#d8b15d]" style={{ width: `${(row.importance / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
}

function MissesSection({ category, misses }: { category: string; misses: HistoricalMiss[] }) {
  const visible = misses
    .filter((miss) => category === "all" || miss.category_key === category)
    .slice(0, category === "all" ? 10 : 24);

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
      <SectionTitle
        eyebrow="Misses and humility"
        title="Where The Model Was Wrong"
        description="The model ranks known nominees, not the entire universe of eligible films."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((miss) => (
          <article className="grid grid-cols-[72px_1fr] gap-4 rounded-md border border-[#d8b15d]/20 bg-[#231d18] p-5" key={`${miss.category_key}-${miss.test_year}-${miss.actual_winner_film}`}>
            <div className="text-2xl font-black text-[#f1d89a]">{miss.test_year}</div>
            <div>
              <h3 className="font-black">{categoryLabels[miss.category_key]}</h3>
              <p className="mt-2 text-sm text-[#e7dcc9]">Actual winner: {miss.actual_winner_film}</p>
              <p className="mt-1 text-sm text-[#b9aa92]">
                Model picked {miss.predicted_winner_film}; actual winner ranked #{miss.actual_winner_rank}.
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MethodologySection({ methodology }: { methodology: Methodology }) {
  const cards = [
    ["Data sources", methodology.data_sources],
    ["Feature layers", methodology.feature_layers],
    ["Validation", methodology.validation],
    ["Limitations", methodology.limitations],
  ];

  return (
    <section className="border-t border-[#d8b15d]/20 bg-[#1a1512] px-5 py-16 sm:px-8 lg:px-12" id="methodology">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Methodology"
          title="How The Forecast Is Built"
          description="A static website version of the local model workbench, powered by exported JSON artifacts."
        />
        <div className="grid gap-4 lg:grid-cols-4">
          {cards.map(([title, items]) => (
            <article className="rounded-md border border-[#d8b15d]/20 bg-[#231d18] p-5" key={title as string}>
              <div className="mb-4 flex items-center gap-2 text-[#f1d89a]">
                {title === "Validation" ? <BarChart3 className="size-4" /> : <Medal className="size-4" />}
                <h3 className="font-black">{title as string}</h3>
              </div>
              <ul className="grid gap-2 text-sm leading-6 text-[#b9aa92]">
                {(items as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
