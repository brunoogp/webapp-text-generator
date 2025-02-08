"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Send, LogOut } from "lucide-react";
import { auth } from "../components/firebaseConfig";
import { onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  // 🔥 Corrigindo autenticação persistente
  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔍 Verificando autenticação...");

      await setPersistence(auth, browserLocalPersistence);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("✅ Usuário autenticado:", user.email);
          setUser(user);
          loadUserConversations(user.uid);
        } else {
          console.warn("❌ Nenhum usuário autenticado.");
          setUser(null);
        }
        setLoadingUser(false);
      });

      return () => unsubscribe();
    };

    checkAuth();
  }, []);

  // 🔥 Garante que uma conversa esteja ativa
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      console.log("📌 Nenhuma conversa ativa, ativando a primeira...");
      setActiveConversation(conversations[0]);
    }
  }, [conversations]);

  const loadUserConversations = (userId) => {
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
      userId: user ? user.uid : "guest",
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation);
    setMessages([]);
    saveConversations([newConversation, ...conversations]);
  };

  const saveConversations = (conversations) => {
    const userId = user ? user.uid : "guest";
    localStorage.setItem(`conversations_${userId}`, JSON.stringify(conversations));
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "https://lautobranding.com.br/area-de-membros";
  };

  const cleanText = (text) => {
    return text.replace(/\s+\./g, ".").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
  };

  const sendMessage = async () => {
    if (!input.trim()) {
      console.warn("⚠️ Mensagem vazia, não será enviada.");
      return;
    }

    if (!activeConversation) {
      console.warn("⚠️ Nenhuma conversa ativa, criando nova...");
      createNewConversation();
      return;
    }

    if (!user) {
      console.error("❌ Nenhum usuário autenticado. Cancelando envio.");
      return;
    }

    setLoading(true);
    console.log("🚀 Enviando mensagem:", input);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error("❌ Usuário não autenticado no Firebase.");
        setLoading(false);
        return;
      }

      const token = await currentUser.getIdToken();
      console.log("🔑 Token JWT obtido:", token);

      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          query: input,
          conversation_id: activeConversation.id,
          user_id: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro da API:", errorData);
        setMessages([...messages, { role: "bot", content: `Erro: ${errorData.error || "Resposta inválida"}` }]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("✅ Resposta da API:", data);

      const botMessage = { role: "bot", content: cleanText(data.response) };
      setMessages((prevMessages) => [...prevMessages, { role: "user", content: input }, botMessage]);

      const updatedConversations = conversations.map((conv) =>
        conv.id === activeConversation.id ? { ...conv, messages: [...conv.messages, { role: "user", content: input }, botMessage] } : conv
      );

      setConversations(updatedConversations);
      saveConversations(updatedConversations);

    } catch (error) {
      console.error("❌ Erro inesperado no envio:", error);
    }

    setInput("");
    setLoading(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      {loadingUser ? (
        <div className="flex justify-center items-center h-screen">
          <p>Verificando usuário...</p>
        </div>
      ) : (
        <>
          <aside className="w-64 bg-gray-950 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Axys™</h2>
              {user && (
                <button onClick={handleLogout} className="p-2 hover:bg-gray-800 rounded-full">
                  <LogOut size={20} />
                </button>
              )}
            </div>

            <button className="flex items-center gap-2 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
              onClick={createNewConversation}>
              <PlusCircle size={18} /> Nova conversa
            </button>

            <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <div key={conv.id} className={`p-2 rounded-lg cursor-pointer transition ${
                  activeConversation?.id === conv.id ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
                }`} onClick={() => {
                  setActiveConversation(conv);
                  setMessages(conv.messages || []);
                }}>
                  {conv.title}
                </div>
              ))}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
