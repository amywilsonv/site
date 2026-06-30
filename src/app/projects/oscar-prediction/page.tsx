import type { Metadata } from "next";

import OscarPredictionDashboard from "./oscar-prediction-dashboard";

export const metadata: Metadata = {
  title: "Oscar Prediction | Amy Wilson",
  description:
    "An interactive Oscar prediction dashboard using historical nominees, precursor awards, TMDb metadata, and walk-forward model evaluation.",
};

export default function OscarPredictionPage() {
  return <OscarPredictionDashboard />;
}
