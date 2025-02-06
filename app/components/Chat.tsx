"use client";

import { useState } from "react";
import { Menu, PlusCircle, Send } from "lucide-react";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(["Conversa 1"]);
  const [activeChat, setActiveChat] = useState(0);
  const [conversationIds, setConversationIds] = useState<{ [key: number]: string }>({});

  // 🔥 Criar Nova Conversa
  const startNewConversation = async () => {
    setLoading(true);
    setMessages([]); // Limpa a tela atual

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "Iniciar nova conversa", reset: true })
      });

      const data = await response.json();

      const newChatIndex = history.length;
      setHistory([...history, `Conversa ${newChatIndex + 1}`]); // Adiciona a nova conversa no menu
      setActiveChat(newChatIndex);
      setConversationIds({ ...conversationIds, [newChatIndex]: data.conversation_id }); // Salva o ID da conversa
      setMessages([{ role: "bot", content: data.response }]); // Exibe a resposta inicial

    } catch (error) {
      console.error("Erro ao iniciar nova conversa:", error);
    }

    setLoading(false);
  };

  // ✉️ Enviar Mensagem
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const conversationId = conversationIds[activeChat]; // Obtém o ID da conversa ativa

      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: input,
          conversation_id: conversationId // 🔥 Mantém o contexto da conversa correta
        }),
      });

      const data = await response.json();
      setMessages([...newMessages, { role: "bot", content: data.response }]);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      {/* Menu Lateral */}
      <aside className="w-64 bg-gray-900 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Axys™</h2>
          <Menu size={24} className="cursor-pointer" />
        </div>
        <button
          className="flex items-center gap-2 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          onClick={startNewConversation} // 🔥 Agora cria uma nova conversa corretamente
        >
          <PlusCircle size={18} /> Nova conversa
        </button>
        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {history.map((item, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg cursor-pointer transition ${
                activeChat === index ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
              }`}
              onClick={() => {
                setActiveChat(index);
                setMessages([]); // Limpa a tela, mas mantém a conversa no Dify
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </aside>

      {/* Área do Chat */}
      <div className="flex flex-col flex-1 h-screen">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
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
        <div className="p-4 bg-gray-900 flex w-full">
          <input
            type="text"
            className="flex-1 bg-gray-800 text-white p-3 rounded-lg focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
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
