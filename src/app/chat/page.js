'use client'
import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useDarkMode } from "../DarkModeContext";
import { Send, Bot, User, Sparkles, RefreshCw, Trash2, ChefHat, ArrowRight, ArrowLeft } from "lucide-react";

function Chat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(true);
  const router = useRouter();
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 **Hello! I'm BiteBox AI**, your personal culinary companion and nutritionist. How can I assist your cooking or diet today?"
    }
  ]);

  const chatEndRef = useRef(null);
  const { darkMode } = useDarkMode();

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const aiRef = useRef(null);

  useEffect(() => {
    if (apiKey) {
      aiRef.current = new GoogleGenAI({ apiKey });
    }
  }, [apiKey]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const quickPrompts = [
    { emoji: "🥗", text: "Suggest a healthy 15-min dinner recipe" },
    { emoji: "🌶️", text: "Got rice, eggs & spinach. What can I cook?" },
    { emoji: "🍰", text: "Quick low-calorie dessert ideas?" },
    { emoji: "🏋️‍♂️", text: "High-protein meal plan for muscle building" }
  ];

  const handleSendMessage = async (userPrompt = null) => {
    const textToSend = (userPrompt || input).trim();
    if (!textToSend || isLoading) return;

    // Hide quick options after first user message
    setShowQuickOptions(false);

    // Add User Message to Chat History
    const updatedMessages = [...messages, { role: "user", text: textToSend }];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      if (!aiRef.current) {
        throw new Error("Gemini API key is not configured.");
      }

      // Build conversation history prompt
      const conversationHistory = updatedMessages.map(m => `${m.role === 'user' ? 'User' : 'BiteBox AI'}: ${m.text}`).join("\n\n");

      const systemContext = `You are BiteBox AI, an expert chef, nutritionist, and friendly food companion.
Provide helpful, encouraging, and detailed answers about recipes, culinary techniques, meal planning, and nutrition.
Use clear markdown formatting with lists, bold text, and emojis. Keep tone warm and conversational.`;

      const fullPrompt = `${systemContext}\n\n${conversationHistory}\n\nBiteBox AI:`;

      const response = await aiRef.current.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
      });

      const replyText = response.text || "I couldn't generate a response. Please try rephrasing.";

      setMessages(prev => [...prev, { role: "bot", text: replyText }]);
    } catch (error) {
      console.error("AI Chat error:", error);
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "⚠️ Oops! Something went wrong connecting to BiteBox AI. Please check your network or try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "bot",
        text: "👋 Chat reset! What culinary questions or recipes would you like to explore now?"
      }
    ]);
    setShowQuickOptions(true);
  };

  // Custom Markdown components
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={materialDark}
          language={match[1]}
          PreTag="div"
          className="rounded-xl my-2 text-sm"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 text-amber-500">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mb-2 text-amber-500">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-amber-500">{children}</h3>,
    p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-amber-500 pl-4 py-1 my-2 italic text-gray-600 dark:text-gray-300">
        {children}
      </blockquote>
    )
  };

  return (
    <div className={`w-full h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Top Header Bar */}
      <header className={`px-4 sm:px-6 py-4 border-b flex items-center justify-between shadow-sm sticky top-0 z-10 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow hidden sm:flex">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold flex items-center gap-2">
              BiteBox Culinary AI
              <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                Gemini 2.5
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ask about recipes, ingredients, macros & meal prep</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Reset Chat</span>
        </button>
      </header>

      {/* Main Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow ${
                message.role === "user" ? "bg-amber-500" : "bg-emerald-600"
              }`}>
                {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed ${
                message.role === "user"
                  ? "bg-amber-500 text-white rounded-tr-none"
                  : `${darkMode ? "bg-gray-800 text-gray-100 border border-gray-700" : "bg-white text-gray-800 border border-gray-200"} rounded-tl-none`
              }`}>
                <ReactMarkdown
                  components={MarkdownComponents}
                  remarkPlugins={[remarkGfm]}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {/* Typing Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs shadow">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-none border shadow-sm ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>BiteBox AI is cooking a response...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Quick Prompt Pills (Only visible before user sends first message) */}
      {showQuickOptions && (
        <div className="px-4 py-2 max-w-4xl mx-auto w-full">
          <p className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Need inspiration? Tap a quick option:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt.text)}
                className={`p-3 rounded-xl border text-xs sm:text-sm text-left flex items-center justify-between transition-all hover:scale-[1.01] ${
                  darkMode
                    ? "bg-gray-800 border-gray-700 hover:border-amber-500 text-gray-200"
                    : "bg-white border-gray-200 hover:border-amber-500 text-gray-700"
                } shadow-sm group`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{prompt.emoji}</span>
                  <span className="font-medium">{prompt.text}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <div className={`p-4 border-t sticky bottom-0 z-10 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about recipes, ingredients, dietary plans..."
            className={`flex-1 p-3.5 rounded-xl border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition shadow active:scale-95 ${
              isLoading || !input.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
