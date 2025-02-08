"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Send, Copy, Check } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    // Carregar conversas do localStorage
    const saved = localStorage.getItem("conversations");
    return saved ? JSON.parse(saved) : [{
      id: "1",
      title: "Nova conversa",
      messages: []
    }];
  });
  const [activeConversation, setActiveConversation] = useState<Conversation>(conversations[0]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Salvar conversas no localStorage quando houver mudanças
  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  const createNewConversation = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: `Nova conversa`,
      messages: []
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation);
  };

  const updateConversationMessages = (conversationId: string, messages: Message[]) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, messages, title: messages[0]?.content.slice(0, 30) || "Nova conversa" }
        : conv
    ));
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Erro ao copiar texto:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...activeConversation.messages, userMessage];
    updateConversationMessages(activeConversation.id, updatedMessages);
    
    setLoading(true);
    setInput("");

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          conversation_id: activeConversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage: Message = { role: "bot", content: data.response };
      
      updateConversationMessages(
        activeConversation.id, 
        [...updatedMessages, botMessage]
      );

    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);
      const errorMessage: Message = {
        role: "bot",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem."
      };
      updateConversationMessages(
        activeConversation.id,
        [...updatedMessages, errorMessage]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 p-4 flex flex-col border-r border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Axys™</h2>
        </div>

        <button
          onClick={createNewConversation}
          className="flex items-center gap-2 bg-zinc-800 text-white py-3 px-4 rounded-lg hover:bg-zinc-700 transition-all duration-200 shadow-lg"
        >
          <PlusCircle size={18} /> Nova conversa
        </button>

        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                activeConversation?.id === conv.id 
                  ? "bg-zinc-700 shadow-lg" 
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
              onClick={() => setActiveConversation(conv)}
            >
              <p className="text-white text-sm truncate">
                {conv.title}
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeConversation.messages.map((msg, index) => (
            <div
              key={`${index}-${msg.content}`}
              className={`group flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`relative p-4 rounded-lg max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-800 text-white"
                }`}
              >
                {msg.content}
                
                {msg.role === "bot" && (
                  <button
                    onClick={() => copyToClipboard(msg.content, `${index}-${msg.content}`)}
                    className={`absolute -right-10 top-1/2 -translate-y-1/2 p-2 rounded-lg 
                      transition-all duration-200 ${
                        copiedMessageId === `${index}-${msg.content}`
                          ? "bg-green-500 text-white"
                          : "bg-zinc-700 text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-600"
                      }`}
                  >
                    {copiedMessageId === `${index}-${msg.content}` ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-white p-4 rounded-lg max-w-[80%]">
                Digitando...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="max-w-5xl mx-auto flex gap-2">
            <input
              type="text"
              className="flex-1 bg-zinc-800 text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all duration-200"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Digite sua mensagem..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`px-4 rounded-lg flex items-center justify-center transition-all duration-200 ${
                loading || !input.trim()
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-white text-black hover:bg-zinc-100"
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
