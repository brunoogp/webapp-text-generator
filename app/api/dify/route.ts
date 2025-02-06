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
                response_mode: "blocking",
                user: "teste-123"
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: `Erro na API do Dify: ${errorData.message || response.statusText}` }, { status: response.status });
        }

        const data = await response.json();

        // 🔥 Extraindo resposta limpa da chave "response"
        let cleanedResponse = data.response || '';

        // 🔥 Normaliza caracteres Unicode, remove espaços extras e ajusta formatação
        const formattedResponse = cleanedResponse
            .normalize("NFC")  // Corrige problemas de encoding
            .replace(/\s+/g, ' ') // Remove espaços duplicados
            .trim(); // Remove espaços no início e fim

        return NextResponse.json({ response: formattedResponse });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
