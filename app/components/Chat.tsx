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

    // Create a deep copy of chats to avoid direct mutation
    const updatedChats = JSON.parse(JSON.stringify(chats));
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
          conversation_id: currentChat.conversationId, // Use the specific chat's conversationId
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
      
      // Update the conversationId only for the current chat
      if (data.conversation_id) {
        currentChat.conversationId = data.conversation_id;
      }
      
      // Use the updatedChats to set the new state
      setChats(updatedChats);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  // Rest of the component remains the same as in the original code
  
  // ... (other methods like startNewChat, renameChat, deleteChat, etc.)

  return (
    // ... (same render logic as in the original code)
  );
}
