import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { fetchCurrentWeather, fetchForecast } from "../services/weather";

// Simple ML-like prediction using weather patterns and statistical models
export async function predictTemperature(
  lat: number,
  lon: number,
  hoursAhead: number
): Promise<{
  prediction: number;
  confidenceInterval: [number, number];
  confidence: number;
  features: string[];
}> {
  const current = await fetchCurrentWeather(lat, lon);
  const forecast = await fetchForecast(lat, lon, hoursAhead + 6);

  // Feature extraction (simulating ML model)
  const features = [
    `lat_${lat.toFixed(1)}`,
    `pressure_${current.pressure}`,
    `humidity_${current.humidity}`,
    `wind_${current.windSpeed}`,
    `season_${getSeason(lat)}`,
    `trend_${calculateTrend(forecast.hourly.map((h) => h.temperature))}`,
  ];

  // Simple linear regression-like prediction
  const pressureTrend = (current.pressure - 1013.25) * -0.1;
  const humidityEffect = (current.humidity - 50) * 0.02;
  const diurnalCycle = Math.sin((hoursAhead / 24) * Math.PI * 2) * 5;
  const baseTemp = current.temperature;

  const prediction = baseTemp + pressureTrend + humidityEffect + diurnalCycle + (Math.random() - 0.5) * 2;
  const stdError = 1.5 + hoursAhead * 0.05;

  return {
    prediction: Math.round(prediction * 10) / 10,
    confidenceInterval: [
      Math.round((prediction - 1.96 * stdError) * 10) / 10,
      Math.round((prediction + 1.96 * stdError) * 10) / 10,
    ] as [number, number],
    confidence: Math.max(0.6, 0.95 - hoursAhead * 0.005),
    features,
  };
}

function getSeason(lat: number): string {
  const month = new Date().getMonth();
  const isNorthern = lat > 0;
  if (month >= 2 && month <= 4) return isNorthern ? "spring" : "autumn";
  if (month >= 5 && month <= 7) return isNorthern ? "summer" : "winter";
  if (month >= 8 && month <= 10) return isNorthern ? "autumn" : "spring";
  return isNorthern ? "winter" : "summer";
}

function calculateTrend(values: number[]): string {
  if (values.length < 2) return "stable";
  const first = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const diff = last - first;
  if (Math.abs(diff) < 1) return "stable";
  return diff > 0 ? "warming" : "cooling";
}

// Storm track prediction using simplified physics model
export async function predictStormTrack(
  stormLat: number,
  stormLon: number,
  currentPressure: number,
  windSpeed: number
): Promise<{
  track: Array<{ lat: number; lon: number; time: string; confidence: number }>;
  category: "TD" | "TS" | "C1" | "C2" | "C3" | "C4" | "C5";
}> {
  // Saffir-Simpson scale approximation
  let category: "TD" | "TS" | "C1" | "C2" | "C3" | "C4" | "C5" = "TD";
  if (windSpeed >= 137) category = "C5";
  else if (windSpeed >= 113) category = "C4";
  else if (windSpeed >= 96) category = "C3";
  else if (windSpeed >= 83) category = "C2";
  else if (windSpeed >= 64) category = "C1";
  else if (windSpeed >= 34) category = "TS";

  // Predict 48-hour track (6-hour intervals)
  const track: Array<{ lat: number; lon: number; time: string; confidence: number }> = [];
  let lat = stormLat;
  let lon = stormLon;
  
  for (let i = 0; i <= 8; i++) {
    const hours = i * 6;
    // Simplified Coriolis and beta drift
    const betaDrift = 0.3 * (i / 8); // Poleward drift
    const steeringFlow = currentPressure < 980 ? -0.5 : currentPressure < 1000 ? -0.2 : 0.1;
    
    lat += betaDrift + (Math.random() - 0.5) * 0.3;
    lon += steeringFlow + (Math.random() - 0.5) * 0.5;
    
    const time = new Date(Date.now() + hours * 3600000).toISOString();
    const confidence = Math.max(0.3, 0.95 - i * 0.08);
    
    track.push({
      lat: Math.round(lat * 10) / 10,
      lon: Math.round(((lon + 180) % 360 - 180) * 10) / 10,
      time,
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  return { track, category };
}

// Generate plain-language weather summary
export async function getWeatherSummary(region: string, timeframe: "current" | "24h" | "7d"): Promise<{
  summary: string;
  alerts: string[];
  keyMetrics: Record<string, number>;
}> {
  // Get representative weather for the region
  const regionCoords: Record<string, { lat: number; lon: number }> = {
    "north-america": { lat: 40, lon: -100 },
    "europe": { lat: 50, lon: 10 },
    "asia": { lat: 35, lon: 100 },
    "south-america": { lat: -15, lon: -60 },
    "africa": { lat: 0, lon: 20 },
    "oceania": { lat: -25, lon: 135 },
  };

  const coords = regionCoords[region] || { lat: 0, lon: 0 };
  const weather = await fetchCurrentWeather(coords.lat, coords.lon);

  const alerts: string[] = [];
  if (weather.windSpeed > 50) alerts.push(`High wind warning: ${weather.windSpeed} km/h`);
  if (weather.temperature > 35) alerts.push(`Extreme heat: ${weather.temperature}°C`);
  if (weather.temperature < -10) alerts.push(`Extreme cold: ${weather.temperature}°C`);
  if (weather.precipitation > 20) alerts.push(`Heavy precipitation: ${weather.precipitation}mm`);
  if (weather.pressure < 990) alerts.push(`Low pressure system detected`);

  const summaries = [
    `${region} is experiencing ${weather.temperature > 25 ? "above-average" : weather.temperature < 10 ? "below-average" : "moderate"} temperatures of ${weather.temperature}°C with ${weather.humidity}% humidity.`,
    `Surface pressure at ${weather.pressure}hPa indicates ${weather.pressure < 1000 ? "unstable" : "stable"} atmospheric conditions.`,
    timeframe === "24h"
      ? `24-hour forecast suggests ${weather.precipitation > 0 ? "continued precipitation" : "clearing conditions"}.`
      : `Current conditions are ${weather.windSpeed > 20 ? "windy" : "calm"} with winds at ${weather.windSpeed} km/h from ${weather.windDirection}°.`,
  ];

  return {
    summary: summaries.join(" "),
    alerts,
    keyMetrics: {
      temperature: weather.temperature,
      humidity: weather.humidity,
      pressure: weather.pressure,
      windSpeed: weather.windSpeed,
      uvIndex: weather.uvIndex,
    },
  };
}

export const aiRouter = createRouter({
  predictTemperature: publicQuery
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        hoursAhead: z.number().max(72),
      })
    )
    .query(async ({ input }) => {
      return predictTemperature(input.lat, input.lon, input.hoursAhead);
    }),

  predictStormTrack: publicQuery
    .input(
      z.object({
        stormLat: z.number(),
        stormLon: z.number(),
        currentPressure: z.number(),
        windSpeed: z.number(),
      })
    )
    .query(async ({ input }) => {
      return predictStormTrack(input.stormLat, input.stormLon, input.currentPressure, input.windSpeed);
    }),

  getSummary: publicQuery
    .input(
      z.object({
        region: z.string(),
        timeframe: z.enum(["current", "24h", "7d"]),
      })
    )
    .query(async ({ input }) => {
      return getWeatherSummary(input.region, input.timeframe);
    }),
});
