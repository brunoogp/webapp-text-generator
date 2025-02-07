import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();
        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        // Gerar conversation_id único por usuário
        const userIdentifier = requestData.user_id || "default_user";
        const conversationId = requestData.conversation_id 
            ? `${userIdentifier}_${requestData.conversation_id}` 
            : `${userIdentifier}_${Date.now()}`;

        const payload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming",
            conversation_id: conversationId,
            user: userIdentifier,
        };

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        // Restante do código permanece idêntico ao original
        // ... (todo o código de processamento de streaming)

        return NextResponse.json({
            response: fullResponse,
            conversation_id: conversationId,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
