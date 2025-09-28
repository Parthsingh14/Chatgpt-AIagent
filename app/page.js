"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "I am Good" }, // default bot msg
  ]);

  const messagesEndRef = useRef(null);

  // Auto-scroll jab bhi new msg aaye
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }]);
    setInput("");
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
              className="bg-white px-4 py-1 text-black rounded-full cursor-pointer hover:bg-gray-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
