"use client";

import { useState } from "react";
import { Menu, PlusCircle, Send, Clipboard, Moon, Sun } from "lucide-react";

export default function Chat() {
  const [conversations, setConversations] = useState([
    { id: 0, title: "Conversa 1", messages: [] },
  ]);
  const [activeChat, setActiveChat] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const cleanText = (text) => {
    return text.replace(/\s+\./g, ".").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const updatedConversations = [...conversations];
    updatedConversations[activeChat].messages.push({ role: "user", content: input });
    setConversations(updatedConversations);
    setLoading(true);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Erro da API:", data.error);
        return;
      }

      const cleanedResponse = cleanText(data.response);
      updatedConversations[activeChat].messages.push({ role: "bot", content: cleanedResponse });
      setConversations([...updatedConversations]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }

    setInput("");
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência!");
  };

  return (
    <div className={`flex h-screen w-screen ${isDarkMode ? "bg-[#0D0D0D] text-[#EAEAEA]" : "bg-[#F5F5F5] text-[#1A1A1A]"}`}>
      <aside className={`w-64 p-4 flex flex-col ${isDarkMode ? "bg-[#1A1A1A]" : "bg-[#E0E0E0]"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Axys™</h2>
          <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-[#2A2A2A] rounded-full">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Menu size={24} className="cursor-pointer" />
          </div>
        </div>

        <button
          className="flex items-center gap-2 bg-[#2A2A2A] text-white py-2 px-4 rounded-lg hover:bg-[#3A3A3A] transition"
          onClick={() => {
            setConversations([...conversations, { id: conversations.length, title: `Conversa ${conversations.length + 1}`, messages: [] }]);
            setActiveChat(conversations.length);
          }}
        >
          <PlusCircle size={18} /> Nova conversa
        </button>

        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {conversations.map((conv, index) => (
            <div
              key={conv.id}
              className={`p-2 rounded-lg cursor-pointer transition ${activeChat === index ? "bg-[#3A3A3A] text-white" : "bg-[#2A2A2A] hover:bg-[#3A3A3A]"}`}
              onClick={() => setActiveChat(index)}
            >
              {conv.title}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-col flex-1 h-screen">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversations[activeChat].messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-lg relative ${msg.role === "user" ? "bg-[#4F4F4F] text-white self-end ml-auto" : "bg-[#2A2A2A] text-white self-start"}`}
            >
              {msg.content}
              {msg.role === "bot" && (
                <button className="absolute top-1 right-2 text-gray-300 hover:text-white transition" onClick={() => copyToClipboard(msg.content)}>
                  <Clipboard size={16} />
                </button>
              )}
            </div>
          ))}
          {loading && <div className="p-3 bg-[#2A2A2A] text-white rounded-lg max-w-lg self-start">Digitando...</div>}
        </div>

        <div className={`p-4 flex w-full ${isDarkMode ? "bg-[#1A1A1A]" : "bg-[#D0D0D0]"}`}>
          <input
            type="text"
            className={`flex-1 p-3 rounded-lg focus:outline-none ${isDarkMode ? "bg-[#2A2A2A] text-white" : "bg-[#EAEAEA] text-black"}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Digite sua mensagem..."
          />
          <button
            className="ml-2 bg-[#4F4F4F] text-white px-4 py-2 rounded-lg hover:bg-[#5F5F5F] transition flex items-center gap-2"
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
