import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// 🔥 Criamos um objeto para armazenar os conversation_id por usuário (simples solução em memória)
const userConversations: { [key: string]: string } = {};

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🔥 Definir um user_id temporário (idealmente, isso viria do seu sistema de autenticação)
        const userId = "teste-123"; 

        // 🔥 Se reset for true ou o usuário não tem uma conversa ativa, criamos um novo ID
        if (requestData.reset || !userConversations[userId]) {
            userConversations[userId] = uuidv4();
        }

        const conversationId = userConversations[userId]; // Pegamos o conversation_id salvo

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // 🔥 Substitua pelo token correto
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {},
                query: requestData.query,
                response_mode: "blocking",
                user: userId,
                conversation_id: conversationId // 🔥 Sempre enviamos um conversation_id válido!
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json({ response: data.answer, conversation_id: conversationId });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
