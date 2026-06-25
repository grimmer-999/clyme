import { useState, useCallback } from "react";
import { useGlobeStore, type WeatherLayer } from "@/store/globeStore";
import { trpc } from "@/providers/trpc";
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Gauge,
  AlertTriangle,
  Orbit,
  Layers,
} from "lucide-react";

interface LayerButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function LayerButton({ label, icon, isActive, onClick }: LayerButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full py-3 px-4 text-left transition-colors duration-300 overflow-hidden"
      style={{
        border: `1px solid ${isActive ? "#FF4500" : "#C8C4BD"}`,
        color: isActive ? "#FF4500" : "#1A1A1A",
        background: isActive ? "rgba(255, 69, 0, 0.05)" : "transparent",
      }}
    >
      <div
        className="absolute inset-0 transition-all duration-500 ease-out"
        style={{
          background: "#FF4500",
          transform: isHovered ? "translateX(100%) skewX(-20deg)" : "translateX(-100%) skewX(-20deg)",
          transformOrigin: "bottom left",
          opacity: 0.1,
        }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <span className={isActive ? "text-[#FF4500]" : "text-[#1A1A1A]/70"}>
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse" />
        )}
      </div>
    </button>
  );
}

function ToggleButton({
  label,
  icon,
  isOn,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  isOn: boolean;
  onToggle: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full py-3 px-4 text-left overflow-hidden"
      style={{
        border: `1px solid ${isOn ? "#FF4500" : "#C8C4BD"}`,
        color: isOn ? "#FF4500" : "#1A1A1A",
      }}
    >
      {isHovered && (
        <>
          <div
            className="absolute inset-0 border pointer-events-none animate-ping"
            style={{ borderColor: "#1A1A1A", opacity: 0.3, animationDuration: "2s" }}
          />
          <div
            className="absolute inset-0 border pointer-events-none"
            style={{ borderColor: "#1A1A1A", opacity: 0.15, inset: "-4px" }}
          />
        </>
      )}
      <div className="relative z-10 flex items-center gap-3">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="ml-auto text-xs font-mono opacity-60">
          {isOn ? "ON" : "OFF"}
        </span>
      </div>
    </button>
  );
}

const layerOptions: { id: WeatherLayer; label: string; icon: React.ReactNode }[] = [
  { id: "temperature", label: "Temperature", icon: <Thermometer className="w-4 h-4" /> },
  { id: "humidity", label: "Humidity", icon: <Droplets className="w-4 h-4" /> },
  { id: "pressure", label: "Pressure", icon: <Gauge className="w-4 h-4" /> },
  { id: "wind", label: "Wind", icon: <Wind className="w-4 h-4" /> },
  { id: "precipitation", label: "Precipitation", icon: <CloudRain className="w-4 h-4" /> },
];

export default function ControlSidebar() {
  const activeLayer = useGlobeStore((s) => s.activeLayer);
  const setActiveLayer = useGlobeStore((s) => s.setActiveLayer);
  const showAnomalies = useGlobeStore((s) => s.showAnomalies);
  const setShowAnomalies = useGlobeStore((s) => s.setShowAnomalies);
  const autoRotate = useGlobeStore((s) => s.autoRotate);
  const setAutoRotate = useGlobeStore((s) => s.setAutoRotate);
  const setWeatherGrid = useGlobeStore((s) => s.setWeatherGrid);
  const setAnomalies = useGlobeStore((s) => s.setAnomalies);
  const setLastUpdated = useGlobeStore((s) => s.setLastUpdated);

  // Use queries instead of mutations
  const activeLayerForQuery = activeLayer !== "none" ? activeLayer : "temperature";
  const globalSnapshotQuery = trpc.weather.getGlobalSnapshot.useQuery(
    { layer: activeLayerForQuery as "temperature" | "pressure" | "humidity" | "wind" | "precipitation" },
    { enabled: activeLayer !== "none", refetchInterval: 300000 }
  );

  const anomaliesQuery = trpc.climate.getAnomalies.useQuery(
    { layer: "temperature", baseline: "1991-2020" },
    { enabled: showAnomalies, refetchInterval: 600000 }
  );

  // Sync query results to store
  useCallback(() => {
    if (globalSnapshotQuery.data) {
      setWeatherGrid(globalSnapshotQuery.data.grid);
      setLastUpdated(globalSnapshotQuery.data.timestamp);
    }
  }, [globalSnapshotQuery.data, setWeatherGrid, setLastUpdated]);

  useCallback(() => {
    if (anomaliesQuery.data) {
      setAnomalies(anomaliesQuery.data.anomalies);
      setLastUpdated(anomaliesQuery.data.timestamp);
    }
  }, [anomaliesQuery.data, setAnomalies, setLastUpdated]);

  // Sync data when queries complete
  if (globalSnapshotQuery.data && activeLayer !== "none") {
    // Use a ref to prevent infinite re-renders
  }

  const handleLayerChange = (layer: WeatherLayer) => {
    setActiveLayer(layer);
  };

  const handleAnomalyToggle = () => {
    setShowAnomalies(!showAnomalies);
  };

  return (
    <div className="flex flex-col gap-1 w-[200px]">
      <div className="flex items-center gap-2 px-2 mb-2">
        <Layers className="w-4 h-4 text-[#1A1A1A]/60" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 font-bold">
          Data Layers
        </span>
      </div>

      {layerOptions.map((layer) => (
        <LayerButton
          key={layer.id}
          label={layer.label}
          icon={layer.icon}
          isActive={activeLayer === layer.id}
          onClick={() => handleLayerChange(layer.id)}
        />
      ))}

      <div className="h-px bg-[#C8C4BD]/40 my-2" />

      <ToggleButton
        label="Anomalies"
        icon={<AlertTriangle className="w-4 h-4" />}
        isOn={showAnomalies}
        onToggle={handleAnomalyToggle}
      />
      <ToggleButton
        label="Auto-Rotate"
        icon={<Orbit className="w-4 h-4" />}
        isOn={autoRotate}
        onToggle={() => setAutoRotate(!autoRotate)}
      />

      <div className="mt-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/40 font-mono">
            Live Data Stream
          </span>
        </div>
      </div>
    </div>
  );
}
