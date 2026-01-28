import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/_core/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import {
    LayoutDashboard,
    Star,
    Compass,
    TrendingUp,
    Clock,
    Sparkles,
    User,
    LogOut,
    Save,
    Wallet,
    Target,
    BrainCircuit,
    Bot
} from "lucide-react";

export function NavSidebar({
    user,
    isAuthenticated,
    onLogout,
}: {
    user: any;
    isAuthenticated: boolean;
    onLogout: () => void;
}) {
    const [location] = useLocation();

    const navItems = [
        { href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
        { href: "/chart", icon: <Star className="w-5 h-5" />, label: "My Chart" },
        { href: "/swot", icon: <Target className="w-5 h-5" />, label: "SWOT Analysis" },
        { href: "/wealth", icon: <Wallet className="w-5 h-5" />, label: "Wealth & Status" },
        { href: "/career", icon: <Compass className="w-5 h-5" />, label: "Career Pathfinder" },
        { href: "/counselor", icon: <Bot className="w-5 h-5" />, label: "Cosmic Counselor" },
        { href: "/career-validator", icon: <BrainCircuit className="w-5 h-5" />, label: "AI Validator" },
        { href: "/earning", icon: <TrendingUp className="w-5 h-5" />, label: "Earning Sources" },
        { href: "/timing", icon: <Clock className="w-5 h-5" />, label: "Timing" },
        { href: "/remedies", icon: <Sparkles className="w-5 h-5" />, label: "Remedies" },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:flex flex-col z-50">
            <div className="p-4 border-b border-border">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full cosmic-gradient flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">Jyotish Career</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${location === item.href
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}>
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border mt-auto flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-muted-foreground">Appearance</span>
                    <ThemeToggle />
                </div>
                {isAuthenticated ? (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user?.name || "User"}</p>
                                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={onLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </>
                ) : (
                    <GoogleSignInButton className="w-full" />
                )}
            </div>
        </aside>
    );
}

export function MobileHeader({
    isAuthenticated,
    onLogout,
}: {
    isAuthenticated: boolean;
    onLogout: () => void;
}) {
    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 bg-background/80 backdrop-blur-sm">
            <div className="container flex items-center justify-between h-16 px-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full cosmic-gradient flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">Jyotish Career</span>
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {isAuthenticated ? (
                        <Button variant="ghost" size="icon" onClick={onLogout}>
                            <LogOut className="w-5 h-5" />
                        </Button>
                    ) : (
                        <GoogleSignInButton variant="ghost" className="text-sm" />
                    )}
                </div>
            </div>
        </header>
    );
}


export function MobileNav() {
    const [location] = useLocation();

    const navItems = [
        { href: "/chart", icon: <Star className="w-5 h-5" />, label: "Chart" },
        { href: "/counselor", icon: <Bot className="w-5 h-5" />, label: "AI Chat" },
        { href: "/swot", icon: <Target className="w-5 h-5" />, label: "SWOT" },
        { href: "/wealth", icon: <Wallet className="w-5 h-5" />, label: "Wealth" },
        { href: "/career", icon: <Compass className="w-5 h-5" />, label: "Career" },
        { href: "/career-validator", icon: <BrainCircuit className="w-5 h-5" />, label: "Validator" },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
            <div className="flex items-center justify-around py-2">
                {navItems.map(item => (
                    <Link key={item.href} href={item.href}>
                        <div className={`flex flex-col items-center gap-1 p-2 min-w-[60px] cursor-pointer ${location === item.href ? "text-primary" : "text-muted-foreground"
                            }`}>
                            {item.icon}
                            <span className="text-xs font-medium">{item.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
