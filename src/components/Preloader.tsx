import { useEffect, useState } from "react";

export default function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const text = "SYNCING SATELLITE DATA ";
  const charCount = text.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-out"
      style={{
        backgroundColor: "#E5E1DA",
        animation: "fadeOut 0.6s ease-in-out 2.4s forwards",
      }}
    >
      <style>{`
        @keyframes fadeOut {
          to { opacity: 0; visibility: hidden; }
        }
      `}</style>
      <div className="relative" style={{ width: 200, height: 200 }}>
        <div
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: "4s", animationTimingFunction: "linear" }}
        >
          {text.split("").map((char, i) => {
            const rotation = (i / charCount) * 360;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-0 text-xs font-bold tracking-widest"
                style={{
                  color: "#1A1A1A",
                  transformOrigin: "0 100px",
                  transform: `rotate(${rotation}deg)`,
                  height: 100,
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{
            width: 60,
            height: 60,
            backgroundColor: "#1A1A1A",
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
        />
      </div>
    </div>
  );
}
