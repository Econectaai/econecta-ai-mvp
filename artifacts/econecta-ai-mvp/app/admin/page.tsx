"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Building2,
  Search,
  SlidersHorizontal,
  Users,
  RefreshCw,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  ShoppingCart,
  Utensils,
  Pill,
  Smartphone,
  Shirt,
  Sparkles,
} from "lucide-react";
import { supabase, type Business } from "../../lib/supabase";

const CATEGORIES = [
  "Supermercados",
  "Restaurantes",
  "Farmácias",
  "Eletrônicos",
  "Moda",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Supermercados: ShoppingCart,
  Restaurantes: Utensils,
  Farmácias: Pill,
  Eletrônicos: Smartphone,
  Moda: Shirt,
};

type SortField = keyof Business;
type SortDir = "asc" | "desc";

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  async function fetchBusinesses() {
    setLoading(true);
    setError(null);
    const { data, error: sbError } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });

    if (sbError) {
      setError(sbError.message);
    } else {
      setBusinesses(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const filtered = useMemo(() => {
    let rows = [...businesses];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((b) =>
        b.business_name?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      rows = rows.filter((b) => b.category === categoryFilter);
    }
    rows.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortField] ?? "";
      const bv = (b as Record<string, unknown>)[sortField] ?? "";
      const cmp = String(av).localeCompare(String(bv), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [businesses, search, categoryFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ChevronUp className="w-3 h-3 text-slate-600" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-blue-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-400" />
    );
  }

  const columns: { key: SortField; label: string; className?: string }[] = [
    { key: "business_name", label: "Empresa" },
    { key: "owner_name", label: "Responsável" },
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Telefone" },
    { key: "city", label: "Cidade" },
    { key: "state", label: "Estado", className: "text-center" },
    { key: "category", label: "Categoria" },
    { key: "created_at", label: "Cadastro", className: "text-right" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0f1e] relative overflow-x-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-300/70 uppercase tracking-widest">
                Painel Administrativo
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              <span
                style={{
                  background:
                    "linear-gradient(135deg,#60a5fa 0%,#a78bfa 50%,#f472b6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Econecta
              </span>{" "}
              <span className="text-white">AI</span>
            </h1>
          </div>

          <button
            onClick={fetchBusinesses}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* Stat card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loading ? "—" : businesses.length}
              </p>
              <p className="text-xs text-slate-500">Total de cadastros</p>
            </div>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{filtered.length}</p>
              <p className="text-xs text-slate-500">Resultados filtrados</p>
            </div>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loading ? "—" : CATEGORIES.length}
              </p>
              <p className="text-xs text-slate-500">Categorias ativas</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome da empresa…"
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors appearance-none min-w-[180px]"
          >
            <option value="" className="bg-[#0a0f1e]">
              Todas as categorias
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0a0f1e]">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-rose-300 font-medium text-sm">
                Erro ao buscar dados
              </p>
              <p className="text-rose-400/70 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap ${col.className ?? ""}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                        <p className="text-slate-500 text-sm">
                          Carregando cadastros…
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="w-8 h-8 text-slate-700" />
                        <p className="text-slate-500 text-sm">
                          Nenhum cadastro encontrado
                        </p>
                        {(search || categoryFilter) && (
                          <button
                            onClick={() => {
                              setSearch("");
                              setCategoryFilter("");
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline underline-offset-2"
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((biz, i) => {
                    const CatIcon = CATEGORY_ICONS[biz.category ?? ""];
                    return (
                      <tr
                        key={biz.id ?? i}
                        className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                          {biz.business_name}
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {biz.owner_name}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {biz.email}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {biz.phone}
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {biz.city}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs font-mono">
                            {biz.state}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-slate-300">
                            {CatIcon && (
                              <CatIcon className="w-3 h-3 text-blue-400" />
                            )}
                            {biz.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap text-xs">
                          {fmt(biz.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-white/[0.05] flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Exibindo {filtered.length} de {businesses.length} cadastros
              </p>
              {(search || categoryFilter) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("");
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
