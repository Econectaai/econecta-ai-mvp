"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Promocao = {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  desconto: number | null;
  preco_normal: number | null;
  preco_promocional: number | null;
  validade: string | null;
  imagem: string | null;
  ativa: boolean | null;
  created_at: string | null;
};

export default function MinhasPromocoesPage() {
  const router = useRouter();

  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => {
    carregarPromocoes();
  }, []);

  async function carregarPromocoes() {
    setCarregando(true);
    setMensagem("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user.email) {
      router.replace("/parceiro");
      return;
    }

    const { data, error } = await supabase
      .from("promocoes")
      .select(
        `
          id,
          titulo,
          descricao,
          categoria,
          desconto,
          preco_normal,
          preco_promocional,
          validade,
          imagem,
          ativa,
          created_at
        `
      )
      .eq("parceiro_email", session.user.email)
      .order("created_at", { ascending: false });

    if (error) {
      setMensagem("Erro ao carregar promoções: " + error.message);
      setPromocoes([]);
      setCarregando(false);
      return;
    }

    setPromocoes(data ?? []);
    setCarregando(false);
  }

  async function excluirPromocao(id: string) {
    const confirmou = window.confirm(
      "Deseja realmente excluir esta promoção?"
    );

    if (!confirmou) {
      return;
    }

    setExcluindoId(id);
    setMensagem("");

    const { error } = await supabase
      .from("promocoes")
      .delete()
      .eq("id", id);

    if (error) {
      setMensagem("Erro ao excluir promoção: " + error.message);
      setExcluindoId(null);
      return;
    }

    setPromocoes((listaAtual) =>
      listaAtual.filter((promocao) => promocao.id !== id)
    );

    setMensagem("Promoção excluída com sucesso.");
    setExcluindoId(null);
  }

  async function alterarStatus(promocao: Promocao) {
    setMensagem("");

    const novoStatus = !promocao.ativa;

    const { error } = await supabase
      .from("promocoes")
      .update({
        ativa: novoStatus,
      })
      .eq("id", promocao.id);

    if (error) {
      setMensagem("Erro ao alterar status: " + error.message);
      return;
    }

    setPromocoes((listaAtual) =>
      listaAtual.map((item) =>
        item.id === promocao.id
          ? {
              ...item,
              ativa: novoStatus,
            }
          : item
      )
    );
  }

  function formatarPreco(valor: number | null) {
    if (valor === null || valor === undefined) {
      return "Não informado";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function formatarData(data: string | null) {
    if (!data) {
      return "Sem validade definida";
    }

    const [ano, mes, dia] = data.split("-");

    if (!ano || !mes || !dia) {
      return data;
    }

    return `${dia}/${mes}/${ano}`;
  }

  if (carregando) {
    return (
      <main style={pagina}>
        <div style={carregandoBox}>
          <h2 style={{ margin: 0 }}>Carregando promoções...</h2>

          <p style={{ color: "#94a3b8" }}>
            Aguarde um instante.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={pagina}>
      <section style={conteudo}>
        <header style={cabecalho}>
          <div>
            <p style={marca}>EconectaAI</p>

            <h1 style={tituloPagina}>Minhas Promoções</h1>

            <p style={subtitulo}>
              Visualize e gerencie as ofertas cadastradas pela sua empresa.
            </p>
          </div>

          <div style={acoesCabecalho}>
            <button
              type="button"
              onClick={() => router.push("/parceiro/promocoes")}
              style={botaoNovaPromocao}
            >
              + Nova promoção
            </button>

            <button
              type="button"
              onClick={() => router.push("/parceiro/painel")}
              style={botaoVoltar}
            >
              ← Painel
            </button>
          </div>
        </header>

        <div style={resumo}>
          <span style={{ color: "#94a3b8" }}>
            Total de promoções
          </span>

          <strong style={{ fontSize: "32px" }}>
            {promocoes.length}
          </strong>
        </div>

        {mensagem && (
          <div
            style={{
              ...mensagemBox,
              color: mensagem.includes("sucesso")
                ? "#86efac"
                : "#fca5a5",
              background: mensagem.includes("sucesso")
                ? "rgba(20, 83, 45, 0.35)"
                : "rgba(127, 29, 29, 0.35)",
            }}
          >
            {mensagem}
          </div>
        )}

        {promocoes.length === 0 ? (
          <div style={estadoVazio}>
            <div style={{ fontSize: "48px" }}>🏷️</div>

            <h2>Nenhuma promoção cadastrada</h2>

            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              Crie sua primeira oferta para ela aparecer na EconectaAI.
            </p>

            <button
              type="button"
              onClick={() => router.push("/parceiro/promocoes")}
              style={botaoNovaPromocao}
            >
              Criar primeira promoção
            </button>
          </div>
        ) : (
          <div style={lista}>
            {promocoes.map((promocao) => (
              <article key={promocao.id} style={cardPromocao}>
                {promocao.imagem && (
                  <img
                    src={promocao.imagem}
                    alt={promocao.titulo}
                    style={imagemPromocao}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <div style={conteudoPromocao}>
                  <div style={topoPromocao}>
                    <div>
                      <div style={etiquetas}>
                        <span style={categoria}>
                          {promocao.categoria ?? "Sem categoria"}
                        </span>

                        <span
                          style={{
                            ...status,
                            color: promocao.ativa
                              ? "#86efac"
                              : "#fca5a5",
                            background: promocao.ativa
                              ? "rgba(20, 83, 45, 0.35)"
                              : "rgba(127, 29, 29, 0.35)",
                          }}
                        >
                          {promocao.ativa ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      <h2 style={tituloPromocao}>
                        {promocao.titulo}
                      </h2>
                    </div>

                    {promocao.desconto !== null && (
                      <strong style={desconto}>
                        {promocao.desconto}% OFF
                      </strong>
                    )}
                  </div>

                  {promocao.descricao && (
                    <p style={descricao}>
                      {promocao.descricao}
                    </p>
                  )}

                  <div style={dadosGrade}>
                    <div style={dado}>
                      <span style={rotulo}>Preço normal</span>
                      <strong>
                        {formatarPreco(promocao.preco_normal)}
                      </strong>
                    </div>

                    <div style={dado}>
                      <span style={rotulo}>Preço promocional</span>
                      <strong style={{ color: "#4ade80" }}>
                        {formatarPreco(promocao.preco_promocional)}
                      </strong>
                    </div>

                    <div style={dado}>
                      <span style={rotulo}>Validade</span>
                      <strong>
                        {formatarData(promocao.validade)}
                      </strong>
                    </div>
                  </div>

                  <div style={acoesPromocao}>
                    <button
                      type="button"
                      onClick={() => alterarStatus(promocao)}
                      style={botaoStatus}
                    >
                      {promocao.ativa ? "Desativar" : "Ativar"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/parceiro/promocoes/editar/${promocao.id}`
                        )
                      }
                      style={botaoEditar}
                    >
                      ✏️ Editar
                    </button>

                    <button
                      type="button"
                      disabled={excluindoId === promocao.id}
                      onClick={() => excluirPromocao(promocao.id)}
                      style={{
                        ...botaoExcluir,
                        opacity:
                          excluindoId === promocao.id ? 0.7 : 1,
                      }}
                    >
                      {excluindoId === promocao.id
                        ? "Excluindo..."
                        : "🗑 Excluir"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const pagina = {
  minHeight: "100vh",
  background:
    "linear-gradient(145deg, #020617 0%, #0f172a 58%, #111827 100%)",
  color: "white",
  padding: "50px 20px",
  fontFamily: "Arial, sans-serif",
};

const conteudo = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
};

const carregandoBox = {
  minHeight: "70vh",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
};

const cabecalho = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: "25px",
  marginBottom: "35px",
};

const marca = {
  margin: 0,
  color: "#22c55e",
  fontWeight: 700,
};

const tituloPagina = {
  margin: "10px 0",
  fontSize: "clamp(36px, 5vw, 52px)",
};

const subtitulo = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "17px",
};

const acoesCabecalho = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const resumo = {
  width: "220px",
  marginBottom: "25px",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid #1e293b",
  background: "rgba(15, 23, 42, 0.88)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const mensagemBox = {
  marginBottom: "24px",
  padding: "14px",
  borderRadius: "10px",
  textAlign: "center" as const,
  fontWeight: 700,
};

const estadoVazio = {
  padding: "55px 25px",
  borderRadius: "20px",
  border: "1px dashed #334155",
  background: "rgba(15, 23, 42, 0.75)",
  textAlign: "center" as const,
};

const lista = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "22px",
};

const cardPromocao = {
  overflow: "hidden",
  borderRadius: "20px",
  border: "1px solid #334155",
  background: "rgba(15, 23, 42, 0.94)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 280px) 1fr",
};

const imagemPromocao = {
  width: "100%",
  height: "100%",
  minHeight: "290px",
  objectFit: "cover" as const,
};

const conteudoPromocao = {
  padding: "28px",
};

const topoPromocao = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: "15px",
};

const etiquetas = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
};

const categoria = {
  padding: "7px 11px",
  borderRadius: "999px",
  background: "rgba(30, 64, 175, 0.3)",
  color: "#93c5fd",
  fontSize: "13px",
  fontWeight: 700,
};

const status = {
  padding: "7px 11px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 700,
};

const tituloPromocao = {
  margin: "16px 0 0",
  fontSize: "28px",
};

const desconto = {
  padding: "10px 14px",
  borderRadius: "12px",
  background: "rgba(20, 83, 45, 0.45)",
  color: "#86efac",
  fontSize: "20px",
};

const descricao = {
  margin: "18px 0",
  color: "#cbd5e1",
  lineHeight: 1.7,
};

const dadosGrade = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "14px",
  marginTop: "20px",
};

const dado = {
  padding: "15px",
  borderRadius: "12px",
  background: "#111827",
  border: "1px solid #1e293b",
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};

const rotulo = {
  color: "#94a3b8",
  fontSize: "14px",
};

const acoesPromocao = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "12px",
  marginTop: "25px",
};

const botaoNovaPromocao = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "10px",
  background: "#22c55e",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const botaoVoltar = {
  padding: "12px 20px",
  borderRadius: "10px",
  background: "transparent",
  color: "white",
  border: "1px solid #475569",
  fontWeight: 700,
  cursor: "pointer",
};

const botaoStatus = {
  padding: "11px 18px",
  borderRadius: "9px",
  border: "1px solid #475569",
  background: "#111827",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const botaoEditar = {
  padding: "11px 18px",
  borderRadius: "9px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const botaoExcluir = {
  padding: "11px 18px",
  borderRadius: "9px",
  border: "none",
  background: "#dc2626",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};