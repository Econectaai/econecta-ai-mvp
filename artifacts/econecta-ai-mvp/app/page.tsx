"use client";

import { useState, useRef } from "react";
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
  X,
  CheckCircle2,
  Loader2,
  Building2,
  Tag,
  Globe,
  Clock,
  MessageCircle,
  Instagram,
  ExternalLink,
  AlertCircle,
  Bot,
} from "lucide-react";
import { supabase, type Business } from "../lib/supabase";
import { isPromoActive, type SearchResult } from "../lib/search";

/* ────────────────────────────────────────────────────────── */
/*  Static data                                               */
/* ────────────────────────────────────────────────────────── */

const CATEGORIES = [
  {
    icon: ShoppingCart,
    label: "Supermercados",
    color: "from-emerald-500 to-teal-500",
    hoverGlow: "hover:shadow-emerald-500/25",
    bgAccent: "bg-emerald-500/10 border-emerald-500/20",
    activeText: "text-white",
  },
  {
    icon: Utensils,
    label: "Restaurantes",
    color: "from-orange-500 to-amber-500",
    hoverGlow: "hover:shadow-orange-500/25",
    bgAccent: "bg-orange-500/10 border-orange-500/20",
    activeText: "text-white",
  },
  {
    icon: Pill,
    label: "Farmácias",
    color: "from-rose-500 to-pink-500",
    hoverGlow: "hover:shadow-rose-500/25",
    bgAccent: "bg-rose-500/10 border-rose-500/20",
    activeText: "text-white",
  },
  {
    icon: Smartphone,
    label: "Eletrônicos",
    color: "from-blue-500 to-cyan-500",
    hoverGlow: "hover:shadow-blue-500/25",
    bgAccent: "bg-blue-500/10 border-blue-500/20",
    activeText: "text-white",
  },
  {
    icon: Shirt,
    label: "Moda",
    color: "from-violet-500 to-purple-500",
    hoverGlow: "hover:shadow-violet-500/25",
    bgAccent: "bg-violet-500/10 border-violet-500/20",
    activeText: "text-white",
  },
];

const STATS = [
  { icon: TrendingDown, value: "até 70%", label: "de desconto" },
  { icon: MapPin, value: "10k+", label: "lojas parceiras" },
  { icon: Zap, value: "em tempo real", label: "promoções" },
];

const BRAZIL_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

/* ────────────────────────────────────────────────────────── */
/*  Registration form shape                                   */
/* ────────────────────────────────────────────────────────── */

type FormData = Omit<Business, "id" | "created_at">;

const EMPTY_FORM: FormData = {
  business_name: "", owner_name: "", email: "", phone: "",
  city: "", state: "", category: "",
  address: "", neighborhood: "", postal_code: "",
  whatsapp: "", instagram: "", website: "",
  description: "", opening_hours: "",
  promotion_title: "", promotion_description: "",
  discount_percentage: null, promotion_expiration: "",
};

/* ────────────────────────────────────────────────────────── */
/*  Valen v2 API response type                                */
/* ────────────────────────────────────────────────────────── */

type ValenApiResponse = {
  message: string;
  results: SearchResult[];
  source: "openai" | "fallback";
  error?: string;
};

/* ────────────────────────────────────────────────────────── */
/*  Page component                                            */
/* ────────────────────────────────────────────────────────── */

export default function Home() {
  /* Search state */
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [committedQuery, setCommittedQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<"openai" | "fallback" | null>(null);

  /* Registration modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  /* ── Search ── */
  async function runSearch(term: string) {
    const t = term.trim();
    setCommittedQuery(t);
    setSearchError(null);
    setAiMessage(null);
    setAiSource(null);

    if (!t) {
      setResults(null);
      return;
    }

    setSearching(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const res = await fetch("/valen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: t }),
        signal: controller.signal,
      });

      const json: ValenApiResponse = await res.json();

      if (!res.ok || json.error) {
        setSearchError(json.error ?? "Erro ao buscar resultados.");
        setResults([]);
      } else {
        setResults(json.results);
        setAiMessage(json.message);
        setAiSource(json.source);
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "A busca demorou demais. Tente novamente."
          : "Erro de conexão. Verifique sua internet e tente novamente.";
      setSearchError(msg);
      setResults([]);
    } finally {
      window.clearTimeout(timeoutId);
      setSearching(false);
    }

    // Scroll to results on mobile
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleSearchSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    runSearch(query);
  }

  function handleCategoryClick(label: string) {
    setActiveCategory((prev) => {
      const next = prev === label ? null : label;
      if (next) {
        setQuery(next);
        runSearch(next);
      } else {
        clearSearch();
      }
      return next;
    });
  }

  function clearSearch() {
    setQuery("");
    setActiveCategory(null);
    setResults(null);
    setCommittedQuery("");
    setSearchError(null);
    setAiMessage(null);
    setAiSource(null);
  }

  /* ── Registration modal ── */
  function openModal() {
    setForm({ ...EMPTY_FORM, category: activeCategory ?? "" });
    setSuccess(false);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setSuccess(false);
    setFormError(null);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "discount_percentage"
        ? value === "" ? null : Number(value)
        : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (
      form.discount_percentage !== null &&
      form.discount_percentage !== undefined &&
      (form.discount_percentage < 0 || form.discount_percentage > 100)
    ) {
      setFormError("O desconto deve ser um valor entre 0 e 100.");
      return;
    }
    if (form.promotion_expiration) {
      const d = new Date(form.promotion_expiration);
      if (isNaN(d.getTime())) {
        setFormError("Data de validade da promoção inválida.");
        return;
      }
    }

    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      payload[k] = v === "" ? null : v;
    }

    const { error: sbError } = await supabase.from("businesses").insert([payload]);
    setSaving(false);

    if (sbError) {
      setFormError(
        sbError.message.includes("violates")
          ? "Erro de validação: verifique os campos obrigatórios."
          : sbError.message
      );
    } else {
      setSuccess(true);
    }
  }

  const hasResults = results !== null;

  /* ────────────────────────────────────────────────────────── */
  /*  Render                                                    */
  /* ────────────────────────────────────────────────────────── */

  return (
    <main className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-0 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-4 pt-16 pb-24">

        {/* ── Hero ── */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-10 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-200/80">
            Powered by Inteligência Artificial
          </span>
        </div>

        <div className="text-center mb-4 animate-slide-up">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none">
            <span className="text-gradient">Econecta</span>
            <span className="text-white"> AI</span>
          </h1>
        </div>

        <p className="text-lg sm:text-xl text-slate-400 text-center max-w-md mb-12 leading-relaxed font-light animate-slide-up">
          Sua IA para encontrar{" "}
          <span className="text-white font-medium">promoções e descontos</span>{" "}
          perto de você.
        </p>

        {/* ── Search box ── */}
        <div className="w-full max-w-2xl mb-10 animate-slide-up">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 rounded-2xl opacity-0 group-focus-within:opacity-60 blur transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-1.5 pl-4 pr-3 border-r border-white/10 shrink-0">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-400 hidden sm:block whitespace-nowrap">
                    Localização
                  </span>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Ex: "pizza em Santo André", "farmácia com desconto"'
                  className="flex-1 bg-transparent px-4 py-4 text-white placeholder-slate-500 outline-none text-sm sm:text-base"
                />
                {/* Clear input */}
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-2 mr-1 text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={searching}
                  className="m-2 shrink-0 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 disabled:opacity-60 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-lg shadow-blue-500/25"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="hidden sm:block">{searching ? "Buscando…" : "Buscar"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── Category buttons ── */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 animate-slide-up">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(cat.label)}
                className={`
                  group flex items-center gap-2.5 px-5 py-3 rounded-xl border font-medium text-sm
                  transition-all duration-200 hover:scale-[1.04] active:scale-95
                  hover:shadow-lg ${cat.hoverGlow}
                  ${
                    isActive
                      ? `bg-gradient-to-r ${cat.color} border-transparent text-white shadow-lg`
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

        {/* ── Search results section ── */}
        {hasResults && (
          <div ref={resultsRef} className="w-full max-w-4xl mb-10">

            {/* Valen response bar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[10px] font-semibold text-blue-400/70 uppercase tracking-widest">
                      Valen
                    </p>
                    {aiSource === "openai" && !searching && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/25 text-violet-400 text-[9px] font-semibold uppercase tracking-wide">
                        <Sparkles className="w-2.5 h-2.5" />
                        IA
                      </span>
                    )}
                  </div>
                  <p className="text-white font-medium text-sm leading-snug">
                    {searching
                      ? "Consultando opções para você…"
                      : (aiMessage ?? "Resultado da busca.")}
                  </p>
                </div>
              </div>
              <button
                onClick={clearSearch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </button>
            </div>

            {/* Search error */}
            {searchError && (
              <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 mb-6">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <p className="text-rose-300 text-sm">{searchError}</p>
              </div>
            )}

            {/* Loading shimmer */}
            {searching && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 animate-pulse h-48"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!searching && results.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <Search className="w-7 h-7 text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold mb-1">
                    Nenhum resultado encontrado
                  </p>
                  <p className="text-slate-500 text-sm max-w-xs">
                    Tente outros termos ou explore as categorias acima.
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all duration-200 hover:scale-[1.03]"
                >
                  Limpar busca
                </button>
              </div>
            )}

            {/* Result cards */}
            {!searching && results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((biz) => (
                  <ResultCard key={biz.id} biz={biz} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Stats row (hidden when results shown) ── */}
        {!hasResults && (
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 animate-fade-in mb-10">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl glass flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{stat.value}</p>
                    <p className="text-slate-500 text-xs">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CTA — register business ── */}
        <div className="animate-fade-in">
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-95"
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            Cadastre seu negócio gratuitamente
          </button>
        </div>
      </div>

      {/* ── Registration modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="w-full max-w-2xl glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-base leading-tight">Cadastre seu negócio</h2>
                  <p className="text-slate-500 text-xs">Apareça nas buscas do Econecta AI</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success */}
            {success ? (
              <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Cadastro realizado!</h3>
                  <p className="text-slate-400 text-sm">
                    Seu negócio foi registrado com sucesso. Em breve ele aparecerá nas buscas do Econecta AI.
                  </p>
                </div>
                <button onClick={closeModal} className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-95">
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                <div className="px-6 py-5 space-y-6">

                  <Section icon={Building2} title="Informações do negócio" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nome do negócio" name="business_name" value={form.business_name} onChange={handleChange} placeholder="Ex: Padaria Central" required />
                    <Field label="Nome do responsável" name="owner_name" value={form.owner_name} onChange={handleChange} placeholder="Seu nome completo" required />
                    <Field label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} placeholder="contato@negocio.com" required />
                    <Field label="Telefone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" required />
                    <Field label="Cidade" name="city" value={form.city} onChange={handleChange} placeholder="Sua cidade" required />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Estado <span className="text-rose-400">*</span></label>
                      <select name="state" value={form.state} onChange={handleChange} required className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60 transition-colors appearance-none">
                        <option value="" disabled className="bg-[#0a0f1e]">Selecione</option>
                        {BRAZIL_STATES.map((s) => <option key={s} value={s} className="bg-[#0a0f1e]">{s}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Categoria <span className="text-rose-400">*</span></label>
                      <select name="category" value={form.category} onChange={handleChange} required className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60 transition-colors appearance-none">
                        <option value="" disabled className="bg-[#0a0f1e]">Selecione uma categoria</option>
                        {CATEGORIES.map((c) => <option key={c.label} value={c.label} className="bg-[#0a0f1e]">{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <Section icon={MapPin} title="Localização" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><Field label="Endereço" name="address" value={form.address ?? ""} onChange={handleChange} placeholder="Rua, número" /></div>
                    <Field label="Bairro" name="neighborhood" value={form.neighborhood ?? ""} onChange={handleChange} placeholder="Nome do bairro" />
                    <Field label="CEP" name="postal_code" value={form.postal_code ?? ""} onChange={handleChange} placeholder="00000-000" />
                  </div>

                  <Section icon={Globe} title="Contato digital" optional />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="WhatsApp" name="whatsapp" type="tel" value={form.whatsapp ?? ""} onChange={handleChange} placeholder="(11) 99999-9999" />
                    <Field label="Instagram" name="instagram" value={form.instagram ?? ""} onChange={handleChange} placeholder="@seunegocio" />
                    <div className="sm:col-span-2"><Field label="Website" name="website" type="url" value={form.website ?? ""} onChange={handleChange} placeholder="https://seunegocio.com.br" /></div>
                  </div>

                  <Section icon={Clock} title="Sobre o negócio" optional />
                  <div className="space-y-4">
                    <TextareaField label="Descrição" name="description" value={form.description ?? ""} onChange={handleChange} placeholder="Conte um pouco sobre seu negócio, produtos e diferenciais..." rows={3} />
                    <Field label="Horário de funcionamento" name="opening_hours" value={form.opening_hours ?? ""} onChange={handleChange} placeholder="Seg–Sex: 8h–18h | Sáb: 8h–13h" />
                  </div>

                  <Section icon={Tag} title="Promoção atual" optional />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><Field label="Título da promoção" name="promotion_title" value={form.promotion_title ?? ""} onChange={handleChange} placeholder="Ex: Frete grátis na primeira compra" /></div>
                    <div className="sm:col-span-2"><TextareaField label="Descrição da promoção" name="promotion_description" value={form.promotion_description ?? ""} onChange={handleChange} placeholder="Detalhes, condições e termos da promoção..." rows={2} /></div>
                    <Field label="Desconto (%)" name="discount_percentage" type="number" value={form.discount_percentage == null ? "" : String(form.discount_percentage)} onChange={handleChange} placeholder="Ex: 20" />
                    <Field label="Válido até" name="promotion_expiration" type="date" value={form.promotion_expiration ?? ""} onChange={handleChange} />
                  </div>

                  {formError && (
                    <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                      {formError}
                    </p>
                  )}

                  <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-95 shadow-lg shadow-blue-500/20">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : "Cadastrar negócio"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Result card                                               */
/* ────────────────────────────────────────────────────────── */

function ResultCard({ biz }: { biz: SearchResult }) {
  const promoActive = isPromoActive(biz);

  return (
    <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors flex flex-col">
      {/* Card header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-slate-300">
            {biz.category}
          </span>
          {promoActive && biz.discount_percentage != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-bold shrink-0">
              <Tag className="w-3 h-3" />
              {biz.discount_percentage}% OFF
            </span>
          )}
          {promoActive && biz.discount_percentage == null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-medium shrink-0">
              <Tag className="w-3 h-3" />
              Promoção
            </span>
          )}
        </div>

        <h3 className="text-white font-bold text-base mb-1 leading-tight">
          {biz.business_name}
        </h3>

        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>
            {[biz.neighborhood, biz.city, biz.state]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>

        {biz.description && (
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {biz.description}
          </p>
        )}
      </div>

      {/* Promotion block */}
      {promoActive && biz.promotion_title && (
        <div className="mx-5 mb-4 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl p-3.5">
          <p className="text-amber-300 font-semibold text-sm mb-1">
            🎯 {biz.promotion_title}
          </p>
          {biz.promotion_description && (
            <p className="text-amber-200/60 text-xs leading-relaxed line-clamp-2 mb-2">
              {biz.promotion_description}
            </p>
          )}
          {biz.promotion_expiration && (
            <p className="text-amber-500/60 text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Válido até{" "}
              {new Date(biz.promotion_expiration + "T00:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      {/* Contact row */}
      {(biz.whatsapp || biz.instagram || biz.website) && (
        <div className="px-5 pb-5 mt-auto flex flex-wrap items-center gap-2">
          {biz.whatsapp && (
            <a
              href={`https://wa.me/${biz.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/40 text-xs font-medium transition-all duration-200 hover:scale-[1.03]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          )}
          {biz.instagram && (
            <a
              href={`https://instagram.com/${biz.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/15 border border-pink-500/25 text-pink-300 hover:text-pink-200 hover:border-pink-500/40 text-xs font-medium transition-all duration-200 hover:scale-[1.03]"
            >
              <Instagram className="w-3.5 h-3.5" />
              {biz.instagram}
            </a>
          )}
          {biz.website && (
            <a
              href={biz.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-300 hover:text-blue-200 hover:border-blue-500/40 text-xs font-medium transition-all duration-200 hover:scale-[1.03]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Site
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Form helpers                                              */
/* ────────────────────────────────────────────────────────── */

function Section({
  icon: Icon, title, optional,
}: {
  icon: React.ElementType; title: string; optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-blue-400" />
      </div>
      <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{title}</span>
      {optional && <span className="text-xs text-slate-600 normal-case tracking-normal font-normal ml-1">(opcional)</span>}
      <div className="flex-1 h-px bg-white/[0.06] ml-2" />
    </div>
  );
}

function Field({
  label, name, value, onChange, placeholder, type = "text", required,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 100 : undefined}
        className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 transition-colors"
      />
    </div>
  );
}

function TextareaField({
  label, name, value, onChange, placeholder, rows = 3,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <textarea
        name={name} value={value} onChange={onChange}
        placeholder={placeholder} rows={rows}
        className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 transition-colors resize-none"
      />
    </div>
  );
}
