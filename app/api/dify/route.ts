import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // 🔥 Mantém o ID da conversa

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();
        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // Define o corpo da requisição, mantendo o contexto da conversa
        const payload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming", // 🔥 Usa modo de resposta streaming
            conversation_id: conversationId || "", // 🔥 Reaproveita o ID da conversa
            user: "user-123",
        };

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // 🔥 Substitua pelo token correto
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // 🔥 Lendo a resposta corretamente do streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = ""; // 🔥 Armazena os dados brutos antes de montar a resposta final
        let finalResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // 🔥 Corrige palavras fragmentadas
            const match = buffer.match(/data:\s*(\{.*\})/g);
            if (match) {
                match.forEach((jsonString) => {
                    try {
                        const jsonData = JSON.parse(jsonString.replace("data: ", ""));
                        if (jsonData.answer) {
                            finalResponse += jsonData.answer + " ";
                        }
                        if (jsonData.conversation_id) {
                            conversationId = jsonData.conversation_id; // 🔥 Mantém o ID para continuidade
                        }
                    } catch (error) {
                        console.error("Erro ao processar JSON:", error);
                    }
                });
                buffer = ""; // 🔥 Limpa o buffer após processar os dados corretamente
            }
        }

        // 🔥 Remove espaçamentos errados e une palavras corretamente
        finalResponse = finalResponse
            .replace(/\s+\./g, ".") // Remove espaços antes de pontos finais
            .replace(/\s+,/g, ",")  // Remove espaços antes de vírgulas
            .replace(/\s+/g, " ")   // Substitui múltiplos espaços por um único espaço
            .trim();                // Remove espaços no início e no fim

        return NextResponse.json({ response: finalResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
