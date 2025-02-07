"use client";

import React, { useState, useEffect } from "react";
import { Menu, PlusCircle, Send, LogOut } from "lucide-react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

export default function AuthenticatedChat() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadUserConversations(user.uid);
      } else {
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserConversations = async (userId) => {
    const savedConversations = JSON.parse(localStorage.getItem(`conversations_${userId}`) || "[]");
    setConversations(savedConversations);
    if (savedConversations.length > 0) {
      setActiveConversation(savedConversations[0]);
    }
  };

  const createNewConversation = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: `Conversa ${conversations.length + 1}`,
      messages: [],
      userId: user.uid,
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation);
    setMessages([]);
    saveConversations([newConversation, ...conversations], user.uid);
  };

  const saveConversations = (conversations, userId) => {
    localStorage.setItem(`conversations_${userId}`, JSON.stringify(conversations));
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  // 🔥 Função para limpar espaços extras no texto da resposta
  const cleanText = (text) => {
    return text
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation) return;

    const newMessage = { role: "user", content: input };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          conversation_id: activeConversation.id,
          user_id: user.uid,
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // 🔥 Aplica a limpeza no texto antes de exibir
      const botMessage = { role: "bot", content: cleanText(data.response) };
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      const updatedConversation = {
        ...activeConversation,
        messages: finalMessages,
      };
      const updatedConversations = conversations.map((conv) =>
        conv.id === activeConversation.id ? updatedConversation : conv
      );
      setConversations(updatedConversations);
      saveConversations(updatedConversations, user.uid);
    } catch (error) {
      console.error("Erro:", error);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      {/* Menu Lateral */}
      <aside className="w-64 bg-gray-950 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Axys™</h2>
          <button onClick={handleLogout} className="p-2 hover:bg-gray-800 rounded-full">
            <LogOut size={20} />
          </button>
        </div>

        <button
          className="flex items-center gap-2 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          onClick={createNewConversation}
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
                setMessages(conv.messages || []);
              }}
            >
              {conv.title}
            </div>
          ))}
        </div>
      </aside>

      {/* Área do Chat */}
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-lg ${
                msg.role === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-700 text-white self-start"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="p-3 bg-gray-700 text-white rounded-lg max-w-lg self-start">Digitando...</div>
          )}
        </div>

        {/* Campo de Entrada */}
        <div className="p-4 bg-gray-900 flex">
          <input
            type="text"
            className="flex-1 bg-gray-800 text-white p-3 rounded-lg focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeConversation ? "Digite sua mensagem..." : "Selecione ou inicie uma conversa"}
            disabled={!activeConversation}
          />
          <button
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
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
