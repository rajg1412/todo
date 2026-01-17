"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { addTodo } from "@/app/dashboard/actions"

export function AddTaskDialog() {
    const [open, setOpen] = React.useState(false)
    const [task, setTask] = React.useState("")
    const [priority, setPriority] = React.useState("medium")
    const [label, setLabel] = React.useState("feature")
    const [status, setStatus] = React.useState("todo")
    const [isLoading, setIsLoading] = React.useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!task.trim()) return

        setIsLoading(true)
        try {
            const result = await addTodo(task, priority, label, status)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Task added successfully!")
                setOpen(false)
                setTask("")
            }
        } catch (error) {
            toast.error("Failed to add task")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Task</DialogTitle>
                        <DialogDescription>
                            Create a new task with priority and label settings.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="task">Task Title</Label>
                            <Input
                                id="task"
                                placeholder="What needs to be done?"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="backlog">Backlog</SelectItem>
                                        <SelectItem value="todo">Todo</SelectItem>
                                        <SelectItem value="in progress">In Progress</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={priority}
                                    onValueChange={setPriority}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="priority">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="label">Label</Label>
                            <Select
                                value={label}
                                onValueChange={setLabel}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="label">
                                    <SelectValue placeholder="Select label" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="feature">Feature</SelectItem>
                                    <SelectItem value="bug">Bug</SelectItem>
                                    <SelectItem value="documentation">Documentation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading || !task.trim()}>
                            {isLoading ? "Adding..." : "Add Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
