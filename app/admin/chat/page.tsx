"use client";

import { useState } from 'react';
import { Send, Terminal } from 'lucide-react';
import { useStreaming } from '@/hooks/useStreaming';

export default function ChatPage() {
    const { messages, streamingContent, isLoading, sendMessage } = useStreaming();
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput("");
    };

    return (

        <div className="flex h-screen flex-col bg-gray-50">
            {/* Header: Gradient from Dark Blue (#0d253f) to lighter Blue (#1d4ed8) */}
            <header className="h-20 bg-gradient-to-r from-[#0d253f] to-[#1d4ed8] flex items-center px-6 shadow-md shrink-0">
                <div className="flex items-center gap-4">
                    {/* Logo Image */}
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-white/30 shadow-sm overflow-hidden">
                        <img src="/logo.png" alt="MU Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">AL-Mughtaribeen University</h1>
                        <p className="text-xs text-blue-100/80 font-light">Official AI Assistant</p>
                    </div>
                </div>
            </header>

            {/* Chat Area: Flex-1, scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50 scroll-smooth">
                {/* Initial Welcome Message (Dummy Data View if empty) */}
                {messages.length === 0 && (
                    <div className="flex justify-start">
                        <div className="bg-white shadow-md rounded-2xl rounded-tl-none p-5 max-w-[85%] sm:max-w-[75%] relative border border-gray-100">
                            <p className="text-gray-800 leading-relaxed">
                                السلام عليكم أنا مساعد جامعة المغتربين, كيف يمكنني مساعدتك ؟
                            </p>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] p-4 sm:p-5 shadow-sm relative ${msg.role === 'user'
                            ? 'bg-[#0f3057] text-white rounded-2xl rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none shadow-md'
                            }`}>
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                                {msg.content}
                            </p>
                            <span className={`text-[10px] absolute bottom-1 right-3 ${msg.role === 'user' ? 'text-blue-200/60' : 'text-gray-400'
                                }`}>
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Streaming Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white shadow-md rounded-2xl rounded-tl-none p-4 border border-gray-100 flex items-center gap-2 w-fit">
                            <div className="w-2 h-2 bg-[#0f3057] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-[#0f3057] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-[#0f3057] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: Solid Dark Blue (#0f3057) */}
            <div className="bg-[#0f3057] p-4 shrink-0">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3 items-center relative">
                    <input
                        className="flex-1 bg-white text-gray-800 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-inner placeholder-gray-400"
                        placeholder="Type your message here..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-100/10 hover:bg-white/20 text-white w-12 h-12 flex items-center justify-center rounded-full transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white/10"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>

                    {/* Streaming buffer hidden but verifiable if needed */}
                    <div className="hidden">{streamingContent}</div>
                </form>
            </div>
        </div>
    );
}
