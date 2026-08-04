"use client";

import { useState } from "react";
import {
  Search,
  MapPin,
  ShoppingCart,
  Utensils,
  Pill,
  Smartphone,
  Shirt,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";

const categories = [
  {
    icon: ShoppingCart,
    label: "Supermercados",
    color: "from-emerald-500 to-teal-500",
    hoverGlow: "hover:shadow-emerald-500/25",
    bgAccent: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Utensils,
    label: "Restaurantes",
    color: "from-orange-500 to-amber-500",
    hoverGlow: "hover:shadow-orange-500/25",
    bgAccent: "bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: Pill,
    label: "Farmácias",
    color: "from-rose-500 to-pink-500",
    hoverGlow: "hover:shadow-rose-500/25",
    bgAccent: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: Smartphone,
    label: "Eletrônicos",
    color: "from-blue-500 to-cyan-500",
    hoverGlow: "hover:shadow-blue-500/25",
    bgAccent: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Shirt,
    label: "Moda",
    color: "from-violet-500 to-purple-500",
    hoverGlow: "hover:shadow-violet-500/25",
    bgAccent: "bg-violet-500/10 border-violet-500/20",
  },
];

const stats = [
  { icon: TrendingDown, value: "até 70%", label: "de desconto" },
  { icon: MapPin, value: "10k+", label: "lojas parceiras" },
  { icon: Zap, value: "em tempo real", label: "promoções" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-0 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-10 animate-fade-in"
          style={{ animationDelay: "0ms" }}
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-200/80">
            Powered by Inteligência Artificial
          </span>
        </div>

        {/* Title */}
        <div
          className="text-center mb-4 animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none">
            <span className="text-gradient">Econecta</span>
            <span className="text-white"> AI</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="text-lg sm:text-xl text-slate-400 text-center max-w-md mb-12 leading-relaxed font-light animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          Sua IA para encontrar{" "}
          <span className="text-white font-medium">promoções e descontos</span>{" "}
          perto de você.
        </p>

        {/* Search box */}
        <div
          className="w-full max-w-2xl mb-10 animate-slide-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="relative group">
            {/* Glow ring on focus */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 rounded-2xl opacity-0 group-focus-within:opacity-60 blur transition-opacity duration-500" />

            <div className="relative flex items-center bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              {/* Location indicator */}
              <div className="flex items-center gap-1.5 pl-4 pr-3 border-r border-white/10 shrink-0">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-400 hidden sm:block whitespace-nowrap">
                  Localização
                </span>
              </div>

              {/* Input */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar promoções, produtos, lojas..."
                className="flex-1 bg-transparent px-4 py-4 text-white placeholder-slate-500 outline-none text-sm sm:text-base"
              />

              {/* Search button */}
              <button className="m-2 shrink-0 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-lg shadow-blue-500/25">
                <Search className="w-4 h-4" />
                <span className="hidden sm:block">Buscar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category buttons */}
        <div
          className="flex flex-wrap justify-center gap-3 mb-16 animate-slide-up"
          style={{ animationDelay: "400ms" }}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() =>
                  setActiveCategory(isActive ? null : cat.label)
                }
                className={`
                  group flex items-center gap-2.5 px-5 py-3 rounded-xl border font-medium text-sm
                  transition-all duration-200 hover:scale-[1.04] active:scale-95
                  hover:shadow-lg ${cat.hoverGlow}
                  ${
                    isActive
                      ? `bg-gradient-to-r ${cat.color} border-transparent text-white shadow-lg ${cat.hoverGlow}`
                      : `${cat.bgAccent} text-slate-300 hover:text-white hover:border-white/20`
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  }`}
                />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        <div
          className="flex flex-wrap justify-center gap-6 sm:gap-10 animate-fade-in"
          style={{ animationDelay: "550ms" }}
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl glass flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-slate-500 text-xs">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
