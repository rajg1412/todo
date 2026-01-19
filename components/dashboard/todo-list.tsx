"use client"

import * as React from "react"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { addTodo, toggleTodo, deleteTodo } from "@/app/(dashboard)/tasks/actions"

interface Todo {
    id: string
    task: string
    is_completed: boolean
    created_at: string
}

interface TodoListProps {
    initialTodos: Todo[]
}

export function TodoList({ initialTodos }: TodoListProps) {
    const [task, setTask] = React.useState("")
    const [isAdding, setIsAdding] = React.useState(false)

    async function handleAddTodo(e: React.FormEvent) {
        e.preventDefault()
        if (!task.trim()) return

        setIsAdding(true)
        const result = await addTodo(task)
        setIsAdding(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            setTask("")
            toast.success("Task added!")
        }
    }

    async function handleToggle(id: string, completed: boolean) {
        const result = await toggleTodo(id, completed)
        if (result?.error) {
            toast.error(result.error)
        }
    }

    async function handleDelete(id: string) {
        const result = await deleteTodo(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Task deleted")
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>Keep track of what you need to do.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleAddTodo} className="flex gap-2">
                    <Input
                        placeholder="What needs to be done?"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        disabled={isAdding}
                    />
                    <Button type="submit" disabled={isAdding}>
                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Add</span>
                    </Button>
                </form>

                <div className="space-y-3">
                    {initialTodos.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">
                            No tasks yet. Add one above!
                        </p>
                    ) : (
                        initialTodos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((todo) => (
                            <div
                                key={todo.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id={todo.id}
                                        checked={todo.is_completed}
                                        onCheckedChange={(checked) => handleToggle(todo.id, checked as boolean)}
                                    />
                                    <label
                                        htmlFor={todo.id}
                                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${todo.is_completed ? "line-through text-muted-foreground" : ""
                                            }`}
                                    >
                                        {todo.task}
                                    </label>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(todo.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
