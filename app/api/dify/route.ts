import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

let conversationId = uuidv4(); // 🔥 Gerando um conversation_id global temporário

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // 🔥 Garante que sempre há um conversation_id válido
        if (requestData.reset || !conversationId) {
            conversationId = uuidv4();
        }

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr", // Substitua pelo token correto
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {},
                query: requestData.query,
                response_mode: "streaming",
                user: "teste-123",
                conversation_id: conversationId // 🔥 Agora sempre enviamos um ID válido!
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json({ response: data.answer });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
