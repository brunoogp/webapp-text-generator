import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Mantém a continuidade da conversa

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
            conversation_id: conversationId || "",
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
        let finalResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // 🔥 O Dify retorna dados no formato `data: {...}`, precisamos extrair só o JSON
            const match = chunk.match(/data:\s*({.*})/);
            if (match) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (jsonData.answer) {
                        finalResponse += jsonData.answer + " ";
                    }
                    if (jsonData.conversation_id) {
                        conversationId = jsonData.conversation_id; // 🔥 Salva o ID da conversa para continuidade
                    }
                } catch (error) {
                    console.error("Erro ao processar JSON da resposta:", error);
                }
            }
        }

        // 🔥 Melhorando a formatação da resposta
        finalResponse = finalResponse
            .replace(/\s{2,}/g, " ") // Remove múltiplos espaços
            .replace(/\s([\.,!?:])/g, "$1") // Remove espaços antes de pontuação
            .trim();

        return NextResponse.json({ response: finalResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
