import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  float,
  timestamp,
  bigint,
  text,
} from "drizzle-orm/mysql-core";

export const weatherStations = mysqlTable("weather_stations", {
  id: serial("id").primaryKey(),
  stationId: varchar("station_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }),
  lat: float("lat").notNull(),
  lon: float("lon").notNull(),
  elevation: float("elevation"),
  country: varchar("country", { length: 50 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const weatherReadings = mysqlTable("weather_readings", {
  id: serial("id").primaryKey(),
  stationId: bigint("station_id", { mode: "number", unsigned: true }).references(() => weatherStations.id),
  temperature: float("temperature"),
  humidity: float("humidity"),
  pressure: float("pressure"),
  windSpeed: float("wind_speed"),
  windDirection: float("wind_direction"),
  precipitation: float("precipitation"),
  uvIndex: float("uv_index"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const climateAnomalies = mysqlTable("climate_anomalies", {
  id: serial("id").primaryKey(),
  lat: float("lat").notNull(),
  lon: float("lon").notNull(),
  layer: varchar("layer", { length: 20 }).notNull(),
  baselineValue: float("baseline_value").notNull(),
  currentValue: float("current_value").notNull(),
  deviation: float("deviation").notNull(),
  severity: mysqlEnum("severity", ["low", "moderate", "high", "extreme"]),
  detectedAt: timestamp("detected_at").defaultNow(),
});

export const forecasts = mysqlTable("forecasts", {
  id: serial("id").primaryKey(),
  lat: float("lat").notNull(),
  lon: float("lon").notNull(),
  forecastTime: timestamp("forecast_time").notNull(),
  predictedTemp: float("predicted_temp"),
  predictedPrecip: float("predicted_precip"),
  confidence: float("confidence"),
  modelVersion: varchar("model_version", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stormTracks = mysqlTable("storm_tracks", {
  id: serial("id").primaryKey(),
  stormId: varchar("storm_id", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }),
  lat: float("lat").notNull(),
  lon: float("lon").notNull(),
  pressure: float("pressure"),
  windSpeed: float("wind_speed"),
  category: mysqlEnum("category", ["TD", "TS", "C1", "C2", "C3", "C4", "C5"]),
  track: text("track"),
  predictedAt: timestamp("predicted_at").defaultNow(),
});
