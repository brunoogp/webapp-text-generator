import { NextRequest, NextResponse } from "next/server";

let conversationId: string | null = null; // 🔥 Armazena o ID da conversa para continuidade

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🔥 Resetar conversa se for solicitado
        if (requestData.reset) {
            conversationId = null;
        }

        // 🚀 Montando o payload da requisição para Dify
        const payload: any = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming", // ✅ Mantendo streaming para evitar blocking mode
            user: "user-123",
        };

        // ✅ Se já tivermos um `conversationId`, adicionamos ao payload para manter o histórico
        if (conversationId) {
            payload.conversation_id = conversationId;
        }

        // 🔥 Fazendo a requisição para o Dify
        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // ⚠️ Substitua pelo seu token correto!
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // 🔥 Processando a resposta em STREAMING
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fullResponse += decoder.decode(value, { stream: true });
        }

        // 🔥 Extraindo a resposta do formato correto da API do Dify
        const responseParts = fullResponse.split("\n").filter(line => line.trim().startsWith("data: "));
        let finalResponse = "";

        responseParts.forEach(part => {
            try {
                const jsonPart = JSON.parse(part.replace("data: ", "").trim());
                if (jsonPart.answer) {
                    finalResponse += jsonPart.answer + " ";
                }
            } catch (e) {
                console.error("Erro ao processar parte da resposta:", e);
            }
        });

        // ✅ Armazena o `conversation_id` para continuidade da conversa
        const responseData = JSON.parse(fullResponse);
        if (responseData.conversation_id) {
            conversationId = responseData.conversation_id;
        }

        return NextResponse.json({
            response: finalResponse.trim() || "Erro ao processar resposta.",
            conversation_id,
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
