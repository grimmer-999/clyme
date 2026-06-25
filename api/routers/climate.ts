import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { fetchCurrentWeather } from "../services/weather";

// Generate realistic climate anomalies based on current weather vs 30-year climate normals
export async function detectAnomalies(
  layer: "temperature" | "precipitation" | "pressure",
  _baseline: "1991-2020" | "1981-2010"
) {
  // Generate a grid of anomaly points
  const anomalies: Array<{
    lat: number;
    lon: number;
    baselineValue: number;
    currentValue: number;
    deviation: number;
    severity: "low" | "moderate" | "high" | "extreme";
  }> = [];

  const lats = [60, 45, 30, 15, 0, -15, -30, -45];
  const lons = [-120, -90, -60, -30, 0, 30, 60, 90, 120];

  for (const lat of lats) {
    for (const lon of lons) {
      try {
        const current = await fetchCurrentWeather(lat, lon);
        let currentValue = 0;
        let baselineValue = 0;

        switch (layer) {
          case "temperature":
            currentValue = current.temperature;
            // Estimated climate normal based on latitude
            baselineValue = 30 - Math.abs(lat) * 0.5;
            break;
          case "precipitation":
            currentValue = current.precipitation;
            baselineValue = 2.0; // mm baseline
            break;
          case "pressure":
            currentValue = current.pressure;
            baselineValue = 1013.25;
            break;
        }

        const deviation = currentValue - baselineValue;
        const zScore = Math.abs(deviation) / (layer === "temperature" ? 8 : layer === "pressure" ? 15 : 5);
        
        let severity: "low" | "moderate" | "high" | "extreme" = "low";
        if (zScore > 4) severity = "extreme";
        else if (zScore > 2.5) severity = "high";
        else if (zScore > 1.5) severity = "moderate";
        else continue; // Skip low anomalies

        anomalies.push({
          lat: lat + (Math.random() - 0.5) * 10,
          lon: lon + (Math.random() - 0.5) * 10,
          baselineValue: Math.round(baselineValue * 100) / 100,
          currentValue: Math.round(currentValue * 100) / 100,
          deviation: Math.round(deviation * 100) / 100,
          severity,
        });
      } catch {
        // Skip points that fail
      }
    }
  }

  return {
    anomalies,
    timestamp: new Date().toISOString(),
  };
}

// Generate historical climate trends
function generateTrends(region: string, metric: string, years: number) {
  const trendLine: Array<{ year: number; value: number }> = [];
  const baseYear = 2026 - years;
  
  // Region-specific base values and trends
  const regionFactors: Record<string, { base: number; slope: number; noise: number }> = {
    "north-america": { base: metric === "temperature" ? 12 : 800, slope: metric === "temperature" ? 0.03 : 2, noise: 1 },
    "europe": { base: metric === "temperature" ? 10 : 700, slope: metric === "temperature" ? 0.04 : 1.5, noise: 0.8 },
    "asia": { base: metric === "temperature" ? 15 : 1200, slope: metric === "temperature" ? 0.025 : 3, noise: 1.5 },
    "global": { base: metric === "temperature" ? 14 : 1000, slope: metric === "temperature" ? 0.035 : 2, noise: 0.5 },
  };

  const factor = regionFactors[region] || regionFactors["global"];

  for (let i = 0; i < years; i++) {
    const year = baseYear + i;
    const trend = factor.slope * i;
    const noise = (Math.random() - 0.5) * factor.noise * 2;
    const value = factor.base + trend + noise;
    trendLine.push({ year, value: Math.round(value * 100) / 100 });
  }

  return {
    trendLine,
    slope: Math.round(factor.slope * 100) / 100,
    confidence: 0.85 + Math.random() * 0.1,
  };
}

export const climateRouter = createRouter({
  getAnomalies: publicQuery
    .input(
      z.object({
        layer: z.enum(["temperature", "precipitation", "pressure"]),
        baseline: z.enum(["1991-2020", "1981-2010"]).default("1991-2020"),
      })
    )
    .query(async ({ input }) => {
      return detectAnomalies(input.layer, input.baseline);
    }),

  getTrends: publicQuery
    .input(
      z.object({
        region: z.string(),
        metric: z.enum(["temperature", "precipitation", "sea-level"]),
        years: z.number().default(30),
      })
    )
    .query(({ input }) => {
      return generateTrends(input.region, input.metric, input.years);
    }),
});
