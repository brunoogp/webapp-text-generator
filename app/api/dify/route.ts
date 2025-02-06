import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// 🔥 Armazena os conversation_id por usuário
const userConversations: { [key: string]: string } = {};

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🔥 ID de usuário (idealmente, use um ID real do usuário autenticado)
        const userId = "teste-123";

        // 🔥 Se `reset` for true, criar uma nova conversa
        if (requestData.reset) {
            const newConversationResponse = await fetch("https://api.dify.ai/v1/conversations", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer SEU_TOKEN_AQUI", // 🔥 Substituir pelo token correto
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user: userId,
                })
            });

            const newConversationData = await newConversationResponse.json();

            if (!newConversationResponse.ok) {
                return NextResponse.json({ error: `Erro ao criar nova conversa: ${newConversationData.message || newConversationResponse.statusText}` }, { status: newConversationResponse.status });
            }

            // 🔥 Salva o novo `conversation_id`
            userConversations[userId] = newConversationData.id;
        }

        // 🔥 Recupera o `conversation_id` armazenado
        const conversationId = userConversations[userId];

        if (!conversationId) {
            return NextResponse.json({ error: "Erro ao obter conversation_id." }, { status: 500 });
        }

        // 🔥 Enviar mensagem com o conversation_id
        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // 🔥 Substituir pelo token correto
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {},
                query: requestData.query,
                response_mode: "streaming",
                user: userId,
                conversation_id: conversationId
            })
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

        return NextResponse.json({ response: decodedResponse, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
