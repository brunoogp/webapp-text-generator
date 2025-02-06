import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// 🔥 Armazena temporariamente os conversation_id
const userConversations: { [key: string]: string } = {};

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🔥 Identificação do usuário (idealmente, use um ID real de usuário autenticado)
        const userId = "teste-123"; 

        // 🔥 Se reset for true ou o usuário não tem uma conversa ativa, cria um novo ID
        if (requestData.reset || !userConversations[userId]) {
            userConversations[userId] = uuidv4();
        }

        const conversationId = userConversations[userId]; // Mantém o mesmo ID para continuidade

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // 🔥 Substituir pelo token correto
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {},
                query: requestData.query,
                response_mode: "streaming", // ✅ Corrigido para "streaming"
                user: userId,
                conversation_id: conversationId 
            })
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // 🔥 Leitura do streaming de resposta corretamente
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value, { stream: true });
        }

        // 🔥 Extrair apenas o conteúdo relevante da resposta
        const matches = fullResponse.match(/"answer":\s*"([^"]+)"/g);
        const cleanedResponse = matches
            ? matches.map(m => m.replace(/"answer":\s*"/, '').replace(/"$/, '')).join(' ')
            : 'Erro ao processar resposta.';

        // 🔥 Corrige caracteres especiais na resposta
        const decodedResponse = JSON.parse(`{"text": "${cleanedResponse}"}`).text;

        return NextResponse.json({ response: decodedResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
