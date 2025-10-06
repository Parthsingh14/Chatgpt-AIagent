"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hey, I’m Jero! How can I help you today?" },
  ]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", text: input };
    const updatedMessages = [...messages, userMessage];

    // Immediately update UI
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Prepare prevMessages for backend (convert to format Groq expects)
      const formattedPrevMessages = updatedMessages.map((msg) => {
        return {
          role: msg.role === "bot" ? "assistant" : "user",
          content: msg.text,
        };
      });

      const res = await fetch("/api/llmchat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          prevMessages: formattedPrevMessages,
        }),
      });

      const data = await res.json();

      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "⚠️ Sorry, something went wrong." },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Failed to reach Jero. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-neutral-900 text-white overflow-hidden min-h-screen flex flex-col">
      <div className="container mx-auto max-w-3xl flex-1 pb-44 px-3 overflow-y-auto">
        {/* Messages Section */}
        <div className="pt-6 flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-xl whitespace-pre-wrap inline-block max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-neutral-800 text-white"
                    : "bg-neutral-700 text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-gray-400 text-sm italic px-3">Jero is typing...</div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      <div className="fixed inset-x-0 bottom-0 flex items-center justify-center bg-neutral-900 px-3">
        <div className="bg-neutral-800 rounded-3xl w-full max-w-3xl mb-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message..."
            className="w-full resize-none outline-0 p-3 rounded-3xl bg-neutral-800"
          ></textarea>
          <div className="flex justify-end items-center p-3">
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-white px-4 py-1 text-black rounded-full cursor-pointer hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
