import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🔥 Se reset for true, iniciamos uma nova conversa sem um conversation_id
        const body = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming",
            user: "teste-123",
        };

        // 🔥 Só adicionamos o conversation_id se não for um reset
        if (!requestData.reset && requestData.conversation_id) {
            body["conversation_id"] = requestData.conversation_id;
        }

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // Substitua pelo seu token do Dify
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // 🔥 Leitura correta da resposta streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value, { stream: true });
        }

        // 🔥 Extração da resposta correta
        const matches = fullResponse.match(/"answer":\s*"([^"]+)"/g);
        const cleanedResponse = matches
            ? matches.map(m => m.replace(/"answer":\s*"/, '').replace(/"$/, '')).join(' ')
            : 'Erro ao processar resposta.';

        // 🔥 Decodifica caracteres especiais corretamente
        const decodedResponse = JSON.parse(`{"text": "${cleanedResponse}"}`).text;

        return NextResponse.json({ response: decodedResponse });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
