"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Send, LogOut } from "lucide-react";
import { auth } from "../components/firebaseConfig"; // 🔥 Certifique-se de que esse caminho está correto
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState(["Conversa 1"]);
  const [activeConversation, setActiveConversation] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔍 Verificando autenticação...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Usuário autenticado:", user.email);
        setUser(user);
      } else {
        console.warn("❌ Nenhum usuário autenticado.");
        setUser(null);
      }
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Função para limpar espaços extras e corrigir espaçamentos errados
  const cleanText = (text: string) => {
    return text
      .replace(/\s+\./g, ".") // Remove espaços antes de pontos finais
      .replace(/\s+,/g, ",")  // Remove espaços antes de vírgulas
      .replace(/\s+/g, " ")   // Substitui múltiplos espaços seguidos por um único espaço
      .trim();                // Remove espaços no início e no fim
  };

  const sendMessage = async () => {
    if (!input.trim()) {
      console.warn("⚠️ Mensagem vazia, não será enviada.");
      return;
    }

    if (!user) {
      console.error("❌ Nenhum usuário autenticado no Firebase.");
      return;
    }

    setLoading(true);
    console.log("🚀 Enviando mensagem:", input);

    try {
      const token = await user.getIdToken();
      console.log("🔑 Token JWT obtido:", token);

      const response = await fetch("/api/dify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: input,
          conversation_id: conversationId,
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
      setMessages([...messages, { role: "user", content: input }, botMessage]);

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);
    }

    setInput("");
    setLoading(false);
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
                <button onClick={() => signOut(auth)} className="p-2 hover:bg-gray-800 rounded-full">
                  <LogOut size={20} />
                </button>
              )}
            </div>

            <button className="flex items-center gap-2 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
              onClick={() => {
                setActiveConversation(conversations.length);
                setConversations([...conversations, `Conversa ${conversations.length + 1}`]);
                setMessages([]);
                setConversationId(null);
              }}>
              <PlusCircle size={18} /> Nova conversa
            </button>

            <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
              {conversations.map((conv, index) => (
                <div key={index} className={`p-2 rounded-lg cursor-pointer transition ${
                  activeConversation === index ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
                }`} onClick={() => {
                  setActiveConversation(index);
                  setMessages([]);
                  setConversationId(null);
                }}>
                  {conv}
                </div>
              ))}
            </div>
          </aside>

          {/* 🔥 Barra de digitação mantida */}
          <div className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg max-w-lg ${
                  msg.role === "user" ? "bg-blue-500 text-white self-end ml-auto" : "bg-gray-700 text-white self-start"
                }`}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="p-3 bg-gray-700 text-white rounded-lg max-w-lg self-start">Digitando...</div>
              )}
            </div>

            {/* 🔥 Corrigido para garantir que os botões funcionem */}
            <div className="p-4 bg-gray-900 flex">
              <input
                type="text"
                className="flex-1 bg-gray-800 text-white p-3 rounded-lg focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
        </>
      )}
    </div>
  );
}
