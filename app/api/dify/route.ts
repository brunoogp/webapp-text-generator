import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
    query: string;
    conversation_id?: string;
}

interface DifyPayload {
    inputs: Record<string, unknown>;
    query: string;
    response_mode: "streaming";
    conversation_id: string;
    user: string;
}

interface DifyResponse {
    answer?: string;
    conversation_id?: string;
}

export async function POST(req: NextRequest) {
    try {
        const requestData: ChatRequest = await req.json();
        
        if (!requestData.query) {
            return NextResponse.json(
                { error: "Parâmetro 'query' é obrigatório." }, 
                { status: 400 }
            );
        }

        const payload: DifyPayload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming",
            conversation_id: requestData.conversation_id || "",
            user: "user-123",
        };

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.DIFY_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: `Erro na API do Dify: ${errorData.message || response.statusText}` },
                { status: response.status }
            );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";
        let currentConversationId = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    const match = line.match(/data:\s*({.*})/);
                    if (match) {
                        try {
                            const jsonData: DifyResponse = JSON.parse(match[1]);
                            if (jsonData.answer) {
                                fullResponse += jsonData.answer + " ";
                            }
                            if (jsonData.conversation_id) {
                                currentConversationId = jsonData.conversation_id;
                            }
                        } catch (error) {
                            console.error("Erro ao processar JSON da resposta:", error);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return NextResponse.json({
            response: fullResponse.trim(),
            conversation_id: currentConversationId,
        });
    } catch (error) {
        console.error("Erro no processamento da requisição:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erro desconhecido" },
            { status: 500 }
        );
    }
}
