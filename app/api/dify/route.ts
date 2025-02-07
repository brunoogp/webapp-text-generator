import { NextRequest, NextResponse } from "next/server";

let conversationId = ""; // ✅ Mantém o contexto da conversa

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

        // ✅ Lendo a resposta completa corretamente
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = ""; // 🔥 Armazena toda a resposta antes de processar
        let finalResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
        }

        // 🔥 Processando os blocos corretamente para evitar palavras truncadas
        const matches = buffer.match(/data:\s*({.*?})/g);
        if (matches) {
            matches.forEach(match => {
                try {
                    const jsonData = JSON.parse(match.replace("data: ", "").trim());
                    if (jsonData.answer) {
                        finalResponse += jsonData.answer + " "; // ✅ Adiciona espaço corretamente entre as palavras
                    }
                    if (jsonData.conversation_id) {
                        conversationId = jsonData.conversation_id; // 🔥 Mantém o ID da conversa para continuidade
                    }
                } catch (error) {
                    console.error("Erro ao processar JSON:", error);
                }
            });
        }

        // 🔥 Limpeza final do texto para evitar erros de formatação
        const cleanedResponse = finalResponse
            .replace(/\s+\./g, ".")  // Evita espaço antes de ponto final
            .replace(/\s+,/g, ",")   // Evita espaço antes de vírgula
            .replace(/\s+/g, " ")    // Remove múltiplos espaços seguidos
            .trim();                 // Remove espaços no início e fim

        return NextResponse.json({ response: cleanedResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
