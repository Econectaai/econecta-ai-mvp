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
  X,
  CheckCircle2,
  Loader2,
  Building2,
  Tag,
  Globe,
  Clock,
} from "lucide-react";
import { supabase, type Business } from "../lib/supabase";

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

const BRAZIL_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

type FormData = Omit<Business, "id" | "created_at">;

const EMPTY_FORM: FormData = {
  // Core
  business_name: "",
  owner_name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  category: "",
  // Location
  address: "",
  neighborhood: "",
  postal_code: "",
  // Digital contact
  whatsapp: "",
  instagram: "",
  website: "",
  // Business info
  description: "",
  opening_hours: "",
  // Promotion
  promotion_title: "",
  promotion_description: "",
  discount_percentage: null,
  promotion_expiration: "",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setForm({ ...EMPTY_FORM, category: activeCategory ?? "" });
    setSuccess(false);
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (loading) return;
    setModalOpen(false);
    setSuccess(false);
    setError(null);
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
    setLoading(true);
    setError(null);

    // Strip empty optional strings so Supabase stores NULL instead of ""
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === "" || v === null) {
        payload[k] = null;
      } else {
        payload[k] = v;
      }
    }

    const { error: sbError } = await supabase.from("businesses").insert([payload]);

    setLoading(false);
    if (sbError) {
      setError(sbError.message);
    } else {
      setSuccess(true);
    }
  }

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
                placeholder="Buscar promoções, produtos, lojas..."
                className="flex-1 bg-transparent px-4 py-4 text-white placeholder-slate-500 outline-none text-sm sm:text-base"
              />
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
                onClick={() => setActiveCategory(isActive ? null : cat.label)}
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

        {/* CTA — register business */}
        <div
          className="mt-10 animate-fade-in"
          style={{ animationDelay: "650ms" }}
        >
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-95"
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            Cadastre seu negócio gratuitamente
          </button>
        </div>
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="w-full max-w-2xl glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-base leading-tight">
                    Cadastre seu negócio
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Apareça nas buscas do Econecta AI
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success state */}
            {success ? (
              <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    Cadastro realizado!
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Seu negócio foi registrado com sucesso. Em breve ele
                    aparecerá nas buscas do Econecta AI.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-95"
                >
                  Fechar
                </button>
              </div>
            ) : (
              /* Scrollable form body */
              <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                <div className="px-6 py-5 space-y-6">

                  {/* ── Section: Informações do negócio ── */}
                  <Section icon={Building2} title="Informações do negócio" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Nome do negócio"
                      name="business_name"
                      value={form.business_name}
                      onChange={handleChange}
                      placeholder="Ex: Padaria Central"
                      required
                    />
                    <Field
                      label="Nome do responsável"
                      name="owner_name"
                      value={form.owner_name}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                      required
                    />
                    <Field
                      label="E-mail"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="contato@negocio.com"
                      required
                    />
                    <Field
                      label="Telefone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                      required
                    />
                    <Field
                      label="Cidade"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Sua cidade"
                      required
                    />
                    {/* State select */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Estado <span className="text-rose-400">*</span>
                      </label>
                      <select
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        required
                        className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60 transition-colors appearance-none"
                      >
                        <option value="" disabled className="bg-[#0a0f1e]">Selecione</option>
                        {BRAZIL_STATES.map((s) => (
                          <option key={s} value={s} className="bg-[#0a0f1e]">{s}</option>
                        ))}
                      </select>
                    </div>
                    {/* Category select — full width */}
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Categoria <span className="text-rose-400">*</span>
                      </label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        required
                        className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60 transition-colors appearance-none"
                      >
                        <option value="" disabled className="bg-[#0a0f1e]">Selecione uma categoria</option>
                        {categories.map((c) => (
                          <option key={c.label} value={c.label} className="bg-[#0a0f1e]">{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── Section: Localização ── */}
                  <Section icon={MapPin} title="Localização" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field
                        label="Endereço"
                        name="address"
                        value={form.address ?? ""}
                        onChange={handleChange}
                        placeholder="Rua, número"
                      />
                    </div>
                    <Field
                      label="Bairro"
                      name="neighborhood"
                      value={form.neighborhood ?? ""}
                      onChange={handleChange}
                      placeholder="Nome do bairro"
                    />
                    <Field
                      label="CEP"
                      name="postal_code"
                      value={form.postal_code ?? ""}
                      onChange={handleChange}
                      placeholder="00000-000"
                    />
                  </div>

                  {/* ── Section: Contato digital ── */}
                  <Section icon={Globe} title="Contato digital" optional />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="WhatsApp"
                      name="whatsapp"
                      type="tel"
                      value={form.whatsapp ?? ""}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                    />
                    <Field
                      label="Instagram"
                      name="instagram"
                      value={form.instagram ?? ""}
                      onChange={handleChange}
                      placeholder="@seunegocio"
                    />
                    <div className="sm:col-span-2">
                      <Field
                        label="Website"
                        name="website"
                        type="url"
                        value={form.website ?? ""}
                        onChange={handleChange}
                        placeholder="https://seunegocio.com.br"
                      />
                    </div>
                  </div>

                  {/* ── Section: Sobre o negócio ── */}
                  <Section icon={Clock} title="Sobre o negócio" optional />
                  <div className="space-y-4">
                    <TextareaField
                      label="Descrição"
                      name="description"
                      value={form.description ?? ""}
                      onChange={handleChange}
                      placeholder="Conte um pouco sobre seu negócio, produtos e diferenciais..."
                      rows={3}
                    />
                    <Field
                      label="Horário de funcionamento"
                      name="opening_hours"
                      value={form.opening_hours ?? ""}
                      onChange={handleChange}
                      placeholder="Seg–Sex: 8h–18h | Sáb: 8h–13h"
                    />
                  </div>

                  {/* ── Section: Promoção atual ── */}
                  <Section icon={Tag} title="Promoção atual" optional />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field
                        label="Título da promoção"
                        name="promotion_title"
                        value={form.promotion_title ?? ""}
                        onChange={handleChange}
                        placeholder="Ex: Frete grátis na primeira compra"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <TextareaField
                        label="Descrição da promoção"
                        name="promotion_description"
                        value={form.promotion_description ?? ""}
                        onChange={handleChange}
                        placeholder="Detalhes, condições e termos da promoção..."
                        rows={2}
                      />
                    </div>
                    <Field
                      label="Desconto (%)"
                      name="discount_percentage"
                      type="number"
                      value={form.discount_percentage == null ? "" : String(form.discount_percentage)}
                      onChange={handleChange}
                      placeholder="Ex: 20"
                    />
                    <Field
                      label="Válido até"
                      name="promotion_expiration"
                      type="date"
                      value={form.promotion_expiration ?? ""}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                      Erro ao salvar: {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-95 shadow-lg shadow-blue-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Cadastrar negócio"
                    )}
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

/* ── Section header ── */
function Section({
  icon: Icon,
  title,
  optional,
}: {
  icon: React.ElementType;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-blue-400" />
      </div>
      <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
        {title}
      </span>
      {optional && (
        <span className="text-xs text-slate-600 normal-case tracking-normal font-normal ml-1">
          (opcional)
        </span>
      )}
      <div className="flex-1 h-px bg-white/[0.06] ml-2" />
    </div>
  );
}

/* ── Reusable input field ── */
function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 100 : undefined}
        className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 transition-colors"
      />
    </div>
  );
}

/* ── Textarea field ── */
function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 transition-colors resize-none"
      />
    </div>
  );
}
