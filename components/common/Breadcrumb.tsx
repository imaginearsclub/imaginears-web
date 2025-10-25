"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string; // If no href, it's the current page
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

/**
 * Breadcrumb component for navigation hierarchy
 * Includes structured data for SEO
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
    // Always include home as first item
    const allItems: BreadcrumbItem[] = [
        { label: "Home", href: "/" },
        ...items,
    ];

    // Generate structured data for SEO (without origin to avoid hydration mismatch)
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": allItems.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.label,
            ...(item.href && { "item": item.href }),
        })),
    };

    return (
        <>
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Visual Breadcrumb */}
            <nav 
                aria-label="Breadcrumb" 
                className={cn("mb-6", className)}
            >
                <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                    {allItems.map((item, index) => {
                        const isLast = index === allItems.length - 1;
                        const isFirst = index === 0;

                        return (
                            <li key={index} className="flex items-center gap-1.5">
                                {/* Separator */}
                                {!isFirst && (
                                    <ChevronRight 
                                        className="w-4 h-4 text-slate-400 dark:text-slate-600" 
                                        aria-hidden="true"
                                    />
                                )}

                                {/* Home icon for first item */}
                                {isFirst && item.href && (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-1.5 transition-colors",
                                            "text-slate-600 dark:text-slate-400",
                                            "hover:text-blue-600 dark:hover:text-blue-400"
                                        )}
                                        aria-label="Go to home page"
                                    >
                                        <Home className="w-4 h-4" aria-hidden="true" />
                                        <span className="sr-only">{item.label}</span>
                                    </Link>
                                )}

                                {/* Regular breadcrumb items */}
                                {!isFirst && (
                                    isLast ? (
                                        <span 
                                            className="font-medium text-slate-900 dark:text-white"
                                            aria-current="page"
                                        >
                                            {item.label}
                                        </span>
                                    ) : item.href ? (
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "transition-colors",
                                                "text-slate-600 dark:text-slate-400",
                                                "hover:text-blue-600 dark:hover:text-blue-400"
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {item.label}
                                        </span>
                                    )
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
}

export default Breadcrumb;

