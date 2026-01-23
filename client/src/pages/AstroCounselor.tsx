
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { useGuestChart } from "../contexts/GuestChartContext";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Sparkles, Send, Loader2, Bot, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useProfile } from "../hooks/useProfile";

interface Message {
    role: "user" | "model";
    content: string;
}

export default function AstroCounselor() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { guestChart } = useGuestChart();

    const [messages, setMessages] = useState<Message[]>([
        {
            role: "model",
            content: "Namaste! I am your Vedic Career Counselor. I can analyze your chart to answer questions about your career path, financial timing, or business ideas. How can I guide you today?"
        }
    ]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const chatMutation = trpc.ai.chat.useMutation({
        onSuccess: (data) => {
            setMessages((prev) => [...prev, { role: "model", content: data }]);
        },
        onError: (error) => {
            toast.error(`Failed to get guidance: ${error.message}`);
            // Remove user message if failed? Or just keep it.
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, chatMutation.isPending]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        // Prepare context
        const profileId = profile?.id && profile.id > 0 ? profile.id : undefined;
        const birthData = !profileId && guestChart?.birthData ? guestChart.birthData : undefined;

        if (!profileId && !birthData) {
            setMessages(prev => [...prev, { role: "model", content: "I need your birth chart to answer that. Please create a profile or enter your birth details on the home page." }]);
            return;
        }

        chatMutation.mutate({
            profileId,
            birthData,
            message: input,
            history: messages.map(m => ({ role: m.role, content: m.content }))
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4 w-full">
            <div className="flex-none mb-4 space-y-1">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/dashboard">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                        <Bot className="w-8 h-8 text-purple-600" />
                        Astro Career Counselor
                    </h1>
                </div>
                <p className="text-muted-foreground ml-14">
                    Ask me anything about your career destiny, wealth timing, or professional strengths.
                </p>
            </div>

            <Card className="flex-1 overflow-hidden border-primary/20 shadow-lg flex flex-col bg-background/50 backdrop-blur-sm relative">
                {/* Scrollable Container */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40"
                >
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 md:gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.role === "model" && (
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                                </div>
                            )}

                            <div
                                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base leading-relaxed shadow-sm ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted/80 text-foreground rounded-tl-none border border-primary/5"
                                    }`}
                            >
                                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-3" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-3" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-bold text-purple-600 dark:text-purple-400" {...props} />,
                                            table: ({ node, ...props }) => (
                                                <div className="overflow-x-auto my-4 rounded-lg border border-primary/20">
                                                    <table className="min-w-full divide-y divide-primary/10" {...props} />
                                                </div>
                                            ),
                                            thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
                                            th: ({ node, ...props }) => <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase tracking-wider" {...props} />,
                                            td: ({ node, ...props }) => <td className="px-4 py-2 text-sm border-t border-primary/5" {...props} />,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {msg.role === "user" && (
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                    <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                </div>
                            )}
                        </div>
                    ))}

                    {chatMutation.isPending && (
                        <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 shadow-sm">
                                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                            </div>
                            <div className="bg-muted/50 rounded-2xl px-4 py-3 md:px-5 md:py-4 rounded-tl-none flex items-center gap-3 border border-primary/5">
                                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-purple-600" />
                                <span className="text-xs md:text-sm text-muted-foreground font-medium italic">Reading your destiny in the stars...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-background/80 border-t backdrop-blur-sm">
                    <div className="flex gap-2 relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your career, timing, or wealth..."
                            className="pr-12 bg-background"
                            disabled={chatMutation.isPending}
                        />
                        <Button
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8"
                            onClick={handleSend}
                            disabled={chatMutation.isPending || !input.trim()}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        AI can make mistakes. Please verify important astrological details.
                    </p>
                </div>
            </Card>
        </div>
    );
}
