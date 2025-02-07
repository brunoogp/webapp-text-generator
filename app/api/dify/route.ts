import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Mantém o ID da conversa para continuidade

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // Se o frontend enviar um conversation_id, utilizamos ele
        if (requestData.conversation_id) {
            conversationId = requestData.conversation_id;
        }

        const payload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming", // 🔥 Mantém o modo streaming
            conversation_id: conversationId || "", // 🔥 Mantém a conversa ativa
            user: "user-123",
        };

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // 🔥 Troque pelo seu token real
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // 🔥 Processando a resposta em streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // 🔥 Extraindo corretamente os dados JSON da resposta do streaming
            const match = chunk.match(/data:\s*({.*})/);
            if (match) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (jsonData.answer) {
                        fullResponse += jsonData.answer + " ";
                    }
                    if (jsonData.conversation_id) {
                        conversationId = jsonData.conversation_id; // 🔥 Atualiza o ID da conversa
                    }
                } catch (error) {
                    console.error("Erro ao processar JSON da resposta:", error);
                }
            }
        }

        return NextResponse.json({
            response: fullResponse.trim(),
            conversation_id: conversationId, // 🔥 Retornamos o ID da conversa para o frontend armazenar
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
