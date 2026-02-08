"use client";

import { useState } from 'react';
import { Send } from 'lucide-react';

export default function DesignTestPage() {
    const [input, setInput] = useState("");
    const messages = [
        { role: 'assistant', content: 'Hello! This is a TEST page to verify the design.' },
        { role: 'user', content: 'Does this design work?' }
    ];

    return (
        <div className="flex h-screen flex-col bg-gray-50 border-4 border-green-500">
            {/* Header: Gradient from Dark Blue (#0d253f) to lighter Blue (#1d4ed8) */}
            <header className="h-20 bg-gradient-to-r from-[#0d253f] to-[#1d4ed8] flex items-center px-6 shadow-md shrink-0">
                <div className="flex items-center gap-4">
                    {/* Logo Placeholder */}
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
                        <span className="text-2xl">🎓</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">AL-Mughtaribeen University</h1>
                        <p className="text-xs text-blue-100/80 font-light">Official AI Assistant</p>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] p-4 sm:p-5 shadow-sm relative ${msg.role === 'user'
                                ? 'bg-[#0f3057] text-white rounded-2xl rounded-tr-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none shadow-md'
                            }`}>
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                                {msg.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="bg-[#0f3057] p-4 shrink-0">
                <form className="max-w-4xl mx-auto flex gap-3 items-center relative">
                    <input
                        className="flex-1 bg-white text-gray-800 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-inner placeholder-gray-400"
                        placeholder="Type (Test Only)..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button
                        type="button"
                        className="bg-blue-100/10 hover:bg-white/20 text-white w-12 h-12 flex items-center justify-center rounded-full transition shadow-lg backdrop-blur-sm border border-white/10"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
