import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Mantém o ID da conversa

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        const payload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming", // 🔥 Garante resposta contínua
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

        // 🔥 Lendo a resposta completa antes de processar
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let finalResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let match;
            while ((match = buffer.match(/data:\s*({.*})/))) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (jsonData.answer) {
                        finalResponse += jsonData.answer + " ";
                    }
                    if (jsonData.conversation_id) {
                        conversationId = jsonData.conversation_id;
                    }
                } catch (error) {
                    console.error("Erro ao processar JSON da resposta:", error);
                }

                buffer = buffer.replace(match[0], "").trim();
            }
        }

        // 🔥 Corrige palavras separadas, remove espaços antes de pontuação
        finalResponse = finalResponse.replace(/\s([.,!?;])/g, "$1"); // Remove espaços antes de pontuação
        finalResponse = finalResponse.replace(/\s+/g, " "); // Remove espaços duplos
        finalResponse = finalResponse.trim();

        return NextResponse.json({ response: finalResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
