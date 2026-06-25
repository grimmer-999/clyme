import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useGlobeStore } from "@/store/globeStore";
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Gauge,
  Sun,
  MapPin,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface WeatherMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  trend?: "up" | "down" | "neutral";
}

function WeatherMetric({ icon, label, value, unit, trend }: WeatherMetricProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[#C8C4BD]/40 bg-white/5 backdrop-blur-sm">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-[#1A1A1A]/10 text-[#1A1A1A]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 font-medium">
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-[#1A1A1A] font-mono leading-tight">
            {value}
          </span>
          <span className="text-[10px] text-[#1A1A1A]/50">{unit}</span>
          {trend && (
            <span className="ml-auto">
              {trend === "up" ? (
                <TrendingUp className="w-3 h-3 text-[#FF4500]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[#2D6A4F]" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DataPanel() {
  const selectedLocation = useGlobeStore((s) => s.selectedLocation);
  const [coords, setCoords] = useState({ lat: 51.5074, lon: -0.1278 }); // Default London

  useEffect(() => {
    if (selectedLocation) {
      setCoords(selectedLocation);
    }
  }, [selectedLocation]);

  const { data: weather, isLoading } = trpc.weather.getCurrent.useQuery(
    { lat: coords.lat, lon: coords.lon },
    { refetchInterval: 300000, enabled: true }
  );

  const { data: forecast } = trpc.weather.getForecast.useQuery(
    { lat: coords.lat, lon: coords.lon, hours: 24 },
    { refetchInterval: 600000, enabled: true }
  );

  const tempTrend = forecast?.hourly
    ? forecast.hourly[0]?.temperature > forecast.hourly[3]?.temperature
      ? "down"
      : "up"
    : "neutral";

  return (
    <div className="flex flex-col gap-2 w-[280px]">
      {/* Location Header */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#C8C4BD]/40 bg-white/5 backdrop-blur-sm">
        <MapPin className="w-4 h-4 text-[#FF4500]" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 font-medium">
            Coordinates
          </div>
          <div className="text-xs font-mono text-[#1A1A1A]">
            {coords.lat.toFixed(2)}°, {coords.lon.toFixed(2)}°
          </div>
        </div>
      </div>

      {/* Weather Metrics */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Activity className="w-5 h-5 animate-spin text-[#FF4500]" />
          <span className="ml-2 text-xs text-[#1A1A1A]/60 font-mono">
            SYNCING...
          </span>
        </div>
      ) : weather ? (
        <>
          <WeatherMetric
            icon={<Thermometer className="w-4 h-4" />}
            label="Temperature"
            value={weather.temperature.toFixed(1)}
            unit="°C"
            trend={tempTrend}
          />
          <WeatherMetric
            icon={<Droplets className="w-4 h-4" />}
            label="Humidity"
            value={weather.humidity.toFixed(0)}
            unit="%"
          />
          <WeatherMetric
            icon={<Gauge className="w-4 h-4" />}
            label="Pressure"
            value={weather.pressure.toFixed(0)}
            unit="hPa"
          />
          <WeatherMetric
            icon={<Wind className="w-4 h-4" />}
            label="Wind Speed"
            value={weather.windSpeed.toFixed(1)}
            unit="km/h"
          />
          <WeatherMetric
            icon={<CloudRain className="w-4 h-4" />}
            label="Precipitation"
            value={weather.precipitation.toFixed(1)}
            unit="mm"
          />
          <WeatherMetric
            icon={<Sun className="w-4 h-4" />}
            label="UV Index"
            value={weather.uvIndex.toFixed(1)}
            unit=""
          />
        </>
      ) : (
        <div className="text-xs text-[#1A1A1A]/60 font-mono px-3">
          No data available
        </div>
      )}
    </div>
  );
}
