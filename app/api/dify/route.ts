import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // Criando um ID de conversa único baseado na sessão do usuário
        const conversationId = requestData.conversation_id || "user-session-123"; 

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // 🔥 Substitua pelo token correto
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {},
                query: requestData.query,
                response_mode: "blocking", // 🚀 Modo que garante que a resposta completa será enviada
                user: "teste-123",
                conversation_id: conversationId, // ✅ Passando o ID da conversa para manter o contexto
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ response: data.answer });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
