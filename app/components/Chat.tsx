"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Clipboard, Trash2, Edit } from "lucide-react";

const SUPABASE_URL = "https://eyailsmunrhqhqveykyx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const OPENAI_API_KEY = "sk-proj-8XMDil4ULrk4Hosumz92XvzWYySD...";
const ASSISTANT_ID = "asst_gwlLWvpg8mYsoGp5UUbozzRU";
const USER_ID = "bc8ee581-dc55-44f1-96e9-37ab0f87fdb4";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  let threadId = null;

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/Messages`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  };

  const createThread = async () => {
    try {
      const response = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      threadId = data.id;
      console.log("Novo Thread criado:", threadId);
      return threadId;
    } catch (error) {
      console.error("Erro ao criar thread:", error);
      return null;
    }
  };

  const getOpenAIResponse = async (userMessage) => {
    if (!threadId) {
      threadId = await createThread();
    }
    if (!threadId) return "Erro ao criar thread.";

    try {
      await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "user", content: userMessage }),
      });

      const runResponse = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assistant_id: ASSISTANT_ID }),
        }
      );

      let aiResponse = null;
      while (!aiResponse) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusResponse = await fetch(
          `https://api.openai.com/v1/threads/${threadId}/messages`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          }
        );

        const messages = await statusResponse.json();
        aiResponse = messages.data?.find((msg) => msg.role === "assistant");
      }

      return aiResponse?.content || "Erro na resposta da OpenAI.";
    } catch (error) {
      console.error("Erro na OpenAI:", error);
      return "Erro ao conectar com a OpenAI.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const newMessage = { user_id: USER_ID, thread_id: threadId, role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);

    try {
      const aiResponse = await getOpenAIResponse(input);
      const botMessage = { user_id: USER_ID, thread_id: threadId, role: "assistant", content: aiResponse };

      setMessages((prev) => [...prev, botMessage]);

      await fetch(`${SUPABASE_URL}/rest/v1/Messages`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      });

      await fetch(`${SUPABASE_URL}/rest/v1/Messages`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(botMessage),
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-3 rounded-lg shadow-md max-w-lg ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex p-4 bg-white border-t">
        <input
          type="text"
          className="flex-1 p-2 border rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
        />
        <button onClick={sendMessage} className="ml-2 p-2 bg-blue-500 text-white rounded">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
