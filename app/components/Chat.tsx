"use client"; // Adicionado no topo para indicar que é um Client Component

import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Adiciona a mensagem do usuário no chat
    setMessages([...messages, { role: "user", content: input }]);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();

      // Adiciona a resposta da IA no chat
      setMessages((prev) => [...prev, { role: "bot", content: data.response }]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }

    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`p-2 my-1 rounded-lg ${msg.role === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-300 text-black self-start"}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="flex mt-2">
        <input
          type="text"
          className="flex-1 border p-2 rounded-l-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
        />
        <button className="bg-blue-500 text-white px-4 rounded-r-lg" onClick={sendMessage}>
          Enviar
        </button>
      </div>
    </div>
  );
}
