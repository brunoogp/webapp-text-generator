import { NextRequest, NextResponse } from "next/server";

let conversationId: string | null = null; // 🔥 Inicializa corretamente

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🚀 Se `reset` for true, inicia uma nova conversa e define `conversationId` como `null`
        if (requestData.reset) {
            conversationId = null;
        }

        // 🔥 Monta o payload da requisição para o Dify
        const payload: any = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming", // ✅ Agora está correto
            user: "user-123",
        };

        // 🔥 Se já tivermos um conversationId, adicionamos ao payload para manter o contexto
        if (conversationId) {
            payload.conversation_id = conversationId;
        }

        // 🚀 Fazendo a requisição para o Dify
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

        // 🔥 Processando a resposta em STREAMING
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fullResponse += decoder.decode(value, { stream: true });
        }

        // 🔥 Extraindo apenas a resposta relevante da stream
        const matches = fullResponse.match(/"answer":\s*"([^"]+)"/g);
        const cleanedResponse = matches
            ? matches.map(m => m.replace(/"answer":\s*"/, '').replace(/"$/, '')).join(' ')
            : 'Erro ao processar resposta.';

        // ✅ Armazena o `conversation_id` para continuidade da conversa
        const responseData = JSON.parse(fullResponse);
        if (responseData.conversation_id) {
            conversationId = responseData.conversation_id;
        }

        return NextResponse.json({ 
            response: cleanedResponse || "Erro ao obter resposta.", 
            conversation_id 
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
