import { useState, useRef, useEffect } from "react";
import { Menu, PlusCircle, Send, Loader2, ArrowDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ id: number; title: string }[]>([
    { id: 1, title: "Conversa 1" }
  ]);
  const [activeChat, setActiveChat] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const cleanText = (text: string) => {
    return text
      .replace(/\s+\./g, ".")
      .replace(/\s+,/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => chatContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const timestamp = new Date().toLocaleTimeString();
    const newMessages = [...messages, { role: "user", content: input, timestamp }];
    setMessages(newMessages);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          conversation_id: conversationId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const cleanedResponse = cleanText(data.response);
      setMessages([
        ...newMessages,
        { role: "bot", content: cleanedResponse, timestamp: new Date().toLocaleTimeString() }
      ]);

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      
      scrollToBottom();
    } catch (error) {
      setError("Erro ao enviar mensagem. Por favor, tente novamente.");
    } finally {
      setInput("");
      setLoading(false);
    }
  };
  const startNewChat = () => {
    const newId = history.length + 1;
    setActiveChat(newId - 1);
    setHistory([...history, { id: newId, title: `Conversa ${newId}` }]);
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-white">
      <aside className="w-72 bg-gray-900 p-4 flex flex-col border-r border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Axys™
          </h2>
          <Menu size={24} className="text-gray-400 hover:text-white transition cursor-pointer" />
        </div>
        
        <button
          onClick={startNewChat}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:opacity-90 transition shadow-lg"
        >
          <PlusCircle size={18} />
          Nova conversa
        </button>

        <div className="mt-6 space-y-2 flex-1 overflow-y-auto">
          {history.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 rounded-lg cursor-pointer transition flex items-center ${
                activeChat === chat.id - 1
                ? "bg-gray-800 border-l-4 border-blue-500"
                : "hover:bg-gray-800"
              }`}
              onClick={() => {
                setActiveChat(chat.id - 1);
                setMessages([]);
                setConversationId(null);
                setError(null);
              }}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-col flex-1 h-screen relative">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className={`p-4 rounded-lg max-w-3xl ${
                msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-white"
              }`}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-500 mt-1">{msg.timestamp}</span>
            </div>
          ))}
          
          {loading && (
            <div className="flex items-center gap-2 p-4 bg-gray-800 text-white rounded-lg max-w-[200px]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Digitando...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-8 p-2 bg-gray-800 rounded-full shadow-lg hover:bg-gray-700 transition"
          >
            <ArrowDown size={20} />
          </button>
        )}

        <form
          onSubmit={sendMessage}
          className="p-4 bg-gray-900 border-t border-gray-800 flex items-center gap-2"
        >
          <input
            type="text"
            className="flex-1 bg-gray-800 text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={loading}
          />
          <button
            type="submit"
            className={`p-4 rounded-lg transition flex items-center justify-center w-14 h-14 ${
              loading || !input.trim()
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
