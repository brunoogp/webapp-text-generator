import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json(); // Captura os dados da requisição

        // Verifica se a query foi enviada corretamente
        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        const response = await fetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr',  // 🔴 Substitua pelo token correto!
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {},  
                query: requestData.query,
                response_mode: "streaming",  // ✅ Alterado para STREAMING
                user: "teste-123"
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let result = "";

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                result += decoder.decode(value, { stream: true });
            }
        }

        return NextResponse.json({ response: result });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
