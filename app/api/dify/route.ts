import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Armazena o ID da conversa para manter o contexto

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🚀 Se não houver um ID salvo, deixa vazio para criar um novo
        const payload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming", 
            conversation_id: conversationId || "", // 🔥 Deixa vazio na primeira chamada
            user: "user-123",
        };

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // 🔥 Lendo a resposta em streaming corretamente
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fullResponse += decoder.decode(value, { stream: true });
        }

        // 🔥 Extraindo a resposta do JSON retornado pelo Dify
        const responseData = JSON.parse(fullResponse);
        const botResponse = responseData.answer || "Erro ao processar resposta.";

        // 🔥 Armazena o conversation_id para manter o fluxo
        if (responseData.conversation_id) {
            conversationId = responseData.conversation_id;
        }

        return NextResponse.json({ response: botResponse });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
