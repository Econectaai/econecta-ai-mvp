"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#1e293b",
  color: "white",
  fontSize: "16px",
};

export default function PromocoesPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [desconto, setDesconto] = useState("");
  const [precoNormal, setPrecoNormal] = useState("");
  const [precoPromocional, setPrecoPromocional] = useState("");
  const [validade, setValidade] = useState("");
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarUsuario() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user.email) {
        router.replace("/parceiro");
        return;
      }

      setEmail(session.user.email);
      setUserId(session.user.id);
      setCarregando(false);
    }

    carregarUsuario();
  }, [router]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function selecionarImagem(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setMensagem("");
    setSucesso(false);

    if (!arquivo.type.startsWith("image/")) {
      setMensagem("Selecione um arquivo de imagem.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setMensagem("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setArquivoImagem(arquivo);
    setPreview(URL.createObjectURL(arquivo));
  }

  function limparImagem() {
    if (preview) URL.revokeObjectURL(preview);
    setArquivoImagem(null);
    setPreview("");
  }

  function converterNumero(valor: string) {
    if (!valor.trim()) return null;
    const numero = Number(valor.replace(",", "."));
    return Number.isNaN(numero) ? null : numero;
  }

  async function enviarImagem() {
    if (!arquivoImagem) return null;
    if (!userId) throw new Error("Usuário não identificado.");

    const extensao =
      arquivoImagem.name.split(".").pop()?.toLowerCase() || "jpg";

    const caminho =
      `${userId}/${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("promocoes")
      .upload(caminho, arquivoImagem, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error("Erro ao enviar imagem: " + error.message);
    }

    const { data } = supabase.storage
      .from("promocoes")
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");
    setSucesso(false);

    if (!titulo.trim()) {
      setMensagem("Preencha o título da promoção.");
      return;
    }

    const descontoNumero = desconto ? Number(desconto) : null;
    const normalNumero = converterNumero(precoNormal);
    const promocionalNumero = converterNumero(precoPromocional);

    if (
      descontoNumero !== null &&
      (Number.isNaN(descontoNumero) ||
        descontoNumero < 0 ||
        descontoNumero > 100)
    ) {
      setMensagem("O desconto deve estar entre 0 e 100.");
      return;
    }

    if (precoNormal && normalNumero === null) {
      setMensagem("Digite um preço normal válido.");
      return;
    }

    if (precoPromocional && promocionalNumero === null) {
      setMensagem("Digite um preço promocional válido.");
      return;
    }

    setSalvando(true);

    try {
      const imagem = await enviarImagem();

      const { error } = await supabase.from("promocoes").insert({
        parceiro_email: email,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        categoria: categoria || null,
        desconto: descontoNumero,
        preco_normal: normalNumero,
        preco_promocional: promocionalNumero,
        validade: validade || null,
        imagem,
        ativa: true,
      });

      if (error) throw new Error(error.message);

      setMensagem("Promoção salva com sucesso!");
      setSucesso(true);
      setTitulo("");
      setDescricao("");
      setCategoria("");
      setDesconto("");
      setPrecoNormal("");
      setPrecoPromocional("");
      setValidade("");
      limparImagem();
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Erro inesperado."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial, sans-serif",
      }}>
        Verificando acesso...
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #020617, #0f172a)",
      color: "white",
      padding: "45px 20px",
      fontFamily: "Arial, sans-serif",
    }}>
      <section style={{
        maxWidth: "980px",
        margin: "0 auto",
        padding: "36px",
        borderRadius: "22px",
        border: "1px solid #1e293b",
        background: "rgba(15, 23, 42, 0.95)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "28px",
        }}>
          <div>
            <p style={{ color: "#22c55e", fontWeight: 700, margin: 0 }}>
              EconectaAI
            </p>
            <h1 style={{ fontSize: "42px", margin: "10px 0" }}>
              Nova Promoção
            </h1>
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Cadastre uma oferta com imagem.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/parceiro/painel")}
            style={{
              height: "44px",
              padding: "0 18px",
              borderRadius: "10px",
              border: "1px solid #475569",
              background: "transparent",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Voltar ao painel
          </button>
        </div>

        <p style={{ color: "#94a3b8" }}>
          Parceiro conectado: <strong style={{ color: "white" }}>{email}</strong>
        </p>

        <form onSubmit={salvar}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
            Título da promoção *
          </label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Troca de óleo com desconto"
            style={{ ...inputStyle, marginBottom: "20px" }}
          />

          <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={5}
            placeholder="Descreva os detalhes da promoção..."
            style={{
              ...inputStyle,
              minHeight: "140px",
              resize: "vertical",
              marginBottom: "20px",
              fontFamily: "Arial, sans-serif",
            }}
          />

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={inputStyle}
              >
                <option value="">Selecione</option>
                <option value="Restaurantes">Restaurantes</option>
                <option value="Supermercados">Supermercados</option>
                <option value="Farmácias">Farmácias</option>
                <option value="Serviços">Serviços</option>
                <option value="Moda">Moda</option>
                <option value="Beleza">Beleza</option>
                <option value="Automotivo">Automotivo</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Desconto (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="Ex.: 30"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Preço normal
              </label>
              <input
                value={precoNormal}
                onChange={(e) => setPrecoNormal(e.target.value)}
                placeholder="Ex.: 150,00"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Preço promocional
              </label>
              <input
                value={precoPromocional}
                onChange={(e) => setPrecoPromocional(e.target.value)}
                placeholder="Ex.: 99,90"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Validade
              </label>
              <input
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Imagem da promoção
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={selecionarImagem}
                style={inputStyle}
              />
              <small style={{ color: "#94a3b8" }}>
                JPG, PNG ou WebP. Máximo de 5 MB.
              </small>
            </div>
          </div>

          {preview && (
            <div style={{
              marginTop: "22px",
              padding: "16px",
              borderRadius: "14px",
              border: "1px solid #334155",
              background: "#111827",
            }}>
              <img
                src={preview}
                alt="Prévia da promoção"
                style={{
                  width: "100%",
                  maxHeight: "360px",
                  objectFit: "cover",
                  borderRadius: "12px",
                }}
              />
              <button
                type="button"
                onClick={limparImagem}
                style={{
                  marginTop: "12px",
                  padding: "10px 16px",
                  border: "1px solid #ef4444",
                  borderRadius: "9px",
                  background: "transparent",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Remover imagem
              </button>
            </div>
          )}

          {mensagem && (
            <div style={{
              marginTop: "22px",
              padding: "14px",
              borderRadius: "10px",
              textAlign: "center",
              fontWeight: 700,
              color: sucesso ? "#86efac" : "#fca5a5",
              background: sucesso
                ? "rgba(20, 83, 45, 0.35)"
                : "rgba(127, 29, 29, 0.35)",
            }}>
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={salvando}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "16px",
              border: "none",
              borderRadius: "12px",
              background: "#22c55e",
              color: "white",
              fontSize: "18px",
              fontWeight: 700,
              cursor: salvando ? "not-allowed" : "pointer",
              opacity: salvando ? 0.7 : 1,
            }}
          >
            {salvando ? "Enviando e salvando..." : "Salvar Promoção"}
          </button>
        </form>
      </section>
    </main>
  );
}
