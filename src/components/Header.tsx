import { Radar, Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 h-16">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center" style={{
          backgroundColor: "#1A1A1A",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}>
          <Radar className="w-4 h-4 text-[#E5E1DA]" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-[0.15em] text-[#1A1A1A] uppercase">
            Climatic Terminal
          </h1>
          <p className="text-[9px] tracking-[0.2em] text-[#1A1A1A]/50 uppercase font-mono">
            GEOINT-9 // v3.2.1
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        {["SENSORS", "MODELS", "ARCHIVE"].map((item) => (
          <button
            key={item}
            className="group relative text-xs font-bold tracking-wider text-[#1A1A1A]/70 hover:text-[#FF4500] transition-colors"
          >
            {item}
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#FF4500] transition-all duration-300 group-hover:w-full" />
          </button>
        ))}
      </nav>

      {/* Mobile menu */}
      <button className="md:hidden text-[#1A1A1A]">
        <Menu className="w-5 h-5" />
      </button>
    </header>
  );
}
