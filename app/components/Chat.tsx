"use client";

import { useState } from "react";
import { PlusCircle, Send } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", title: "Conversa 1" }
  ]);
  const [activeConversation, setActiveConversation] = useState<Conversation>(conversations[0]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const cleanText = (text: string) => {
    return text
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  };

  const createNewConversation = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: `Conversa ${conversations.length + 1}`
    };
    setConversations([...conversations, newConversation]);
    setActiveConversation(newConversation);
    setMessages([]);
    setConversationId(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation) {
      return;
    }

    setLoading(true);
    console.log("🚀 Enviando mensagem:", input);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: input,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Resposta recebida:", data);

      const userMessage: Message = { role: "user", content: input };
      const botMessage: Message = { role: "bot", content: cleanText(data.response) };
      
      setMessages(prev => [...prev, userMessage, botMessage]);

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);
      setMessages(prev => [...prev, {
        role: "bot",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem."
      }]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      <aside className="w-64 bg-gray-950 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Axys™</h2>
        </div>

        <button
          onClick={createNewConversation}
          className="flex items-center gap-2 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
        >
          <PlusCircle size={18} /> Nova conversa
        </button>

        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-2 rounded-lg cursor-pointer transition ${
                activeConversation?.id === conv.id ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
              }`}
              onClick={() => {
                setActiveConversation(conv);
                setMessages([]);
                setConversationId(null);
              }}
            >
              {conv.title}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-lg ${
                msg.role === "user" 
                  ? "bg-blue-500 text-white self-end ml-auto" 
                  : "bg-gray-700 text-white self-start"
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

        <div className="p-4 bg-gray-900 flex">
          <input
            type="text"
            className="flex-1 bg-gray-800 text-white p-3 rounded-lg focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={activeConversation ? "Digite sua mensagem..." : "Selecione ou crie uma conversa"}
            disabled={!activeConversation || loading}
          />
          <button
            className={`ml-2 px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              loading || !activeConversation
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            onClick={sendMessage}
            disabled={loading || !activeConversation}
          >
            {loading ? "Enviando..." : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
