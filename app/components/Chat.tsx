import { useState } from "react";

export default function Chat() {
    const [messages, setMessages] = useState([
        { role: "bot", content: "Olá! Como posso te ajudar hoje?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user", content: input }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/dify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input })
            });
            
            if (!response.ok) throw new Error("Erro na API");
            
            const data = await response.json();
            setMessages([...newMessages, { role: "bot", content: data.response }]);
        } catch (error) {
            setMessages([...newMessages, { role: "bot", content: "Erro ao obter resposta." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-white shadow-lg rounded-lg p-4 flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto mb-4 p-2 border rounded">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-2 p-2 rounded-lg text-sm ${msg.role === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-black self-start"}`}>
                        {msg.content}
                    </div>
                ))}
                {loading && <div className="text-gray-500">Digitando...</div>}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 p-2 border rounded"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                />
                <button
                    className="bg-blue-600 text-white p-2 rounded"
                    onClick={sendMessage}
                    disabled={loading}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}
