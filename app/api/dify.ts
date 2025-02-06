export default async function handler(req, res) {
    try {
        const response = await fetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': 'app-1BRyFUQeh2Q1VmwgsJsLQRCr',  // 🔴 Substitua pelo seu token correto
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
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
