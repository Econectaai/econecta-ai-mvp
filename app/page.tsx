"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function PainelPage() {
  const router = useRouter();

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/parceiro");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "50px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Painel do Parceiro</h1>
      <p>Login realizado com sucesso. Bem-vindo à EconectaAI!</p>

      <button
        onClick={sair}
        style={{
          marginTop: "24px",
          padding: "12px 24px",
          border: "none",
          borderRadius: "10px",
          background: "#22c55e",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Sair
      </button>
    </main>
  );
}