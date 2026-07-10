import type { Metadata } from "next";

import OscarPredictionDashboard from "./oscar-prediction-dashboard";

export const metadata: Metadata = {
  title: "Awards Intelligence | Amy Wilson",
  description:
    "A portfolio case study for an AI-assisted Academy Awards forecasting system using historical nominees, precursor awards, film metadata, and machine learning.",
};

export default function OscarPredictionPage() {
  return <OscarPredictionDashboard />;
}
