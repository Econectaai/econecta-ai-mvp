import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { mensagem } = await request.json();

    if (!mensagem) {
      return NextResponse.json(
        { erro: "Mensagem não informada." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { erro: "OPENAI_API_KEY não encontrada no servidor." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "Você é o Funcionário Digital da EconectaAI. Responda sempre em português do Brasil, de forma simples, objetiva e profissional. Use somente os dados fornecidos pelo sistema. Nunca invente dados financeiros, clientes, serviços ou pagamentos.",
        },
        {
          role: "user",
          content: mensagem,
        },
      ],
    });

    return NextResponse.json({
      resposta: response.output_text,
    });
  } catch (error: any) {
    console.error("ERRO OPENAI:", error);

    return NextResponse.json(
      {
        erro:
          error?.message ||
          "Não foi possível consultar o Funcionário Digital.",
      },
      { status: 500 }
    );
  }
}