import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export type Conversation = {
    id: number;
    title: string;
    updatedAt: string; // or Date
};

type ChatSidebarProps = {
    conversations: Conversation[];
    currentId?: number;
    onSelect: (id: number) => void;
    onNew: () => void;
    onRename: (id: number, newTitle: string) => void;
    onDelete: (id: number) => void;
    className?: string;
};

export function ChatSidebar({
    conversations,
    currentId,
    onSelect,
    onNew,
    onRename,
    onDelete,
    className,
}: ChatSidebarProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const startEditing = (conv: Conversation) => {
        setEditingId(conv.id);
        setEditTitle(conv.title);
    };

    const saveTitle = () => {
        if (editingId && editTitle.trim()) {
            onRename(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") saveTitle();
        if (e.key === "Escape") setEditingId(null);
    };

    return (
        <div className={cn("flex flex-col bg-muted/30 border-r w-64", className)}>
            <div className="p-4 border-b">
                <Button onClick={onNew} className="w-full gap-2 transition-all hover:scale-[1.02]">
                    <Plus className="size-4" />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {conversations.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            No conversations yet
                        </div>
                    )}

                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={cn(
                                "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
                                currentId === conv.id
                                    ? "bg-secondary text-secondary-foreground font-medium"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => onSelect(conv.id)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <MessageSquare className="size-4 shrink-0 transition-opacity opacity-70 group-hover:opacity-100" />

                                {editingId === conv.id ? (
                                    <Input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={saveTitle}
                                        onKeyDown={handleKeyDown}
                                        autoFocus
                                        className="h-7 text-xs px-1"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="truncate">{conv.title}</span>
                                )}
                            </div>

                            {!editingId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 md:size-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity active:bg-muted"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="size-4 md:size-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => startEditing(conv)}>
                                            <Pencil className="size-3 mr-2" />
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(conv.id)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="size-3 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
