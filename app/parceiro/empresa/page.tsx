"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function EmpresaPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [descricao, setDescricao] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function carregarDados() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user.email) {
        router.replace("/parceiro");
        return;
      }

      const usuarioEmail = session.user.email;
      setEmail(usuarioEmail);

      const { data, error } = await supabase
        .from("parceiros")
        .select(
          "nome, categoria, cidade, endereco, telefone, whatsapp, descricao"
        )
        .eq("email", usuarioEmail)
        .maybeSingle();

      if (error) {
        setMensagem("Erro ao carregar empresa: " + error.message);
        setCarregando(false);
        return;
      }

      if (data) {
        setNome(data.nome ?? "");
        setCategoria(data.categoria ?? "");
        setCidade(data.cidade ?? "");
        setEndereco(data.endereco ?? "");
        setTelefone(data.telefone ?? "");
        setWhatsapp(data.whatsapp ?? "");
        setDescricao(data.descricao ?? "");
      }

      setCarregando(false);
    }

    carregarDados();
  }, [router]);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nome.trim() || !categoria.trim() || !cidade.trim()) {
      setMensagem("Preencha nome, categoria e cidade.");
      return;
    }

    setSalvando(true);
    setMensagem("");

    const { error } = await supabase.from("parceiros").upsert(
      {
        email,
        nome: nome.trim(),
        categoria: categoria.trim(),
        cidade: cidade.trim(),
        endereco: endereco.trim(),
        telefone: telefone.trim(),
        whatsapp: whatsapp.trim(),
        descricao: descricao.trim(),
      },
      {
        onConflict: "email",
      }
    );

    if (error) {
      setMensagem("Erro ao salvar: " + error.message);
      setSalvando(false);
      return;
    }

    setMensagem("Empresa salva com sucesso!");
    setSalvando(false);
  }

  if (carregando) {
    return (
      <main style={pagina}>
        <p>Carregando dados da empresa...</p>
      </main>
    );
  }

  return (
    <main style={pagina}>
      <section style={card}>
        <div style={cabecalho}>
          <div>
            <p style={marca}>EconectaAI</p>
            <h1 style={titulo}>Minha Empresa</h1>
            <p style={subtitulo}>
              Cadastre os dados que aparecerão para os clientes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/parceiro/painel")}
            style={botaoVoltar}
          >
            ← Voltar
          </button>
        </div>

        <div style={conta}>
          <span>Conta conectada</span>
          <strong>{email}</strong>
        </div>

        <form onSubmit={salvar}>
          <div style={grade}>
            <Campo
              label="Nome da empresa *"
              value={nome}
              onChange={setNome}
              placeholder="Ex.: Bella Pizza"
            />

            <div>
              <label style={label}>Categoria *</label>
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                style={input}
              >
                <option value="">Selecione</option>
                <option value="Restaurantes">Restaurantes</option>
                <option value="Supermercados">Supermercados</option>
                <option value="Farmácias">Farmácias</option>
                <option value="Serviços">Serviços</option>
                <option value="Moda">Moda</option>
                <option value="Beleza">Beleza</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <Campo
              label="Cidade *"
              value={cidade}
              onChange={setCidade}
              placeholder="Ex.: Santo André"
            />

            <Campo
              label="Endereço"
              value={endereco}
              onChange={setEndereco}
              placeholder="Rua, número e bairro"
            />

            <Campo
              label="Telefone"
              value={telefone}
              onChange={setTelefone}
              placeholder="(11) 3333-4444"
            />

            <Campo
              label="WhatsApp"
              value={whatsapp}
              onChange={setWhatsapp}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div style={{ marginTop: "20px" }}>
            <label style={label}>Descrição da empresa</label>
            <textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              rows={5}
              placeholder="Conte aos clientes o que sua empresa oferece."
              style={{
                ...input,
                resize: "vertical",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </div>

          {mensagem && (
            <p
              style={{
                marginTop: "20px",
                padding: "13px",
                borderRadius: "10px",
                background: mensagem.includes("sucesso")
                  ? "rgba(22, 101, 52, 0.35)"
                  : "rgba(127, 29, 29, 0.35)",
                color: mensagem.includes("sucesso")
                  ? "#86efac"
                  : "#fca5a5",
                textAlign: "center",
              }}
            >
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={salvando}
            style={botaoSalvar}
          >
            {salvando ? "Salvando..." : "Salvar empresa"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Campo({
  label: texto,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label style={label}>{texto}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={input}
      />
    </div>
  );
}

const pagina = {
  minHeight: "100vh",
  background:
    "linear-gradient(145deg, #020617 0%, #0f172a 60%, #111827 100%)",
  color: "white",
  padding: "50px 20px",
  fontFamily: "Arial, sans-serif",
};

const card = {
  maxWidth: "980px",
  margin: "0 auto",
  background: "rgba(15, 23, 42, 0.94)",
  border: "1px solid #1e293b",
  borderRadius: "22px",
  padding: "32px",
};

const cabecalho = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap" as const,
};

const marca = {
  margin: 0,
  color: "#22c55e",
  fontWeight: 700,
};

const titulo = {
  margin: "8px 0",
  fontSize: "38px",
};

const subtitulo = {
  margin: 0,
  color: "#94a3b8",
};

const conta = {
  margin: "28px 0",
  display: "flex",
  flexDirection: "column" as const,
  gap: "5px",
  color: "#94a3b8",
};

const grade = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};

const label = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
};

const input = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#111827",
  color: "white",
  fontSize: "16px",
};

const botaoVoltar = {
  padding: "11px 18px",
  borderRadius: "10px",
  border: "1px solid #475569",
  background: "transparent",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const botaoSalvar = {
  width: "100%",
  marginTop: "24px",
  padding: "15px",
  border: "none",
  borderRadius: "11px",
  background: "#22c55e",
  color: "white",
  fontSize: "17px",
  fontWeight: 700,
  cursor: "pointer",
};