import { useState, useEffect } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { GuestChat } from "@/components/GuestChat";
import { ChatSidebar } from "@/components/ChatSidebar";
import { AIChatBox, Message } from "@/components/AIChatBox";
import { trpc } from "../lib/trpc";
import { useProfile } from "../hooks/useProfile";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AstroCounselor() {
    const { user, loading } = useAuth();
    const { profile } = useProfile();
    const utils = trpc.useUtils();

    // -- STATE --
    const [activeId, setActiveId] = useState<number | null>(null);

    // -- QUERIES --
    const listQuery = trpc.chat.list.useQuery(undefined, {
        enabled: !!user // only fetch if user logged in
    });

    const chatQuery = trpc.chat.get.useQuery(
        { id: activeId! },
        { enabled: !!activeId }
    );

    // -- MUTATIONS --
    const createMutation = trpc.chat.create.useMutation({
        onSuccess: (data) => {
            utils.chat.list.invalidate();
            setActiveId(data.id);
        }
    });

    const sendMutation = trpc.chat.sendMessage.useMutation({
        onSuccess: (data) => {
            // Invalidate to fetch the new assistant message
            utils.chat.get.invalidate({ id: activeId! });
            utils.chat.list.invalidate(); // Update timestamp in sidebar
        },
        onError: (error) => {
            toast.error(`Failed to send message: ${error.message}`);
        }
    });

    const renameMutation = trpc.chat.rename.useMutation({
        onSuccess: () => utils.chat.list.invalidate()
    });

    const deleteMutation = trpc.chat.delete.useMutation({
        onSuccess: () => {
            utils.chat.list.invalidate();
            if (activeId) setActiveId(null);
        }
    });

    // -- HANDLERS --
    const handleNewChat = () => {
        // Create new chat with current profile
        // If no profile, backend might error or fallback
        createMutation.mutate({
            profileId: profile?.id,
            title: "New Future Chat"
        });
    };

    const handleSendMessage = (content: string) => {
        if (!activeId) return;

        // Optimistically update UI? 
        // AIChatBox manages input state, but we rely on chatQuery for message list.
        // We could manually update cache here for instant feedback, 
        // but let's rely on fast backend first or loading state.

        sendMutation.mutate({
            conversationId: activeId,
            message: content
        });
    };

    // If loading auth, show spinner
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // If GUEST, show legacy guest chat
    if (!user) {
        return <GuestChat />;
    }

    // -- PERSISTENT CHAT RENDER --
    const conversations = listQuery.data || [];

    // Map DB messages to UI messages
    const displayMessages: Message[] = chatQuery.data?.messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
    })) || [];

    // If sending, append user message optimistically? 
    // Usually AIChatBox just shows what we pass. 
    // If sendMutation is pending, we can append a temp user message?
    // AIChatBox takes callbacks, so maybe we let it handle input clearing.
    // Ideally, we append the pending user message to displayMessages.
    if (sendMutation.isPending && sendMutation.variables) {
        displayMessages.push({
            role: "user",
            content: sendMutation.variables.message
        });
    }

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* SIDEBAR - Hidden on mobile? For now flex-col on mobile? */}
            <div className="hidden md:block h-full">
                <ChatSidebar
                    conversations={conversations.map(c => ({
                        id: c.id,
                        title: c.title,
                        updatedAt: c.updatedAt.toString()
                    }))}
                    currentId={activeId || undefined}
                    onSelect={setActiveId}
                    onNew={handleNewChat}
                    onRename={(id, title) => renameMutation.mutate({ id, title })}
                    onDelete={(id) => deleteMutation.mutate({ id })}
                    className="h-full border-r"
                />
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col h-full bg-background relative">
                {activeId ? (
                    <div className="flex-1 flex flex-col h-full relative">

                        {/* Header for mobile or context */}
                        <div className="md:hidden p-2 border-b flex justify-between items-center bg-muted/20">
                            <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>← Back</Button>
                            <span className="font-medium truncate">{conversations.find(c => c.id === activeId)?.title}</span>
                        </div>

                        <AIChatBox
                            messages={displayMessages}
                            onSendMessage={handleSendMessage}
                            isLoading={sendMutation.isPending || chatQuery.isFetching}
                            // isFetching check prevents flicker but might show loading too long?
                            // Actually pure isPending is better for "Generating..." state.
                            // chatQuery.isFetching runs on poll/refetch. 

                            height="100%"
                            className="h-full w-full border-0 rounded-none shadow-none"
                            placeholder="Ask the stars..."
                            emptyStateMessage="Analyzing your cosmic timeline..."
                            suggestedPrompts={[
                                "What does my career timeline look like?",
                                "Analyze my wealth potential.",
                                "Is this a good time to switch jobs?"
                            ]}
                        />
                    </div>
                ) : (
                    // EMPTY STATE (No chat selected)
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 cosmic-gradient-text">
                            <Bot className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2 max-w-md">
                            <h2 className="text-2xl font-bold tracking-tight">Cosmic Memory</h2>
                            <p className="text-muted-foreground">
                                Select a conversation from the sidebar or start a new journey into your future.
                                Your chat history is now saved.
                            </p>
                        </div>

                        {conversations.length > 0 ? (
                            <div className="flex gap-4">
                                <Button onClick={handleNewChat} size="lg" className="cosmic-gradient">
                                    Start New Journey
                                </Button>
                                <Button variant="outline" size="lg" className="md:hidden" onClick={() => {/* Show sidebar sheet */ }}>
                                    View History
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={handleNewChat} size="lg" className="cosmic-gradient shadow-lg shadow-purple-500/20">
                                Start Your First Chat
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* MOBILE SIDEBAR (Visible ONLY if no active chat on mobile) */}
            <div className={`md:hidden absolute inset-0 bg-background z-10 transition-transform duration-300 ${activeId ? 'translate-x-[-100%]' : 'translate-x-0'}`}>
                <div className="p-4 border-b flex items-center gap-2">
                    <Bot className="w-6 h-6 text-purple-600" />
                    <span className="font-bold">Astro Counselor</span>
                </div>
                <ChatSidebar
                    conversations={conversations.map(c => ({
                        id: c.id,
                        title: c.title,
                        updatedAt: c.updatedAt.toString()
                    }))}
                    currentId={activeId || undefined}
                    onSelect={setActiveId}
                    onNew={handleNewChat}
                    onRename={(id, title) => renameMutation.mutate({ id, title })}
                    onDelete={(id) => deleteMutation.mutate({ id })}
                    className="h-[calc(100%-4rem)] border-none w-full"
                />
            </div>
        </div>
    );
}
