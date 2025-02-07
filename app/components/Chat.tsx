"use client";

import { useState, useEffect } from "react";
import { Menu, PlusCircle, Send } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAlQEkdSArdyNYMzKVUBJQs5yRoww55Pmc",
  authDomain: "assistente-de-midias-sociais.firebaseapp.com",
  projectId: "assistente-de-midias-sociais"
};

initializeApp(firebaseConfig);

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(["Conversa 1"]);
  const [activeChat, setActiveChat] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const cleanText = (text: string) => {
    return text
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          query: input,
          conversation_id: conversationId,
          user_id: user.uid
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

  if (!user) {
    return <div className="bg-black text-white h-screen flex items-center justify-center">Faça login para continuar</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      <aside className="w-64 bg-[#1a1a1a] p-4 flex flex-col border-r border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-300">Axys™</h2>
          <Menu size={24} className="cursor-pointer text-gray-500 hover:text-white" />
        </div>
        <button
          className="flex items-center gap-2 bg-[#2a2a2a] text-white py-2 px-4 rounded-lg hover:bg-[#3a3a3a] transition"
          onClick={() => {
            setActiveChat(history.length);
            setHistory([...history, `Conversa ${history.length + 1}`]);
            setMessages([]);
            setConversationId(null);
          }}
        >
          <PlusCircle size={18} /> Nova conversa
        </button>
        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {history.map((item, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg cursor-pointer transition ${
                activeChat === index 
                  ? "bg-[#3a3a3a] text-white" 
                  : "bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"
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

      <div className="flex flex-col flex-1 h-screen">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-lg ${
                msg.role === "user" 
                  ? "bg-[#2a2a2a] text-white self-end ml-auto" 
                  : "bg-[#1a1a1a] text-gray-200 self-start"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="p-3 bg-[#2a2a2a] text-gray-400 rounded-lg max-w-lg self-start">
              Digitando...
            </div>
          )}
        </div>

        <div className="p-4 bg-[#1a1a1a] flex w-full border-t border-[#2a2a2a]">
          <input
            type="text"
            className="flex-1 bg-[#2a2a2a] text-white p-3 rounded-lg focus:outline-none placeholder-gray-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
          />
          <button
            className="ml-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
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
