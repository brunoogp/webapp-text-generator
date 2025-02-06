import { NextRequest, NextResponse } from "next/server";

let conversationId: string | null = null; // 🔥 Inicializa corretamente

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🚀 Se `reset` for true, inicia uma nova conversa e define `conversationId` como `null`
        if (requestData.reset) {
            conversationId = null;
        }

        // 🔥 Monta o payload da requisição para o Dify
        const payload: any = {
            inputs: {},
            query: requestData.query,
            response_mode: "blocking", // ⚠️ Alterado para "blocking" para garantir resposta completa
            user: "user-123",
        };

        // 🔥 Se já tivermos um conversationId, adicionamos ao payload para manter o contexto
        if (conversationId) {
            payload.conversation_id = conversationId;
        }

        // 🚀 Fazendo a requisição para o Dify
        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // 🔥 Pegamos a resposta JSON do Dify
        const responseData = await response.json();

        // ✅ Armazena o `conversation_id` para continuidade da conversa
        if (responseData.conversation_id) {
            conversationId = responseData.conversation_id;
        }

        return NextResponse.json({ 
            response: responseData.answer || "Erro ao obter resposta.", 
            conversation_id 
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
