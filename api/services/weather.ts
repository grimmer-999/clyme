/* eslint-disable @typescript-eslint/no-explicit-any */
interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  uvIndex: number;
  timestamp: string;
}

interface ForecastData {
  hourly: Array<{
    time: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
  }>;
}

interface GlobalSnapshot {
  grid: Array<{ lat: number; lon: number; value: number }>;
  timestamp: string;
}

// Cache for 10 minutes
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs = 600000): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const cacheKey = `current_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = getCache<WeatherData>(cacheKey);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation,uv_index&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm`;
  
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Weather API error");
  
  const json: any = await res.json();
  const current = json?.current || {};
  
  const data: WeatherData = {
    temperature: current.temperature_2m ?? 0,
    humidity: current.relative_humidity_2m ?? 0,
    pressure: current.surface_pressure ?? 1013,
    windSpeed: current.wind_speed_10m ?? 0,
    windDirection: current.wind_direction_10m ?? 0,
    precipitation: current.precipitation ?? 0,
    uvIndex: current.uv_index ?? 0,
    timestamp: String(current.time ?? new Date().toISOString()),
  };
  
  setCache(cacheKey, data, 300000); // 5 min cache
  return data;
}

export async function fetchForecast(lat: number, lon: number, hours = 24): Promise<ForecastData> {
  const cacheKey = `forecast_${lat.toFixed(2)}_${lon.toFixed(2)}_${hours}`;
  const cached = getCache<ForecastData>(cacheKey);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,wind_speed_10m&forecast_days=${Math.ceil(hours / 24)}&temperature_unit=celsius`;
  
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Forecast API error");
  
  const json: any = await res.json();
  const hourly = json?.hourly || {};
  const times: string[] = hourly.time ?? [];
  
  const data: ForecastData = {
    hourly: times.slice(0, hours).map((t: string, i: number) => ({
      time: t,
      temperature: hourly.temperature_2m?.[i] ?? 0,
      precipitation: hourly.precipitation?.[i] ?? 0,
      windSpeed: hourly.wind_speed_10m?.[i] ?? 0,
    })),
  };
  
  setCache(cacheKey, data, 600000); // 10 min cache
  return data;
}

export async function fetchGlobalSnapshot(layer: "temperature" | "pressure" | "humidity" | "wind" | "precipitation"): Promise<GlobalSnapshot> {
  const cacheKey = `global_${layer}`;
  const cached = getCache<GlobalSnapshot>(cacheKey);
  if (cached) return cached;

  const grid: Array<{ lat: number; lon: number; value: number }> = [];
  const lats = [75, 60, 45, 30, 15, 0, -15, -30, -45, -60, -75];
  const lons = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

  const paramMap: Record<string, string> = {
    temperature: "temperature_2m",
    pressure: "surface_pressure",
    humidity: "relative_humidity_2m",
    wind: "wind_speed_10m",
    precipitation: "precipitation",
  };

  const samplePoints = lats.flatMap((lat) =>
    lons.map((lon) => ({ lat, lon }))
  );

  const batchSize = 5;
  for (let i = 0; i < samplePoints.length; i += batchSize) {
    const batch = samplePoints.slice(i, i + batchSize);
    const promises = batch.map(async (pt) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${pt.lat}&longitude=${pt.lon}&current=${paramMap[layer]}&temperature_unit=celsius`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return { ...pt, value: 0 };
        const json: any = await res.json();
        const current = json?.current || {};
        const value = current[paramMap[layer]] ?? 0;
        return { ...pt, value };
      } catch {
        return { ...pt, value: 0 };
      }
    });

    const results = await Promise.all(promises);
    results.forEach((r) => {
      grid.push({ lat: r.lat, lon: r.lon, value: r.value });
    });

    if (i + batchSize < samplePoints.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const data: GlobalSnapshot = {
    grid,
    timestamp: new Date().toISOString(),
  };

  setCache(cacheKey, data, 600000);
  return data;
}
