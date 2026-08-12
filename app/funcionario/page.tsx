"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function FuncionarioPage() {
  const [mensagem, setMensagem] = useState("");
  const [resposta, setResposta] = useState("");
  const [saldoPendente, setSaldoPendente] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [respondendo, setRespondendo] = useState(false);
  const [quantidadeClientes, setQuantidadeClientes] = useState(0);
  const [quantidadeServicos, setQuantidadeServicos] = useState(0);

  useEffect(() => {
    async function carregarResumo() {
      setCarregando(true);

      try {
        const { data: clientes, error: erroClientes } = await supabase
          .from("fd_clients")
          .select("id, name");

        if (erroClientes) {
          throw erroClientes;
        }

        const { data: servicos, error: erroServicos } = await supabase
          .from("fd_services")
          .select("id, total_amount, client_id, status");

        if (erroServicos) {
          throw erroServicos;
        }

        const { data: pagamentos, error: erroPagamentos } = await supabase
          .from("fd_payments")
          .select("service_id, amount");

        if (erroPagamentos) {
          throw erroPagamentos;
        }

        const totalServicos =
          servicos?.reduce(
            (soma, servico) => soma + Number(servico.total_amount || 0),
            0
          ) || 0;

        const totalPagamentos =
          pagamentos?.reduce(
            (soma, pagamento) => soma + Number(pagamento.amount || 0),
            0
          ) || 0;

        setSaldoPendente(totalServicos - totalPagamentos);
        setQuantidadeClientes(clientes?.length || 0);
        setQuantidadeServicos(servicos?.length || 0);
      } catch (error) {
        console.error("Erro ao carregar resumo:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarResumo();
  }, []);

  async function enviarMensagem() {
    const texto = mensagem.trim();

    if (!texto) {
      setResposta("Digite uma pergunta.");
      return;
    }

    setRespondendo(true);
    setResposta("");

    try {
      const { data: clientes, error: erroClientes } = await supabase
        .from("fd_clients")
        .select("id, name");

      if (erroClientes) {
        throw erroClientes;
      }

      const { data: servicos, error: erroServicos } = await supabase
        .from("fd_services")
        .select("id, client_id, description, total_amount, status");

      if (erroServicos) {
        throw erroServicos;
      }

      const { data: pagamentos, error: erroPagamentos } = await supabase
        .from("fd_payments")
        .select("service_id, amount");

      if (erroPagamentos) {
        throw erroPagamentos;
      }

      const totalServicos =
        servicos?.reduce(
          (soma, servico) => soma + Number(servico.total_amount || 0),
          0
        ) || 0;

      const totalPagamentos =
        pagamentos?.reduce(
          (soma, pagamento) => soma + Number(pagamento.amount || 0),
          0
        ) || 0;

      const totalReceber = totalServicos - totalPagamentos;

      const contexto = `
DADOS ATUAIS DA EMPRESA:

Clientes cadastrados:
${
  clientes?.map((cliente) => `- ${cliente.name}`).join("\n") ||
  "Nenhum cliente cadastrado"
}

Quantidade de clientes:
${clientes?.length || 0}

Serviços cadastrados:
${
  servicos
    ?.map(
      (servico) =>
        `- ${servico.description}: R$ ${Number(
          servico.total_amount || 0
        ).toFixed(2)} - status: ${servico.status}`
    )
    .join("\n") || "Nenhum serviço cadastrado"
}

Quantidade de serviços:
${servicos?.length || 0}

Valor total dos serviços:
R$ ${totalServicos.toFixed(2)}

Valor já recebido:
R$ ${totalPagamentos.toFixed(2)}

Valor ainda a receber:
R$ ${totalReceber.toFixed(2)}

PERGUNTA DO EMPRESÁRIO:
${texto}

Responda usando somente os dados apresentados acima.
`;

      const respostaApi = await fetch("/api/funcionario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensagem: contexto,
        }),
      });

      const resultado = await respostaApi.json();

      if (!respostaApi.ok) {
        throw new Error(resultado.erro || "Erro ao consultar a IA.");
      }

      setResposta(resultado.resposta);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);

      setResposta(
        "Não consegui consultar o Funcionário Digital agora. Verifique o terminal."
      );
    } finally {
      setRespondendo(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07101f",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            color: "#22c55e",
            fontWeight: "bold",
          }}
        >
          FUNCIONÁRIO DIGITAL
        </p>

        <h1
          style={{
            fontSize: "42px",
            marginBottom: "8px",
          }}
        >
          Bom dia 👋
        </h1>

        <p
          style={{
            color: "#94a3b8",
            marginBottom: "40px",
          }}
        >
          O que você precisa resolver na sua empresa?
        </p>

        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "18px",
            padding: "24px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Resumo</h2>

          <p>
            💰{" "}
            {carregando
              ? "Carregando..."
              : `R$ ${Number(saldoPendente || 0)
                  .toFixed(2)
                  .replace(".", ",")} a receber`}
          </p>

          <p>
            👤 {quantidadeClientes}{" "}
            {quantidadeClientes === 1
              ? "cliente cadastrado"
              : "clientes cadastrados"}
          </p>

          <p>
            📋 {quantidadeServicos}{" "}
            {quantidadeServicos === 1
              ? "serviço em aberto"
              : "serviços cadastrados"}
          </p>
        </div>

        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "18px",
            padding: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Converse com seu funcionário digital
          </h2>

          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Ex: Quantos clientes tenho e quanto tenho para receber?"
            style={{
              width: "100%",
              height: "110px",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #374151",
              background: "#0f172a",
              color: "white",
              fontSize: "16px",
              resize: "none",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={enviarMensagem}
            disabled={respondendo}
            style={{
              marginTop: "15px",
              background: "#22c55e",
              color: "#07101f",
              border: "none",
              borderRadius: "10px",
              padding: "14px 24px",
              fontWeight: "bold",
              cursor: respondendo ? "not-allowed" : "pointer",
              fontSize: "16px",
              opacity: respondendo ? 0.7 : 1,
            }}
          >
            {respondendo ? "Consultando..." : "Enviar"}
          </button>

          {resposta && (
            <div
              style={{
                marginTop: "20px",
                background: "#0f172a",
                border: "1px solid #374151",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <strong>Funcionário Digital:</strong>

              <p
                style={{
                  marginBottom: 0,
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {resposta}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}