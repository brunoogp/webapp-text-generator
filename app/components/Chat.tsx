"use client";

import { useState, useEffect, useRef } from "react";
import { PlusCircle, Send, Clipboard, Moon, Sun, Menu, Trash2 } from "lucide-react";

const CustomAlert = ({ message }) => (
  <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
    {message}
  </div>
);

export default function Chat() {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("conversations");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const cleanText = (text) => text.replace(/\s+\./g, ".").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || activeChat === null) return;

    const updatedConversations = [...conversations];
    updatedConversations[activeChat].messages.push({
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    });
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
      updatedConversations[activeChat].messages.push({
        role: "bot",
        content: cleanedResponse,
        timestamp: new Date().toISOString()
      });
      setConversations([...updatedConversations]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }

    setInput("");
    setLoading(false);
  };

  const createNewConversation = () => {
    const newId = conversations.length;
    setConversations([...conversations, { id: newId, messages: [] }]);
    setActiveChat(newId);
  };

  const deleteConversation = (id) => {
    const filteredConversations = conversations.filter((conv) => conv.id !== id);
    setConversations(filteredConversations);
    setActiveChat(filteredConversations.length > 0 ? 0 : null);
  };

  return (
    <div className={`flex h-screen w-screen ${isDarkMode ? "bg-[#181818] text-white" : "bg-gray-50 text-gray-900"}`}>
      <aside className={`w-72 p-4 flex flex-col border-r ${isDarkMode ? "bg-[#141414] border-gray-800" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Axys™</h2>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full transition-colors">
            <Menu size={20} />
          </button>
        </div>
        {isMenuOpen && (
          <button
            className={`mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg transition-colors ${isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
            onClick={createNewConversation}
          >
            <PlusCircle size={18} /> Nova conversa
          </button>
        )}
      </aside>
      <div className="flex flex-col flex-1 h-screen relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeChat !== null && conversations[activeChat]?.messages?.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-4 rounded-lg max-w-2xl relative group ${msg.role === "user" ? (isDarkMode ? "bg-blue-600" : "bg-blue-500 text-white") : (isDarkMode ? "bg-gray-800" : "bg-gray-100")}`}>
                <p className="mb-1">{msg.content}</p>
                <div className="text-xs opacity-60 mt-2">{new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className={`p-4 border-t ${isDarkMode ? "border-gray-800 bg-[#141414]" : "border-gray-200 bg-white"}`}>
          <div className="max-w-4xl mx-auto flex gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className={`flex-1 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 ${isDarkMode ? "bg-gray-800 focus:ring-blue-600" : "bg-gray-100 focus:ring-blue-500"}`}
              rows={1}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} className={`p-3 rounded-lg transition-colors flex items-center justify-center ${loading ? "opacity-50 cursor-not-allowed" : isDarkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"}`}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
