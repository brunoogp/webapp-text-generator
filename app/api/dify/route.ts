import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Armazena o ID da conversa para manter o contexto

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

        // 🔥 Processamento correto do streaming para evitar cortes e erros
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let finalResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // 🔥 Corrigindo o formato da resposta do Dify
            const matches = buffer.match(/data:\s*({.*?})/g);
            if (matches) {
                matches.forEach(match => {
                    try {
                        const jsonData = JSON.parse(match.replace("data: ", "").trim());
                        if (jsonData.answer) {
                            finalResponse += jsonData.answer + " ";
                        }
                        if (jsonData.conversation_id) {
                            conversationId = jsonData.conversation_id;
                        }
                    } catch (error) {
                        console.error("Erro ao processar JSON:", error);
                    }
                });

                buffer = ""; // Limpa o buffer para evitar duplicação
            }
        }

        // 🔥 Ajusta espaços e formata corretamente a resposta final
        const cleanedResponse = finalResponse.replace(/\s+/g, " ").trim();

        return NextResponse.json({ response: cleanedResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
