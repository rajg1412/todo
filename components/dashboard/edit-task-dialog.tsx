"use client"

import * as React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink } from "lucide-react"

interface EditTaskDialogProps {
    task: {
        realId: string
        title: string
        status: string
        priority: string
        label: string
        description?: string
        attachment_url?: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Task Details</DialogTitle>
                    <DialogDescription>
                        View the details of this task.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                            id="title"
                            value={task.title}
                            disabled
                            className="bg-muted/50"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={task.status} disabled>
                                <SelectTrigger id="status" className="bg-muted/50">
                                    <SelectValue />
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
                            <Select value={task.priority} disabled>
                                <SelectTrigger id="priority" className="bg-muted/50">
                                    <SelectValue />
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
                        <Select value={task.label} disabled>
                            <SelectTrigger id="label" className="bg-muted/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="feature">Feature</SelectItem>
                                <SelectItem value="bug">Bug</SelectItem>
                                <SelectItem value="documentation">Documentation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {task.description && (
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={task.description}
                                disabled
                                className="min-h-[120px] resize-none bg-muted/50"
                            />
                        </div>
                    )}
                    {task.attachment_url && (
                        <div className="grid gap-2">
                            <Label>Attachment</Label>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => window.open(task.attachment_url, '_blank')}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Attached File
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
