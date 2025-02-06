import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const response = await fetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer app-1BRyFUQeh2Q1VmwgsJsLQRCr',  // 🔴 Substitua pelo seu token correto!
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: "Oi, como você pode me ajudar?",
                response_mode: "blocking",
                user: "teste-123",
                inputs: {}
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API do Dify: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
