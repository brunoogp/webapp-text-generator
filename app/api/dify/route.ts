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
            response_mode: "streaming", // 🔥 Mantém o modo streaming
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

        // 🔥 Processa a resposta corretamente para evitar palavras cortadas
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = ""; // 🔥 Armazena os dados brutos antes de montar a resposta final
        let finalResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // 🔥 Filtrando corretamente os dados no formato `data: {...}`
            let match;
            while ((match = buffer.match(/data:\s*({.*})/))) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (jsonData.answer) {
                        finalResponse += jsonData.answer + " ";
                    }
                    if (jsonData.conversation_id) {
                        conversationId = jsonData.conversation_id; // 🔥 Salva o ID da conversa
                    }
                } catch (error) {
                    console.error("Erro ao processar JSON da resposta:", error);
                }

                // Remove o bloco processado do buffer para evitar processamento duplicado
                buffer = buffer.replace(match[0], "").trim();
            }
        }

        // 🔥 Remove quebras de linha, espaços extras e palavras cortadas
        finalResponse = finalResponse.replace(/\s+/g, " ").trim();

        return NextResponse.json({ response: finalResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
