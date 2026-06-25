import { useEffect, useRef } from "react";
import gsap from "gsap";

const tickerItems = [
  "HURRICANE WARNING — NORTH ATLANTIC — CATEGORY 3",
  "HEAT DOME DETECTED — PACIFIC NORTHWEST — 42°C",
  "TORNADO WATCH — CENTRAL PLAINS — EF2+ EXPECTED",
  "FLOOD ALERT — SOUTHEAST ASIA — MONSOON SURGE",
  "COLD FRONT APPROACHING — NORTHERN EUROPE",
  "DUST STORM — SAHARA REGION — VISIBILITY <100M",
  "WILDFIRE CONDITIONS — CALIFORNIA — RED FLAG WARNING",
  "POLAR VORTEX DISRUPTION — ARCTIC REGION DETECTED",
  "SEVERE THUNDERSTORM — MIDWEST — HAIL EXPECTED",
  "COASTAL FLOODING — GULF OF MEXICO — HIGH TIDE",
];

export default function Ticker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const items = el.querySelectorAll(".ticker-item");
    const totalWidth = Array.from(items).reduce((acc, item) => acc + (item as HTMLElement).offsetWidth + 48, 0);

    gsap.to(el, {
      x: -totalWidth / 2,
      duration: 60,
      ease: "none",
      repeat: -1,
    });
  }, []);

  // Duplicate items for seamless loop
  const allItems = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full overflow-hidden border-t border-[#C8C4BD]/30">
      <div ref={containerRef} className="flex whitespace-nowrap py-2">
        {allItems.map((item, i) => (
          <span key={i} className="ticker-item flex items-center gap-4 px-6">
            <span className="text-[10px] font-mono tracking-wider text-[#1A1A1A]/70">
              {item}
            </span>
            <span className="text-[#FF4500]">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}
