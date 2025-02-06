import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const requestData = await req.json();

        if (!requestData.query) {
            return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 });
        }

        const response = await fetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr', // Substitua pelo token correto
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {},
                query: requestData.query,
                response_mode: "streaming",
                user: "teste-123"
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullResponse = "";

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                fullResponse += decoder.decode(value, { stream: true });
            }
        }

        // Extraindo apenas os campos "answer" corretamente
        const matches = fullResponse.match(/"answer":\s*"([^"]+)"/g);
        const cleanedResponse = matches
            ? matches.map(m => m.replace(/"answer":\s*"/, '').replace(/"$/, '')).join(' ')
            : 'Erro ao processar resposta.';

        // 🔥 Remove espaços extras entre as palavras e formata corretamente
        const formattedResponse = cleanedResponse.replace(/\s+/g, ' ').trim();

        return NextResponse.json({ response: formattedResponse });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
