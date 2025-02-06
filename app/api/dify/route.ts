import { NextRequest, NextResponse } from "next/server";

let conversationIds: { [key: string]: string } = {}; // Armazena IDs das conversas

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();
        const chatKey = requestData.chatKey || "default"; // Identifica a conversa ativa

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        let conversationId = conversationIds[chatKey];

        // Se for uma nova conversa ou não tiver ID salvo, criamos um novo ID no Dify
        if (requestData.reset || !conversationId) {
            console.log("🔄 Criando nova conversa no Dify...");

            const initResponse = await fetch("https://api.dify.ai/v1/conversations", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: `Conversa ${Date.now()}`,
                    user: `user-${chatKey}`
                }),
            });

            const initData = await initResponse.json();

            if (!initResponse.ok || !initData.id) {
                console.error("❌ Erro ao criar nova conversa:", initData);
                return NextResponse.json({ error: `Erro ao criar conversa: ${initData.message || "Falha desconhecida"}` }, { status: initResponse.status });
            }

            conversationId = initData.id; // Armazena o novo ID da conversa
            conversationIds[chatKey] = conversationId;
        }

        console.log("💬 Enviando mensagem para o Dify na conversa:", conversationId);

        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
                "Authorization": "Bearer SEU_TOKEN_DIFY",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: requestData.query,
                conversation_id: conversationId,
                response_mode: "streaming", // 🔥 Streaming ativo
                user: `user-${chatKey}`
            }),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json();
            console.error("❌ Erro na API do Dify:", errorData);
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        // 🔥 Tratamento correto do streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value, { stream: true });
        }

        console.log("✅ Resposta recebida do Dify:", fullResponse.trim());
        return NextResponse.json({ response: fullResponse.trim() });

    } catch (error) {
        console.error("🔥 Erro interno na API:", error);
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}
