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
        let buffer = "";
        let fullResponse = "";
        let isFirstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim().startsWith('data:')) {
                    try {
                        const jsonStr = line.replace(/^data:\s*/, '').trim();
                        if (jsonStr) {
                            const jsonData = JSON.parse(jsonStr);
                            if (jsonData.answer) {
                                // Preserva quebras de linha e formatação markdown
                                const answer = jsonData.answer;
                                
                                // Se for o primeiro chunk, não precisamos adicionar espaço
                                if (isFirstChunk) {
                                    fullResponse = answer;
                                    isFirstChunk = false;
                                } else {
                                    // Verifica se precisamos adicionar espaço entre os chunks
                                    const needsSpace = !fullResponse.endsWith(' ') && 
                                                     !fullResponse.endsWith('\n') && 
                                                     !answer.startsWith(' ') && 
                                                     !answer.startsWith('\n');
                                    
                                    fullResponse += needsSpace ? ' ' + answer : answer;
                                }
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

        // Processa buffer final se necessário
        if (buffer.trim()) {
            const match = buffer.match(/data:\s*({.*})/);
            if (match) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (jsonData.answer) {
                        const needsSpace = !fullResponse.endsWith(' ') && 
                                         !fullResponse.endsWith('\n') && 
                                         !jsonData.answer.startsWith(' ') && 
                                         !jsonData.answer.startsWith('\n');
                        
                        fullResponse += needsSpace ? ' ' + jsonData.answer : jsonData.answer;
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
