"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { updateTodo } from "@/app/dashboard/actions"

interface EditTaskDialogProps {
    task: {
        realId: string
        title: string
        status: string
        priority: string
        label: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
    const [title, setTitle] = React.useState(task.title)
    const [status, setStatus] = React.useState(task.status)
    const [priority, setPriority] = React.useState(task.priority)
    const [label, setLabel] = React.useState(task.label)
    const [isLoading, setIsLoading] = React.useState(false)

    React.useEffect(() => {
        setTitle(task.title)
        setStatus(task.status)
        setPriority(task.priority)
        setLabel(task.label)
    }, [task])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) return

        setIsLoading(true)
        try {
            const result = await updateTodo(task.realId, {
                task: title,
                status,
                priority,
                label,
                is_completed: status === "done"
            })

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Task updated successfully!")
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Failed to update task")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                            Update the details of your task.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Task Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
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
                                        <SelectItem value="canceled">Canceled</SelectItem>
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
                        <Button type="submit" disabled={isLoading || !title.trim()}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
