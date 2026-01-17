"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Edit2, Loader2, Plus, Trash2, CheckCircle2, Circle } from "lucide-react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
    updateProfile,
    getUserTodos,
    adminAddTodo,
    adminToggleTodo,
    adminDeleteTodo
} from "@/app/admin/actions"

interface Profile {
    id: string
    email: string | null
    full_name: string | null
    is_admin: boolean | null
}

interface Todo {
    id: string
    task: string
    is_completed: boolean
    created_at: string
}

interface EditProfileDialogProps {
    profile: Profile
    currentUserRole?: { is_admin: boolean; email: string } | null
}

export function EditProfileDialog({ profile, currentUserRole }: EditProfileDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<"profile" | "tasks">("profile")
    const [isLoading, setIsLoading] = React.useState(false)
    const [name, setName] = React.useState(profile.full_name || "")

    // Todo state
    const [todos, setTodos] = React.useState<Todo[]>([])
    const [isTodosLoading, setIsTodosLoading] = React.useState(false)
    const [newTask, setNewTask] = React.useState("")

    const router = useRouter()

    // Fetch todos when tasks tab is opened
    React.useEffect(() => {
        if (isOpen && activeTab === "tasks") {
            fetchTodos()
        }
    }, [isOpen, activeTab])

    async function fetchTodos() {
        setIsTodosLoading(true)
        try {
            const result = await getUserTodos(profile.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                setTodos(result.todos || [])
            }
        } catch (error) {
            toast.error("Failed to fetch tasks")
        } finally {
            setIsTodosLoading(false)
        }
    }

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        try {
            const result = await updateProfile(profile.id, { full_name: name })
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Profile updated")
                setIsOpen(false)
                router.refresh()
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAddTodo(e: React.FormEvent) {
        e.preventDefault()
        if (!newTask.trim()) return
        setIsTodosLoading(true)
        try {
            const result = await adminAddTodo(profile.id, newTask)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Task added")
                setNewTask("")
                fetchTodos()
            }
        } catch (error) {
            toast.error("Failed to add task")
        } finally {
            setIsTodosLoading(false)
        }
    }

    async function handleToggleTodo(todoId: string, isCompleted: boolean) {
        try {
            const result = await adminToggleTodo(todoId, !isCompleted)
            if (result.error) {
                toast.error(result.error)
            } else {
                setTodos(todos.map(t => t.id === todoId ? { ...t, is_completed: !isCompleted } : t))
            }
        } catch (error) {
            toast.error("Failed to update task")
        }
    }

    async function handleDeleteTodo(todoId: string) {
        try {
            const result = await adminDeleteTodo(todoId)
            if (result.error) {
                toast.error(result.error)
            } else {
                setTodos(todos.filter(t => t.id !== todoId))
                toast.success("Task deleted")
            }
        } catch (error) {
            toast.error("Failed to delete task")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    <Edit2 className="mr-2 h-3 w-3" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Management</DialogTitle>
                    <DialogDescription>
                        Managing account for {profile.email}
                    </DialogDescription>
                </DialogHeader>

                {/* Custom Tabs */}
                <div className="flex border-b px-6">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Profile
                    </button>
                    {/* Hide Tasks tab if non-superadmin trying to view superadmin's tasks */}
                    {!(currentUserRole?.email !== 'rajg50103@gmail.com' && profile.email === 'rajg50103@gmail.com') && (
                        <button
                            onClick={() => setActiveTab("tasks")}
                            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "tasks"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Tasks
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === "profile" ? (
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter full name"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid gap-1 py-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">User Metadata</p>
                                <div className="rounded-md border bg-muted/30 p-2 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">ID:</span>
                                        <span className="font-mono text-[10px]">{profile.id}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Role:</span>
                                        <span>{profile.is_admin ? "Administrator" : "Standard User"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <form onSubmit={handleAddTodo} className="flex gap-2">
                                <Input
                                    placeholder="Add a task for this user..."
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    disabled={isTodosLoading}
                                    className="h-9"
                                />
                                <Button type="submit" size="sm" disabled={isTodosLoading || !newTask.trim()}>
                                    {isTodosLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </form>

                            <Separator />

                            <div className="space-y-1">
                                {isTodosLoading && todos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground animate-pulse">
                                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                        <p className="text-xs">Loading tasks...</p>
                                    </div>
                                ) : todos.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p className="text-sm">No tasks found for this user.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        {todos.map((todo) => (
                                            <div
                                                key={todo.id}
                                                className={`flex items-center gap-3 p-2 rounded-md border transition-all ${todo.is_completed ? "bg-muted/30 opacity-70" : "bg-card shadow-sm"
                                                    }`}
                                            >
                                                <Checkbox
                                                    checked={todo.is_completed}
                                                    onCheckedChange={() => handleToggleTodo(todo.id, todo.is_completed)}
                                                />
                                                <span className={`text-sm flex-1 break-words ${todo.is_completed ? "line-through" : ""}`}>
                                                    {todo.task}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteTodo(todo.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
