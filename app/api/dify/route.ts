import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Salva o ID da conversa globalmente

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🚀 Se um conversation_id for passado, reutiliza. Se for reset, cria um novo.
        if (requestData.reset) {
            conversationId = "";
        }

        const payload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming",
            conversation_id: conversationId || "", // Mantém a conversa
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

        // 🔥 Processando streaming corretamente
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";
        let newConversationId = conversationId; // Inicialmente mantém o ID existente

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // 🔥 Extraindo JSON corretamente da resposta em streaming
            const match = chunk.match(/data:\s*({.*})/);
            if (match) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (jsonData.answer) {
                        fullResponse += jsonData.answer + " ";
                    }
                    if (jsonData.conversation_id) {
                        newConversationId = jsonData.conversation_id; // Atualiza o ID da conversa
                    }
                } catch (error) {
                    console.error("Erro ao processar JSON da resposta:", error);
                }
            }
        }

        // 🔥 Atualiza o conversation_id para manter o histórico
        conversationId = newConversationId;

        // 🔥 Limpando o texto para evitar palavras cortadas e espaçamentos errados
        fullResponse = fullResponse
            .replace(/\s{2,}/g, " ") // Remove espaços duplos
            .replace(/\s([\.,!?:])/g, "$1") // Remove espaços antes de pontuação
            .trim();

        return NextResponse.json({ response: fullResponse, conversation_id });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
