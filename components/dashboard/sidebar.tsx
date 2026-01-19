"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    FileText,
    Upload,
    Settings,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard
} from "lucide-react"

interface SidebarProps {
    isAdmin?: boolean
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    // Load collapse state from localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved !== null) {
            setIsCollapsed(saved === 'true')
        }
    }, [])

    // Save collapse state to localStorage
    const toggleCollapse = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem('sidebar-collapsed', String(newState))
    }

    const menuItems = [
        {
            title: "Admin Panel",
            href: "/admin",
            icon: Settings,
            adminOnly: true,
        },
        {
            title: "Add Task",
            href: "/tasks",
            icon: FileText,
        },
        {
            title: "Add Document",
            href: "/documents",
            icon: Upload,
        },
    ]

    const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin)

    return (
        <aside
            className={cn(
                "relative z-40 flex h-screen flex-col border-r bg-background transition-all duration-300 ease-in-out shadow-sm",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!isCollapsed && (
                    <Link href="/tasks" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
                        <LayoutDashboard className="h-6 w-6" />
                        <span>TodoApp</span>
                    </Link>
                )}
                {isCollapsed && (
                    <Link href="/tasks" className="flex items-center justify-center w-full">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                    </Link>
                )}
            </div>

            {/* Menu Items */}
            <nav className="flex-1 space-y-1.5 p-3">
                {filteredMenuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all hover:bg-muted/50",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:text-foreground",
                                isCollapsed && "justify-center px-0"
                            )}
                            title={isCollapsed ? item.title : undefined}
                        >
                            <Icon className={cn(
                                "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                            )} />
                            {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse Toggle Button */}
            <div className="border-t p-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapse}
                    className={cn(
                        "w-full",
                        isCollapsed && "justify-center"
                    )}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            <span>Collapse</span>
                        </>
                    )}
                </Button>
            </div>
        </aside>
    )
}
