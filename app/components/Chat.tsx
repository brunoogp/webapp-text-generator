"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, PlusCircle, Send, Copy, Trash2, Edit } from "lucide-react";

interface Message {
  role: string;
  content: string;
  timestamp?: string;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
  conversationId?: string | null;
}

export default function Chat() {
  const [chats, setChats] = useState<ChatSession[]>([
    { 
      id: 1, 
      title: "Conversa 1", 
      messages: [],
      conversationId: null 
    }
  ]);
  const [activeChat, setActiveChat] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const timestamp = new Date().toLocaleTimeString();
    const userMessage: Message = { 
      role: "user", 
      content: input, 
      timestamp 
    };

    const updatedChats = [...chats];
    const currentChat = updatedChats[activeChat];
    currentChat.messages.push(userMessage);
    setChats(updatedChats);
    setLoading(true);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          conversation_id: currentChat.conversationId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Erro da API:", data.error);
        return;
      }

      const botMessage: Message = { 
        role: "bot", 
        content: data.response, 
        timestamp: new Date().toLocaleTimeString() 
      };

      currentChat.messages.push(botMessage);
      if (data.conversation_id) {
        currentChat.conversationId = data.conversation_id;
      }
      
      setChats(updatedChats);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const startNewChat = () => {
    const newId = chats.length + 1;
    const newChat: ChatSession = {
      id: newId,
      title: `Conversa ${newId}`,
      messages: [],
      conversationId: null
    };
    setChats([...chats, newChat]);
    setActiveChat(chats.length);
  };

  const renameChat = (index: number, newTitle: string) => {
    const updatedChats = [...chats];
    updatedChats[index].title = newTitle;
    setChats(updatedChats);
    setEditingTitle(null);
  };

  const deleteChat = (index: number) => {
    if (chats.length > 1) {
      const updatedChats = chats.filter((_, i) => i !== index);
      setChats(updatedChats);
      setActiveChat(Math.min(index, updatedChats.length - 1));
    }
  };

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
  };

  useEffect(() => {
    if (editingTitle !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingTitle]);

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      <aside className="w-72 bg-gray-900 p-4 flex flex-col border-r border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-300">Axys™</h2>
          <Menu size={24} className="cursor-pointer text-gray-400" />
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500 transition mb-4"
          onClick={startNewChat}
        >
          <PlusCircle size={18} /> Nova conversa
        </button>
        <div className="flex-1 overflow-y-auto space-y-2">
          {chats.map((chat, index) => (
            <div 
              key={chat.id}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                activeChat === index
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {editingTitle === index ? (
                <input
                  ref={inputRef}
                  type="text"
                  defaultValue={chat.title}
                  onBlur={(e) => renameChat(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameChat(index, e.currentTarget.value);
                    }
                  }}
                  className="w-full bg-transparent text-white outline-none"
                />
              ) : (
                <span 
                  onClick={() => setActiveChat(index)}
                  className="flex-1"
                >
                  {chat.title}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Edit 
                  size={16} 
                  onClick={() => setEditingTitle(index)}
                  className="text-gray-400 hover:text-white"
                />
                {chats.length > 1 && (
                  <Trash2 
                    size={16} 
                    onClick={() => deleteChat(index)}
                    className="text-red-400 hover:text-red-600"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-col flex-1 h-screen">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-950 border-l border-gray-800">
          {chats[activeChat].messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-lg border relative group ${
                msg.role === "user"
                  ? "bg-blue-600 text-white self-end ml-auto border-blue-400"
                  : "bg-gray-800 text-gray-300 self-start border-gray-700"
              }`}
            >
              {msg.role === "bot" && (
                <button 
                  onClick={() => copyMessage(msg.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                >
                  <Copy size={16} />
                </button>
              )}
              {msg.content}
              {msg.timestamp && (
                <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="p-3 bg-gray-700 text-white rounded-lg max-w-lg self-start">
              Digitando...
            </div>
          )}
        </div>

        <form 
          onSubmit={sendMessage}
          className="p-4 bg-gray-900 flex w-full border-t border-gray-800"
        >
          <input
            type="text"
            className="flex-1 bg-gray-800 text-white p-3 rounded-lg focus:outline-none placeholder-gray-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
          />
          <button
            type="submit"
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition flex items-center gap-2"
            disabled={loading}
          >
            {loading ? "Enviando..." : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
