import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "./ui/button";

/**
 * Floating chat button for mobile users
 * Opens AI counselor chat dialog or navigates to chat page
 */
export function FloatingChatButton() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="lg:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2">
            {/* Label text */}
            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                <span className="text-sm font-medium">AI Chat</span>
            </div>

            {/* Button container */}
            <div className="relative">
                {/* Pulsing animation ring */}
                <div className="absolute inset-0 rounded-full cosmic-gradient animate-pulse opacity-75" />

                {/* Main button */}
                <Link href="/counselor">
                    <Button
                        size="lg"
                        className="relative w-14 h-14 rounded-full cosmic-gradient shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                        aria-label="Open AI Chat Counselor"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />

                        {/* Notification badge */}
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                    </Button>
                </Link>

                {/* Optional close button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    aria-label="Hide chat button"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
