"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CalendarRange,
    FileText,
    Users,
    Settings,
    Shield,
    Sliders,
    X,
    ChevronDown,
    UserCog,
    User,
    BookOpen,
    Activity,
} from "lucide-react";
import { memo, useCallback, useMemo, useState, type ComponentType } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, Badge, Separator } from "@/components/common";
import SignOutButton from "./SignOutButton";

const CURRENT_YEAR = new Date().getFullYear();

/* ---------- Nav Item ---------- */
const NavItem = memo(function NavItem({
    href,
    icon: Icon,
    label,
    onClick,
    exactMatch = false,
}: {
    href: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
    exactMatch?: boolean;
}) {
    const pathname = usePathname();
    
    // Memoize active state calculation with exact match option
    const active = useMemo(() => {
        if (exactMatch) {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    }, [pathname, href, exactMatch]);

    // Memoize click handler to prevent re-creation
    const handleClick = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <Tooltip content={label} side="right">
            <Link
                href={href}
                onClick={handleClick}
                className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                    active
                        ? "bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 text-slate-900 dark:text-white shadow-sm border border-blue-200/60 dark:border-blue-800/60 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                )}
                aria-current={active ? "page" : undefined}
            >
                {/* Active indicator */}
                {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[var(--brand-start)] to-[var(--brand-end)] rounded-r-full" />
                )}
                
                <Icon
                    className={cn(
                        "h-5 w-5 transition-all duration-200 flex-shrink-0",
                        active
                            ? "text-[var(--brand-end)]"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-[var(--brand-start)] group-hover:scale-110"
                    )}
                    aria-hidden="true"
                />
                <span className="font-medium text-sm">{label}</span>
            </Link>
        </Tooltip>
    );
});

/* ---------- Nav Item with Submenu ---------- */
const NavItemWithSubmenu = memo(function NavItemWithSubmenu({
    href,
    icon: Icon,
    label,
    onClick,
    children,
}: {
    href: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
    children?: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    
    // Check if current path or any child path is active
    const isActive = useMemo(() => {
        return pathname === href || pathname.startsWith(`${href}/`);
    }, [pathname, href]);

    // Auto-expand if a child is active
    useMemo(() => {
        if (isActive) {
            setIsOpen(true);
        }
    }, [isActive]);

    const toggleSubmenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(prev => !prev);
    }, []);

    const handleItemClick = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <div>
            <Tooltip content={label} side="right">
                <div className="relative">
                    <Link
                        href={href}
                        onClick={handleItemClick}
                        className={cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                            pathname === href
                                ? "bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 text-slate-900 dark:text-white shadow-sm border border-blue-200/60 dark:border-blue-800/60 font-semibold"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                        )}
                        aria-current={pathname === href ? "page" : undefined}
                    >
                        {/* Active indicator */}
                        {pathname === href && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[var(--brand-start)] to-[var(--brand-end)] rounded-r-full" />
                        )}
                        
                        <Icon
                            className={cn(
                                "h-5 w-5 transition-all duration-200 flex-shrink-0",
                                pathname === href
                                    ? "text-[var(--brand-end)]"
                                    : "text-slate-500 dark:text-slate-400 group-hover:text-[var(--brand-start)] group-hover:scale-110"
                            )}
                            aria-hidden="true"
                        />
                        <span className="font-medium text-sm flex-1">{label}</span>
                        {children && (
                            <button
                                onClick={toggleSubmenu}
                                className="p-0.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
                                aria-label={isOpen ? "Collapse submenu" : "Expand submenu"}
                            >
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 transition-transform duration-200",
                                        isOpen && "rotate-180"
                                    )}
                                />
                            </button>
                        )}
                    </Link>
                </div>
            </Tooltip>
            
            {/* Submenu */}
            {children && isOpen && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                    {children}
                </div>
            )}
        </div>
    );
});

/* ---------- Submenu Item ---------- */
const SubmenuItem = memo(function SubmenuItem({
    href,
    icon: Icon,
    label,
    onClick,
}: {
    href: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
}) {
    const pathname = usePathname();
    const active = pathname === href;

    const handleClick = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <Link
            href={href}
            onClick={handleClick}
            className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                active
                    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
            )}
        >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
        </Link>
    );
});

/* ---------- Sidebar Inner ---------- */
const SidebarInner = memo(function SidebarInner({ 
    onCloseAction 
}: { 
    onCloseAction?: () => void 
}) {
    // Memoize close handler
    const handleClose = useCallback(() => {
        onCloseAction?.();
    }, [onCloseAction]);

    return (
        <TooltipProvider>
        <aside className="flex h-full w-full flex-col justify-between p-5">
            {/* Top section */}
            <div className="space-y-2">
                {/* Brand Header */}
                <div className="flex items-center justify-between mb-4">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2.5 group"
                        onClick={handleClose}
                    >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[var(--brand-start)] to-[var(--brand-end)] shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">IA</span>
                        </div>
                        <div>
                            <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                                Imaginears
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
                                Admin Portal
                            </div>
                        </div>
                    </Link>
                    {onCloseAction && (
                        <Tooltip content="Close menu" side="left">
                            <button
                                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Close menu"
                                type="button"
                                onClick={handleClose}
                            >
                                <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </button>
                        </Tooltip>
                    )}
                </div>

                {/* Main Navigation */}
                <nav aria-label="Main navigation" className="space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
                        Main
                    </div>
                    <NavItem 
                        href="/admin/dashboard" 
                        icon={LayoutDashboard} 
                        label="Dashboard" 
                        onClick={handleClose} 
                    />
                    <NavItem 
                        href="/admin/events" 
                        icon={CalendarRange} 
                        label="Events" 
                        onClick={handleClose} 
                    />
                    <NavItem 
                        href="/admin/applications" 
                        icon={FileText} 
                        label="Applications" 
                        onClick={handleClose} 
                    />
                    <NavItem 
                        href="/admin/sessions" 
                        icon={Activity} 
                        label="Sessions" 
                        onClick={handleClose} 
                    />
                    
                    {/* Management Section */}
                    <div className="pt-3">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
                            Management
                        </div>
                        <NavItem 
                            href="/admin/players" 
                            icon={Users} 
                            label="Players" 
                            onClick={handleClose} 
                        />
                        <NavItem 
                            href="/admin/staff" 
                            icon={UserCog} 
                            label="Cast Members" 
                            onClick={handleClose} 
                        />
                        <NavItemWithSubmenu
                            href="/admin/roles" 
                            icon={Shield} 
                            label="User Roles" 
                            onClick={handleClose}
                        >
                            <SubmenuItem
                                href="/admin/roles/configure"
                                icon={Sliders}
                                label="Configure Roles"
                                onClick={handleClose}
                            />
                        </NavItemWithSubmenu>
                    </div>

                    {/* System Section */}
                    <div className="pt-3">
                        <Separator className="mb-3" />
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
                            System
                        </div>
                        <NavItem 
                            href="/profile" 
                            icon={User} 
                            label="My Profile" 
                            onClick={handleClose} 
                        />
                        <NavItem 
                            href="/admin/api-docs" 
                            icon={BookOpen} 
                            label="API Documentation" 
                            onClick={handleClose} 
                        />
                        <NavItem 
                            href="/admin/settings" 
                            icon={Settings} 
                            label="Settings" 
                            onClick={handleClose} 
                        />
                    </div>
                </nav>
            </div>

            {/* Bottom section */}
            <div className="mt-6 space-y-3 pt-4">
                <Separator className="mb-4" />
                <SignOutButton />
                
                <div className="flex items-center justify-center gap-2 text-[11px]">
                    <Badge variant="default" className="font-mono">
                        v1.0.0
                    </Badge>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="font-medium text-slate-500 dark:text-slate-400">{CURRENT_YEAR}</span>
                </div>
            </div>
        </aside>
        </TooltipProvider>
    );
});

/* ---------- Desktop Sidebar ---------- */
export const SidebarDesktop = memo(function SidebarDesktop() {
    return (
        <div className="hidden md:block sticky top-4">
            <div className="card overflow-hidden backdrop-blur-sm">
                <div className="card-content p-0">
                    <SidebarInner />
                </div>
            </div>
        </div>
    );
});

/* ---------- Mobile Drawer Sidebar ---------- */
export const SidebarDrawer = memo(function SidebarDrawer({
    open,
    onCloseAction,
}: {
    open: boolean;
    onCloseAction: () => void;
}) {
    return (
        <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onCloseAction()}>
            <Dialog.Portal>
                {/* Backdrop Overlay */}
                <Dialog.Overlay
                    className={cn(
                        "fixed inset-0 z-40 md:hidden",
                        "bg-black/50 backdrop-blur-sm",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                    )}
                />
                
                {/* Drawer Panel */}
                <Dialog.Content
                    className={cn(
                        "fixed top-0 bottom-0 left-0 z-50 md:hidden",
                        "w-[18rem] max-w-[85%]",
                        "bg-white dark:bg-slate-900",
                        "shadow-2xl",
                        "overflow-y-auto",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
                        "data-[state=closed]:duration-200 data-[state=open]:duration-300"
                    )}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    aria-describedby={undefined}
                >
                    <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
                    <SidebarInner onCloseAction={onCloseAction} />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
});
