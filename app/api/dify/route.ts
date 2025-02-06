import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";  // ✅ Importando gerador de UUID válido

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // ✅ Gera um UUID v4 válido se não houver um ID de conversa já enviado
        const conversationId = requestData.conversation_id || uuidv4();

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // 🔥 Substitua pelo token correto
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {}, 
                query: requestData.query,
                response_mode: "streaming",
                user: "teste-123",
                conversation_id: conversationId  // ✅ Agora com um UUID válido
            })
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // ✅ Lidando com a resposta em streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value, { stream: true });
        }

        // ✅ Extraindo apenas a resposta correta
        const matches = fullResponse.match(/"answer":\s*"([^"]+)"/g);
        const cleanedResponse = matches
            ? matches.map(m => m.replace(/"answer":\s*"/, '').replace(/"$/, '')).join(' ')
            : 'Erro ao processar resposta.';

        // Decodifica corretamente caracteres especiais
        const decodedResponse = JSON.parse(`{"text": "${cleanedResponse}"}`).text;

        return NextResponse.json({ response: decodedResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
