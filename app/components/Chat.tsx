"use client";

import { useState } from "react";
import { Menu, PlusCircle, Send } from "lucide-react";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(["Conversa 1"]);
  const [activeChat, setActiveChat] = useState("Conversa 1");
  const [chats, setChats] = useState<{ [key: string]: { role: string; content: string }[] }>({ "Conversa 1": [] });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...(chats[activeChat] || []), { role: "user", content: input }];
    setChats({ ...chats, [activeChat]: newMessages });
    setLoading(true);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();

      setChats({ ...chats, [activeChat]: [...newMessages, { role: "bot", content: data.response }] });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }

    setInput("");
    setLoading(false);
  };

  const createNewChat = () => {
    const newChatName = `Conversa ${history.length + 1}`;
    setHistory([...history, newChatName]);
    setActiveChat(newChatName);
    setChats({ ...chats, [newChatName]: [] });
  };

  return (
    <div className="flex h-screen bg-[#1E1E1E] text-white">
      {/* Menu Lateral */}
      <aside className="w-72 bg-[#2A2A2A] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Axys™</h2>
          <Menu size={24} className="cursor-pointer" />
        </div>
        <button
          className="flex items-center gap-2 bg-[#404040] text-white py-2 px-4 rounded-lg hover:bg-[#505050] transition"
          onClick={createNewChat}
        >
          <PlusCircle size={18} /> Nova conversa
        </button>
        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {history.map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg cursor-pointer ${
                activeChat === item ? "bg-[#7F7F7F] text-black" : "bg-[#404040] hover:bg-[#505050]"
              }`}
              onClick={() => setActiveChat(item)}
            >
              {item}
            </div>
          ))}
        </div>
      </aside>

      {/* Área do Chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#000000]">
          {(chats[activeChat] || []).map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-lg ${
                msg.role === "user" ? "bg-blue-500 text-white self-end ml-auto" : "bg-[#404040] text-white self-start"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && <div className="p-3 bg-[#404040] text-white rounded-lg max-w-lg self-start">Digitando...</div>}
        </div>

        {/* Campo de Entrada */}
        <div className="p-4 bg-[#2A2A2A] flex">
          <input
            type="text"
            className="flex-1 bg-[#404040] text-white p-3 rounded-lg focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
