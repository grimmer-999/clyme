import { create } from "zustand";

export type WeatherLayer = "temperature" | "pressure" | "humidity" | "wind" | "precipitation" | "none";
export type AnomalySeverity = "low" | "moderate" | "high" | "extreme";

export interface AnomalyPoint {
  lat: number;
  lon: number;
  deviation: number;
  severity: AnomalySeverity;
  baselineValue: number;
  currentValue: number;
}

export interface WeatherGridPoint {
  lat: number;
  lon: number;
  value: number;
}

interface GlobeState {
  // Active weather layer
  activeLayer: WeatherLayer;
  setActiveLayer: (layer: WeatherLayer) => void;

  // Anomalies
  anomalies: AnomalyPoint[];
  setAnomalies: (anomalies: AnomalyPoint[]) => void;
  showAnomalies: boolean;
  setShowAnomalies: (show: boolean) => void;

  // Global weather grid
  weatherGrid: WeatherGridPoint[];
  setWeatherGrid: (grid: WeatherGridPoint[]) => void;

  // Selected location
  selectedLocation: { lat: number; lon: number } | null;
  setSelectedLocation: (loc: { lat: number; lon: number } | null) => void;

  // Globe auto-rotation
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Data timestamp
  lastUpdated: string | null;
  setLastUpdated: (ts: string | null) => void;
}

export const useGlobeStore = create<GlobeState>((set) => ({
  activeLayer: "temperature",
  setActiveLayer: (layer) => set({ activeLayer: layer }),

  anomalies: [],
  setAnomalies: (anomalies) => set({ anomalies }),
  showAnomalies: true,
  setShowAnomalies: (show) => set({ showAnomalies: show }),

  weatherGrid: [],
  setWeatherGrid: (grid) => set({ weatherGrid: grid }),

  selectedLocation: null,
  setSelectedLocation: (loc) => set({ selectedLocation: loc }),

  autoRotate: true,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),

  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),

  lastUpdated: null,
  setLastUpdated: (ts) => set({ lastUpdated: ts }),
}));
