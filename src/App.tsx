import { useState, useCallback } from "react";
import { useGlobeStore } from "@/store/globeStore";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import DataPanel from "@/components/DataPanel";
import ControlSidebar from "@/components/ControlSidebar";
import Ticker from "@/components/Ticker";
import GlobeScene from "@/components/Globe/GlobeScene";

function App() {
  const [hoveredPoint, setHoveredPoint] = useState<{
    lat: number;
    lon: number;
    value: number;
  } | null>(null);
  const lastUpdated = useGlobeStore((s) => s.lastUpdated);

  const handleDataPointHover = useCallback(
    (point: { lat: number; lon: number; value: number } | null) => {
      setHoveredPoint(point);
    },
    []
  );

  return (
    <>
      {/* Preloader */}
      <Preloader />

      {/* Letterbox - Top */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-black z-50" />

      {/* Letterbox - Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-black z-50" />

      {/* Main Content */}
      <div
        className="relative min-h-screen flex flex-col"
        style={{ backgroundColor: "#E5E1DA" }}
      >
        {/* Background texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M0 0h60v2H0V0zm0 4h60v2H0V4zm0 4h60v2H0V8zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2zm0 4h60v2H0v-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />

        {/* Header - inside top letterbox area */}
        <div className="relative z-40 mt-20">
          <Header />
        </div>

        {/* Main stage */}
        <main className="relative flex-1 flex z-10 px-4 md:px-6 pb-4">
          {/* Left Data Panel */}
          <div className="hidden lg:flex flex-col justify-center z-20">
            {/* Hero text */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-[-0.02em] text-[#1A1A1A] leading-tight">
                A TROPOSPHERIC
                <br />
                <span className="text-[#1A1A1A]/40">VIEW FROM</span> ABOVE
              </h2>
              <p className="mt-2 text-xs text-[#1A1A1A]/50 font-mono tracking-wider">
                REAL-TIME ATMOSPHERIC INTELLIGENCE
              </p>
            </div>
            <DataPanel />
          </div>

          {/* Center - 3D Globe */}
          <div className="flex-1 relative" style={{ minHeight: "50vh" }}>
            <GlobeScene onDataPointHover={handleDataPointHover} />

            {/* Hover tooltip */}
            {hoveredPoint && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border border-[#FF4500]/30 bg-white/80 backdrop-blur-sm shadow-lg z-30">
                <div className="text-[10px] font-mono text-[#1A1A1A]/60">
                  {hoveredPoint.lat.toFixed(2)}°, {hoveredPoint.lon.toFixed(2)}°
                </div>
                <div className="text-sm font-bold font-mono text-[#FF4500]">
                  {hoveredPoint.value > 0 ? "+" : ""}
                  {hoveredPoint.value.toFixed(1)}
                </div>
              </div>
            )}

            {/* Equatorial ring decoration */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{
                width: "min(70vw, 70vh)",
                height: "min(70vw, 70vh)",
                border: "1px solid rgba(200, 196, 189, 0.3)",
                borderRadius: "50%",
                transform: "translate(-50%, -50%) rotateX(75deg)",
              }}
            />
          </div>

          {/* Right Control Sidebar */}
          <div className="hidden lg:flex flex-col justify-center z-20">
            <ControlSidebar />
          </div>
        </main>

        {/* Bottom area - Ticker + Footer */}
        <div className="relative z-30 mb-20">
          <Ticker />

          {/* Footer info */}
          <div className="flex items-center justify-between px-8 py-3 border-t border-[#C8C4BD]/20">
            <div className="text-[9px] font-mono text-[#1A1A1A]/40 tracking-wider">
              GEOINT-9 // SPATIAL ANALYTICS DIVISION
            </div>
            <div className="text-[9px] font-mono text-[#1A1A1A]/40 tracking-wider">
              {lastUpdated
                ? `DATA LAST SYNCED: ${new Date(lastUpdated).toUTCString()}`
                : "SYNCING..."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
