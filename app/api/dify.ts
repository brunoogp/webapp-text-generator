export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': 'app-1BRyFUQeh2Q1VmwgsJsLQRCr', // Substitua pela sua chave do Dify
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},
        query: req.body.query || 'Olá, você está funcionando?',
        response_mode: 'blocking',
        user: req.body.user || 'teste-vercel'
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao conectar ao Dify', details: error.message });
  }
}
