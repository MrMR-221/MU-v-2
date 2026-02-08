import { useState, useRef } from 'react';

// Types for our messages
export type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export const useStreaming = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");

    // We keep track of the stream so we can append to it
    const streamRef = useRef("");

    const sendMessage = async (message: string) => {
        setIsLoading(true);
        setStreamingContent("");
        streamRef.current = "";

        // Add user message to state
        const newMessages: Message[] = [...messages, { role: 'user', content: message }];
        setMessages(newMessages);

        try {
            // Updated to point to Next.js API (Module 3 RAG)
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.body) {
                throw new Error("No response body");
            }

            // Reader to read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode chunk and append
                const chunk = decoder.decode(value, { stream: true });
                streamRef.current += chunk;
                setStreamingContent(streamRef.current);
            }

            // Once finished, add the full assistant message to history
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: streamRef.current }
            ]);
            setStreamingContent(""); // Clear stream buffer

        } catch (error) {
            console.error("Streaming error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        streamingContent,
        isLoading,
        sendMessage
    };
};
