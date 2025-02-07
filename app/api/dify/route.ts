import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Mantém o ID da conversa para contexto contínuo

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

        // 🔥 Processando a resposta corretamente
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let finalResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // 🔥 Captura JSON corretamente sem espaços quebrados
            const matches = buffer.match(/data:\s*({.*?})/g);
            if (matches) {
                matches.forEach(match => {
                    try {
                        const jsonData = JSON.parse(match.replace("data: ", "").trim());
                        if (jsonData.answer) {
                            finalResponse += jsonData.answer; // 🔥 Evita adicionar espaços extras
                        }
                        if (jsonData.conversation_id) {
                            conversationId = jsonData.conversation_id;
                        }
                    } catch (error) {
                        console.error("Erro ao processar JSON:", error);
                    }
                });

                buffer = ""; // 🔥 Limpa buffer após processar JSON corretamente
            }
        }

        // 🔥 Remove quebras desnecessárias e caracteres incorretos
        const cleanedResponse = finalResponse
            .replace(/\s+\./g, ".") // Evita espaço antes de ponto final
            .replace(/\s+,/g, ",")  // Evita espaço antes de vírgula
            .replace(/\s+/g, " ")   // Remove múltiplos espaços
            .trim();                // Remove espaços extras no começo e fim

        return NextResponse.json({ response: cleanedResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
