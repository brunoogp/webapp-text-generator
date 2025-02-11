"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, PlusCircle, Send, Clipboard, Trash2, Edit, Moon, Sun, ExternalLink, MessageSquare } from "lucide-react";

// Componente de alerta personalizado
const CustomAlert = ({ message }) => (
  <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
    {message}
  </div>
);

export default function Chat() {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("conversations");
    return saved ? JSON.parse(saved) : [
      { id: 0, title: "Nova conversa", messages: [] }
    ];
  });
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const messagesEndRef = useRef(null);

  // Persistência das conversas
  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const cleanText = (text) => {
    return text.replace(/\s+\./g, ".").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
  };

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

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };

  const deleteConversation = (id) => {
    if (conversations.length === 1) {
      setConversations([{ id: 0, title: "Nova conversa", messages: [] }]);
      setActiveChat(0);
      return;
    }
    setConversations(conversations.filter((conv) => conv.id !== id));
    setActiveChat(conversations[0].id);
  };

  const renameConversation = (id) => {
    if (!newTitle.trim()) {
      setEditingTitle(null);
      setNewTitle("");
      return;
    }
    
    setConversations(
      conversations.map((conv) =>
        conv.id === id ? { ...conv, title: newTitle } : conv
      )
    );
    setEditingTitle(null);
    setNewTitle("");
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex h-screen w-screen ${
      isDarkMode 
        ? "bg-[#181818] text-white" 
        : "bg-gray-50 text-gray-900"
    }`}>
      {/* Sidebar */}
      <aside className={`w-72 p-4 flex flex-col border-r ${
        isDarkMode 
          ? "bg-[#141414] border-gray-800" 
          : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Axys™</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode 
                  ? "hover:bg-gray-800" 
                  : "hover:bg-gray-100"
              }`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode 
                  ? "hover:bg-gray-800" 
                  : "hover:bg-gray-100"
              }`}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className={`p-3 rounded-lg mb-4 ${
            isDarkMode 
              ? "bg-gray-800" 
              : "bg-gray-100"
          }`}>
            <a 
              href="https://lautobranding.com.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ExternalLink size={16} /> Ir para Lauto Branding
            </a>
          </div>
        )}

        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div 
              key={conv.id} 
              className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                activeChat === conv.id
                  ? isDarkMode 
                    ? "bg-gray-700" 
                    : "bg-blue-50"
                  : isDarkMode
                    ? "hover:bg-gray-800" 
                    : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                <MessageSquare size={16} />
                {editingTitle === conv.id ? (
                  <input
                    className={`w-full bg-transparent border-b focus:outline-none ${
                      isDarkMode 
                        ? "border-gray-600" 
                        : "border-gray-300"
                    }`}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => renameConversation(conv.id)}
                    onKeyPress={(e) => e.key === "Enter" && renameConversation(conv.id)}
                    autoFocus
                  />
                ) : (
                  <span 
                    onClick={() => setActiveChat(conv.id)}
                    className="flex-1 truncate"
                  >
                    {conv.title}
                  </span>
                )}
              </div>
              <div className="flex gap-2 ml-2">
                <Edit 
                  size={16} 
                  className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" 
                  onClick={() => {
                    setEditingTitle(conv.id);
                    setNewTitle(conv.title);
                  }} 
                />
                <Trash2 
                  size={16} 
                  className="cursor-pointer text-red-500 opacity-60 hover:opacity-100 transition-opacity" 
                  onClick={() => deleteConversation(conv.id)} 
                />
              </div>
            </div>
          ))}
        </div>

        <button
          className={`mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg transition-colors ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          onClick={() => {
            const newId = conversations.length;
            setConversations([...conversations, { 
              id: newId, 
              title: `Nova conversa ${newId + 1}`, 
              messages: [] 
            }]);
            setActiveChat(newId);
          }}
        >
          <PlusCircle size={18} /> Nova conversa
        </button>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-screen relative">
        {activeChat === null ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
            <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Axys™</h1>
            <p className={`text-lg ${isDarkMode ? "text-[#666666]" : "text-gray-500"}`}>
              Seu assistente especializado em diferenciação de marca.
              <br />
              Inicie uma nova conversa para começar.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {conversations[activeChat].messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`p-4 rounded-lg max-w-2xl relative group ${
                    msg.role === "user"
                      ? isDarkMode 
                        ? "bg-blue-600" 
                        : "bg-blue-500 text-white"
                      : isDarkMode
                        ? "bg-gray-800"
                        : "bg-gray-100"
                  }`}>
                    <p className="mb-1">{msg.content}</p>
                    <div className="text-xs opacity-60 mt-2">
                      {msg.timestamp && formatTimestamp(msg.timestamp)}
                    </div>
                    {msg.role === "bot" && (
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Clipboard size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-4 border-t ${
              isDarkMode 
                ? "border-gray-800 bg-[#141414]" 
                : "border-gray-200 bg-white"
            }`}>
              <div className="max-w-4xl mx-auto flex gap-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className={`flex-1 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-gray-800 focus:ring-blue-600"
                      : "bg-gray-100 focus:ring-blue-500"
                  }`}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className={`p-3 rounded-lg transition-colors flex items-center justify-center ${
                    loading 
                      ? "opacity-50 cursor-not-allowed" 
                      : isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Custom Alert */}
        {showCopyAlert && (
          <CustomAlert message="Texto copiado com sucesso!" />
        )}
      </div>
    </div>
  );
}
