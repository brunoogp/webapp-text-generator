export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: "Query não fornecida" });
        }

        const response = await fetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer SEU_TOKEN_AQUI', // Substituir pelo token correto
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                response_mode: "streaming", // Alterado para streaming, pois blocking não é suportado
                user: "teste-123",
                inputs: {}
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API do Dify: ${response.statusText}`);
        }

        // Lendo a resposta corretamente
        const reader = response.body.getReader();
        let result = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += new TextDecoder("utf-8").decode(value);
        }

        res.status(200).json({ response: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
