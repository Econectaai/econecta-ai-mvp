"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function PainelPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [verificando, setVerificando] = useState(true);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/parceiro");
        return;
      }

      setEmail(session.user.email ?? "Parceiro");
      setVerificando(false);
    }

    verificarSessao();
  }, [router]);

  async function sair() {
    setSaindo(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Não foi possível sair. Tente novamente.");
      setSaindo(false);
      return;
    }

    router.replace("/parceiro");
    router.refresh();
  }

  if (verificando) {
    return (
      <main style={loadingPageStyle}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", marginBottom: "10px" }}>
            Verificando acesso...
          </p>

          <p style={{ color: "#94a3b8", margin: 0 }}>
            Aguarde um instante.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <strong style={logoStyle}>EconectaAI</strong>
          <span style={headerSubtitleStyle}>Painel do Parceiro</span>
        </div>

        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          style={{
            ...logoutButtonStyle,
            cursor: saindo ? "not-allowed" : "pointer",
            opacity: saindo ? 0.7 : 1,
          }}
        >
          {saindo ? "Saindo..." : "Sair"}
        </button>
      </header>

      <section style={contentStyle}>
        <div style={welcomeStyle}>
          <p style={successTextStyle}>Acesso autorizado</p>

          <h1 style={mainTitleStyle}>Bem-vindo ao seu painel</h1>

          <p style={welcomeDescriptionStyle}>
            Gerencie sua empresa, suas promoções e acompanhe os resultados da
            EconectaAI.
          </p>

          <div style={userBoxStyle}>
            <span style={{ color: "#94a3b8" }}>Usuário conectado</span>
            <strong style={{ color: "white" }}>{email}</strong>
          </div>
        </div>

        <div style={statisticsGridStyle}>
          <article style={statisticCardStyle}>
            <span style={statisticLabelStyle}>Promoções ativas</span>
            <strong style={statisticNumberStyle}>0</strong>
            <span style={statisticHelpStyle}>
              Ofertas publicadas atualmente
            </span>
          </article>

          <article style={statisticCardStyle}>
            <span style={statisticLabelStyle}>Visualizações</span>
            <strong style={statisticNumberStyle}>0</strong>
            <span style={statisticHelpStyle}>
              Pessoas que visualizaram suas ofertas
            </span>
          </article>

          <article style={statisticCardStyle}>
            <span style={statisticLabelStyle}>Contatos</span>
            <strong style={statisticNumberStyle}>0</strong>
            <span style={statisticHelpStyle}>
              Cliques no WhatsApp ou telefone
            </span>
          </article>
        </div>

        <div style={actionsGridStyle}>
          <article style={actionCardStyle}>
            <div style={iconBoxStyle}>🏪</div>

            <h2 style={cardTitleStyle}>Minha empresa</h2>

            <p style={cardDescriptionStyle}>
              Consulte e atualize o nome, endereço, categoria, telefone e
              WhatsApp do estabelecimento.
            </p>

            <button type="button" style={secondaryButtonStyle}>
              Gerenciar empresa
            </button>
          </article>

          <article style={actionCardStyle}>
            <div style={iconBoxStyle}>🏷️</div>

            <h2 style={cardTitleStyle}>Promoções</h2>

            <p style={cardDescriptionStyle}>
              Cadastre novas ofertas, escolha o desconto e defina o período da
              promoção.
            </p>

            <button type="button" style={primaryButtonStyle}>
              Nova promoção
            </button>
          </article>

          <article style={actionCardStyle}>
            <div style={iconBoxStyle}>📊</div>

            <h2 style={cardTitleStyle}>Resultados</h2>

            <p style={cardDescriptionStyle}>
              Acompanhe o desempenho das ofertas e descubra quais promoções
              geram mais interesse.
            </p>

            <button type="button" style={secondaryButtonStyle}>
              Ver resultados
            </button>
          </article>
        </div>

        <section style={recentSectionStyle}>
          <div style={recentHeaderStyle}>
            <div>
              <h2 style={{ margin: 0, fontSize: "26px" }}>
                Promoções recentes
              </h2>

              <p
                style={{
                  color: "#94a3b8",
                  margin: "8px 0 0",
                  lineHeight: 1.6,
                }}
              >
                Suas promoções cadastradas aparecerão aqui.
              </p>
            </div>

            <button type="button" style={smallPrimaryButtonStyle}>
              + Criar promoção
            </button>
          </div>

          <div style={emptyStateStyle}>
            <div style={{ fontSize: "44px", marginBottom: "14px" }}>🏷️</div>

            <h3 style={{ margin: "0 0 10px", fontSize: "21px" }}>
              Nenhuma promoção cadastrada
            </h3>

            <p
              style={{
                color: "#94a3b8",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Na próxima etapa, vamos conectar este painel ao banco de dados e
              permitir o cadastro de ofertas reais.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

const loadingPageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(145deg, #020617 0%, #0f172a 55%, #111827 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const headerStyle: CSSProperties = {
  minHeight: "76px",
  padding: "0 7%",
  borderBottom: "1px solid #1e293b",
  background: "rgba(2, 6, 23, 0.88)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const logoStyle: CSSProperties = {
  color: "#22c55e",
  fontSize: "23px",
};

const headerSubtitleStyle: CSSProperties = {
  marginLeft: "14px",
  color: "#94a3b8",
};

const logoutButtonStyle: CSSProperties = {
  padding: "11px 22px",
  borderRadius: "10px",
  border: "1px solid #475569",
  background: "transparent",
  color: "white",
  fontWeight: 700,
};

const contentStyle: CSSProperties = {
  width: "86%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "54px 0 70px",
};

const welcomeStyle: CSSProperties = {
  maxWidth: "760px",
};

const successTextStyle: CSSProperties = {
  color: "#4ade80",
  fontWeight: 700,
  margin: "0 0 12px",
};

const mainTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 5vw, 55px)",
  lineHeight: 1.1,
};

const welcomeDescriptionStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "18px",
  lineHeight: 1.7,
  margin: "18px 0 24px",
};

const userBoxStyle: CSSProperties = {
  display: "inline-flex",
  flexDirection: "column",
  gap: "5px",
  padding: "14px 18px",
  borderRadius: "12px",
  border: "1px solid #1e293b",
  background: "rgba(15, 23, 42, 0.7)",
};

const statisticsGridStyle: CSSProperties = {
  marginTop: "42px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const statisticCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: "22px",
  borderRadius: "18px",
  border: "1px solid #1e293b",
  background: "rgba(15, 23, 42, 0.86)",
};

const statisticLabelStyle: CSSProperties = {
  color: "#94a3b8",
  fontWeight: 700,
};

const statisticNumberStyle: CSSProperties = {
  fontSize: "38px",
  margin: "12px 0 8px",
};

const statisticHelpStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const actionsGridStyle: CSSProperties = {
  marginTop: "24px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
};

const actionCardStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "20px",
  border: "1px solid #1e293b",
  background: "rgba(15, 23, 42, 0.92)",
  boxShadow: "0 18px 45px rgba(0, 0, 0, 0.22)",
};

const iconBoxStyle: CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "16px",
  background: "#111827",
  border: "1px solid #334155",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "29px",
};

const cardTitleStyle: CSSProperties = {
  margin: "22px 0 10px",
  fontSize: "24px",
};

const cardDescriptionStyle: CSSProperties = {
  minHeight: "82px",
  color: "#94a3b8",
  lineHeight: 1.65,
  margin: "0 0 24px",
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "10px",
  border: "none",
  background: "#22c55e",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#111827",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const recentSectionStyle: CSSProperties = {
  marginTop: "28px",
  padding: "28px",
  borderRadius: "20px",
  border: "1px solid #1e293b",
  background: "rgba(15, 23, 42, 0.75)",
};

const recentHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "20px",
};

const smallPrimaryButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#22c55e",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyStateStyle: CSSProperties = {
  marginTop: "28px",
  padding: "45px 24px",
  borderRadius: "16px",
  border: "1px dashed #334155",
  background: "rgba(2, 6, 23, 0.45)",
  textAlign: "center",
};