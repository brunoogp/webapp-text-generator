"use client";

import { useState } from "react";
import { Menu, PlusCircle, Send } from "lucide-react";

export default function Chat() {
  const [conversations, setConversations] = useState([
    { id: 1, title: "Conversa 1", messages: [] },
  ]);
  const [activeConversation, setActiveConversation] = useState(1);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    const newConversations = conversations.map((conv) =>
      conv.id === activeConversation
        ? {
            ...conv,
            messages: [...conv.messages, { role: "user", content: input }],
          }
        : conv
    );
    setConversations(newConversations);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === activeConversation
            ? {
                ...conv,
                messages: [...conv.messages, { role: "bot", content: data.response }],
              }
            : conv
        )
      );
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }

    setInput("");
    setLoading(false);
  };

  const newChat = () => {
    const newId = conversations.length + 1;
    setConversations([...conversations, { id: newId, title: `Conversa ${newId}`, messages: [] }]);
    setActiveConversation(newId);
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Menu Lateral */}
      <aside className="w-64 bg-gray-900 p-4 flex flex-col border-r border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Axys™</h2>
          <Menu size={24} className="cursor-pointer" />
        </div>
        <button
          className="flex items-center gap-2 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
          onClick={newChat}
        >
          <PlusCircle size={18} /> Nova conversa
        </button>
        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-2 rounded-lg cursor-pointer transition ${
                activeConversation === conv.id ? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
              onClick={() => setActiveConversation(conv.id)}
            >
              {conv.title}
            </div>
          ))}
        </div>
      </aside>

      {/* Área do Chat */}
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversations.find((conv) => conv.id === activeConversation)?.messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-lg ${
                msg.role === "user" ? "bg-blue-500 text-white self-end ml-auto" : "bg-gray-700 text-white self-start"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && <div className="p-3 bg-gray-700 text-white rounded-lg max-w-lg self-start">Digitando...</div>}
        </div>

        {/* Campo de Entrada */}
        <div className="p-4 bg-gray-900 flex border-t border-gray-700">
          <input
            type="text"
            className="flex-1 bg-gray-800 text-white p-3 rounded-lg focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? "Enviando..." : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
