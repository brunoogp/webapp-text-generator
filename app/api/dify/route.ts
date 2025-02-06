import { NextRequest, NextResponse } from "next/server";

let conversationIds: { [key: string]: string } = {}; // Armazena IDs das conversas

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();
        const chatKey = requestData.chatKey || "default"; // Identifica qual conversa está ativa

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        let conversationId = conversationIds[chatKey];

        // Se for uma nova conversa, criamos um novo ID no Dify
        if (requestData.reset || !conversationId) {
            const initResponse = await fetch("https://api.dify.ai/v1/chat-messages", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: {},
                    query: "Iniciar nova conversa",
                    response_mode: "streaming", // 🔥 Agora usando streaming corretamente
                    user: `user-${chatKey}`
                }),
            });

            const initData = await initResponse.json();
            if (!initResponse.ok) {
                return NextResponse.json({ error: `Erro ao criar nova conversa: ${initData.message}` }, { status: initResponse.status });
            }

            conversationId = initData.conversation_id; // Define o novo ID
            conversationIds[chatKey] = conversationId;
        }

        // Agora enviamos a mensagem normal com o ID correto
        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer SEU_TOKEN_DIFY",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: requestData.query,
                conversation_id: conversationId,
                response_mode: "streaming", // 🚀 Streaming ativo
                user: `user-${chatKey}`
            }),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message}` }, { status: response.status });
        }

        // Tratamento correto do streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value, { stream: true });
        }

        return NextResponse.json({ response: fullResponse.trim() });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
