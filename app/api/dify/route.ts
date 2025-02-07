import { NextRequest, NextResponse } from "next/server";

let conversationId = "";

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();
        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        if (requestData.conversation_id) {
            conversationId = requestData.conversation_id;
        }

        const payload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming",
            conversation_id: conversationId || "",
            user: "user-123",
        };

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

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = ""; // Buffer para acumular chunks parciais
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Decodifica o chunk atual e adiciona ao buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Processa todas as linhas completas no buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ""; // Mantém a última linha incompleta no buffer

            for (const line of lines) {
                if (line.trim().startsWith('data:')) {
                    try {
                        const jsonStr = line.replace(/^data:\s*/, '').trim();
                        if (jsonStr) {
                            const jsonData = JSON.parse(jsonStr);
                            if (jsonData.answer) {
                                fullResponse = fullResponse + jsonData.answer;
                            }
                            if (jsonData.conversation_id) {
                                conversationId = jsonData.conversation_id;
                            }
                        }
                    } catch (error) {
                        console.error("Erro ao processar JSON da resposta:", error);
                    }
                }
            }
        }

        // Processa qualquer dado restante no buffer
        if (buffer.trim()) {
            const match = buffer.match(/data:\s*({.*})/);
            if (match) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (jsonData.answer) {
                        fullResponse = fullResponse + jsonData.answer;
                    }
                } catch (error) {
                    console.error("Erro ao processar último chunk:", error);
                }
            }
        }

        return NextResponse.json({
            response: fullResponse.trim(),
            conversation_id: conversationId,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
