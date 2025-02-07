import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
    query: string;
    conversation_id?: string;
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = app-feeIgILXxX4GCEzRj8aORcYf
        
        // Verificação da API key
        if (!apiKey) {
            console.error("API Key não encontrada nas variáveis de ambiente");
            return NextResponse.json(
                { error: "Configuração do servidor incompleta" },
                { status: 500 }
            );
        }

        const requestData: ChatRequest = await req.json();
        
        if (!requestData.query) {
            return NextResponse.json(
                { error: "Parâmetro 'query' é obrigatório." },
                { status: 400 }
            );
        }

        const payload = {
            inputs: {},
            query: requestData.query,
            response_mode: "streaming",
            conversation_id: requestData.conversation_id || "",
            user: "user-123",
        };

        // Adiciona timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch("https://api.dify.ai/v1/chat-messages", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            // Log detalhado em caso de erro
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Resposta da API Dify:", {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers),
                    body: errorText,
                });

                return NextResponse.json(
                    { 
                        error: `Erro na API do Dify (${response.status}): ${errorText}`,
                        details: {
                            status: response.status,
                            statusText: response.statusText
                        }
                    },
                    { status: response.status }
                );
            }

            if (!response.body) {
                throw new Error("Response body está vazio");
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
                                const jsonData = JSON.parse(match[1]);
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

        } finally {
            clearTimeout(timeout);
        }

    } catch (error) {
        console.error("Erro completo:", error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : "Erro desconhecido",
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
