import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Mantém o ID da conversa para garantir continuidade

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();
        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

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

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // 🔥 Filtrando corretamente os dados no formato 'data: { ... }'
            const matches = buffer.match(/data:\s*({.*})/g);
            if (matches) {
                matches.forEach((jsonString) => {
                    try {
                        const jsonData = JSON.parse(jsonString.replace("data: ", ""));
                        if (jsonData.answer) {
                            fullResponse += jsonData.answer + " ";
                        }
                        if (jsonData.conversation_id) {
                            conversationId = jsonData.conversation_id;
                        }
                    } catch (error) {
                        console.error("Erro ao processar JSON:", error);
                    }
                });
                buffer = "";
            }
        }

        // 🔥 Tratamento Final: Corrige espaços e palavras cortadas
        fullResponse = fullResponse
            .replace(/\s{2,}/g, " ") // Remove múltiplos espaços
            .replace(/\s+\./g, ".")  // Remove espaços antes de pontos finais
            .replace(/\s+,/g, ",")   // Remove espaços antes de vírgulas
            .replace(/\s+\?/g, "?")  // Remove espaços antes de interrogações
            .replace(/\s+\!/g, "!")  // Remove espaços antes de exclamações
            .trim();                 // Remove espaços no início e no fim

        return NextResponse.json({ response: fullResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
