"use client";

import { useState } from "react";
import { Menu, PlusCircle, Send, Clipboard, Trash2, Edit, Moon, Sun } from "lucide-react";

export default function Chat() {
  const [conversations, setConversations] = useState([
    { id: 0, title: "Conversa 1", messages: [] }
  ]);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  const cleanText = (text) => {
    return text.replace(/\s+\./g, ".").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || activeChat === null) return;

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

  const deleteConversation = (id) => {
    if (conversations.length === 1) return;
    setConversations(conversations.filter((conv) => conv.id !== id));
    setActiveChat(null);
  };

  const renameConversation = (id) => {
    setConversations(
      conversations.map((conv) =>
        conv.id === id ? { ...conv, title: newTitle || conv.title } : conv
      )
    );
    setEditingTitle(null);
    setNewTitle("");
  };

  return (
    <div className={`flex h-screen w-screen ${isDarkMode ? "bg-black text-white" : "bg-gray-100 text-black"}`}>
      <aside className={`w-64 p-4 flex flex-col ${isDarkMode ? "bg-gray-900" : "bg-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Axys™</h2>
          <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-gray-700 rounded-full">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Menu size={24} className="cursor-pointer" />
          </div>
        </div>

        <button
          className="flex items-center gap-2 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
          onClick={() => {
            setConversations([...conversations, { id: conversations.length, title: `Conversa ${conversations.length + 1}`, messages: [] }]);
            setActiveChat(conversations.length);
          }}
        >
          <PlusCircle size={18} /> Nova conversa
        </button>

        <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div key={conv.id} className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition ${activeChat === conv.id ? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700"}`}>
              {editingTitle === conv.id ? (
                <input
                  className="bg-transparent text-white border-b border-gray-400 focus:outline-none"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={() => renameConversation(conv.id)}
                  autoFocus
                />
              ) : (
                <span onClick={() => setActiveChat(conv.id)}>{conv.title}</span>
              )}
              <div className="flex gap-2">
                <Edit size={16} className="cursor-pointer" onClick={() => setEditingTitle(conv.id)} />
                <Trash2 size={16} className="cursor-pointer text-red-500" onClick={() => deleteConversation(conv.id)} />
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-col flex-1 h-screen">
        {activeChat === null ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <h1 className="text-3xl font-semibold">Bem-vindo ao Axys™</h1>
            <p className="text-gray-400">Inicie uma nova conversa para começar.</p>
            <button className="mt-6 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition" onClick={() => {
              setConversations([...conversations, { id: conversations.length, title: `Conversa ${conversations.length + 1}`, messages: [] }]);
              setActiveChat(conversations.length);
            }}>
              Iniciar Nova Conversa
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {conversations[activeChat].messages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg max-w-lg relative ${msg.role === "user" ? "bg-gray-700 text-white self-end ml-auto" : "bg-gray-600 text-white self-start"}`}>
                  {msg.content}
                  {msg.role === "bot" && <Clipboard size={16} className="absolute top-1 right-2 cursor-pointer" onClick={() => copyToClipboard(msg.content)} />}
                </div>
              ))}
              {loading && <div className="p-3 bg-gray-600 text-white rounded-lg max-w-lg self-start">Digitando...</div>}
            </div>

            <div className="p-4 flex w-full bg-gray-800">
              <input type="text" className="flex-1 bg-gray-700 text-white p-3 rounded-lg" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Digite sua mensagem..." />
              <button className="ml-2 bg-gray-600 text-white px-4 py-2 rounded-lg" onClick={sendMessage}><Send size={18} /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
