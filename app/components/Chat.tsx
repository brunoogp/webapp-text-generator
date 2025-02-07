"use client";

import { useState } from "react";
import { Menu, PlusCircle, Send } from "lucide-react";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(["Conversa 1"]);
  const [activeChat, setActiveChat] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ✅ Função para limpar espaços extras e corrigir espaçamentos errados
  const cleanText = (text: string) => {
    return text
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          conversation_id: conversationId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Erro da API:", data.error);
        return;
      }

      const cleanedResponse = cleanText(data.response);
      setMessages([...newMessages, { role: "bot", content: cleanedResponse }]);

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      {/* Menu Lateral */}
      <aside className="w-72 bg-gray-900 p-4 flex flex-col border-r border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-300">Axys™</h2>
          <Menu size={24} className="cursor-pointer text-gray-400" />
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500 transition"
          onClick={() => {
            setActiveChat(history.length);
            setHistory([...history, `Conversa ${history.length + 1}`]);
            setMessages([]);
            setConversationId(null);
          }}
        >
          <PlusCircle size={18} /> Nova conversa
        </button>
        <div className="mt-4 flex-1 overflow-y-auto space-y-2">
          {history.map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg cursor-pointer transition ${
                activeChat === index
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
              onClick={() => {
                setActiveChat(index);
                setMessages([]);
                setConversationId(null);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </aside>

      {/* Área do Chat */}
      <div className="flex flex-col flex-1 h-screen">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-950 border-l border-gray-800">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-lg border ${
                msg.role === "user"
                  ? "bg-blue-600 text-white self-end ml-auto border-blue-400"
                  : "bg-gray-800 text-gray-300 self-start border-gray-700"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="p-3 bg-gray-700 text-white rounded-lg max-w-lg self-start">
              Digitando...
            </div>
          )}
        </div>

        {/* Campo de Entrada */}
        <div className="p-4 bg-gray-900 flex w-full border-t border-gray-800">
          <input
            type="text"
            className="flex-1 bg-gray-800 text-white p-3 rounded-lg focus:outline-none placeholder-gray-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
          />
          <button
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition flex items-center gap-2"
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
