"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import { Button } from "@/components/common";
import { cn } from "@/lib/utils";
import { Share2, Twitter, Copy, Check, MessageCircle } from "lucide-react";

// Security: Sanitize text for URLs
function sanitizeForUrl(text: string): string {
    return encodeURIComponent(text.slice(0, 280)); // Twitter limit
}

interface ShareButtonProps {
    title: string;
    description?: string;
    url?: string;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "primary" | "outline";
}

interface ShareOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color: string;
}

const ShareButton = memo(({ 
    title, 
    description, 
    url,
    size = "md",
    variant = "outline"
}: ShareButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Get the current page URL (client-side only)
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Reset copied state when dropdown closes
    useEffect(() => {
        if (!isOpen && copied) {
            const timer = setTimeout(() => setCopied(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, copied]);

    // Share to Twitter
    const shareToTwitter = useCallback(() => {
        const text = sanitizeForUrl(description || title);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
        setIsOpen(false);
    }, [title, description, shareUrl]);

    // Share to Facebook
    const shareToFacebook = useCallback(() => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
        setIsOpen(false);
    }, [shareUrl]);

    // Share to Discord (copy link with Discord-friendly message)
    const shareToDiscord = useCallback(async () => {
        const discordMessage = `Check out this event: **${title}**\n${shareUrl}`;
        try {
            await navigator.clipboard.writeText(discordMessage);
            setCopied(true);
            setTimeout(() => {
                setIsOpen(false);
            }, 1000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    }, [title, shareUrl]);

    // Copy link to clipboard
    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => {
                setIsOpen(false);
            }, 1000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => {
                    setIsOpen(false);
                }, 1000);
            } catch (err) {
                console.error('Fallback copy failed:', err);
            }
            document.body.removeChild(textArea);
        }
    }, [shareUrl]);

    const shareOptions: ShareOption[] = [
        {
            id: 'twitter',
            label: 'Share on Twitter',
            icon: <Twitter className="w-4 h-4" />,
            onClick: shareToTwitter,
            color: 'text-blue-400',
        },
        {
            id: 'facebook',
            label: 'Share on Facebook',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            ),
            onClick: shareToFacebook,
            color: 'text-blue-600',
        },
        {
            id: 'discord',
            label: 'Copy for Discord',
            icon: <MessageCircle className="w-4 h-4" />,
            onClick: shareToDiscord,
            color: 'text-indigo-500',
        },
        {
            id: 'copy',
            label: copied ? 'Link copied!' : 'Copy link',
            icon: copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />,
            onClick: copyLink,
            color: copied ? 'text-green-600' : 'text-slate-600 dark:text-slate-400',
        },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                ref={buttonRef}
                variant={variant}
                size={size}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Share event"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className="gap-2"
            >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Share</span>
            </Button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={cn(
                        "absolute top-full mt-2 right-0 z-50",
                        "w-56 rounded-xl overflow-hidden shadow-xl",
                        "border-2 border-slate-300 dark:border-slate-700",
                        "bg-white dark:bg-slate-900",
                        "animate-in fade-in slide-in-from-top-2 duration-200"
                    )}
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1">
                        {shareOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={option.onClick}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5",
                                    "text-left text-sm font-medium transition-colors duration-150",
                                    "hover:bg-slate-50 dark:hover:bg-slate-800",
                                    copied && option.id === 'copy'
                                        ? "text-green-600 dark:text-green-500"
                                        : "text-slate-700 dark:text-slate-300"
                                )}
                                role="menuitem"
                                disabled={copied && option.id !== 'copy'}
                            >
                                <span className={option.color}>{option.icon}</span>
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Attribution footer */}
                    <div className={cn(
                        "px-4 py-2 text-xs",
                        "bg-slate-50 dark:bg-slate-800",
                        "text-slate-500 dark:text-slate-500",
                        "border-t border-slate-200 dark:border-slate-700"
                    )}>
                        Share this event with friends
                    </div>
                </div>
            )}
        </div>
    );
});

ShareButton.displayName = 'ShareButton';

export default ShareButton;

