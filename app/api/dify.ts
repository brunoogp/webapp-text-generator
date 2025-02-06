export default async function handler(req, res) {
    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
        method: 'POST',
        headers: {
            'Authorization': 'app-1BRyFUQeh2Q1VmwgsJsLQRCr',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: "Oi, como você pode me ajudar?",
            response_mode: "blocking",
            user: "teste-123",
            inputs: {}
        })
    });

    const data = await response.json();
    res.status(200).json(data);
}
