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
import { addTodo } from "@/app/(dashboard)/tasks/actions"

import { Textarea } from "@/components/ui/textarea"
import { uploadFile } from "@/utils/supabase/upload"
import { FileText, Upload, Loader2, X } from "lucide-react"

import mammoth from "mammoth"
// pdfjs-dist will be imported dynamically to avoid evaluation errors

export function AddTaskDialog() {
    const [open, setOpen] = React.useState(false)
    const [task, setTask] = React.useState("")
    const [priority, setPriority] = React.useState("medium")
    const [label, setLabel] = React.useState("feature")
    const [status, setStatus] = React.useState("todo")
    const [description, setDescription] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [isExtracting, setIsExtracting] = React.useState(false)
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size exceeds 5MB limit")
                return
            }
            setSelectedFile(file)
            setIsExtracting(true)
            setDescription("") // Clear previous

            try {
                let text = ""
                if (file.name.endsWith(".docx")) {
                    const arrayBuffer = await file.arrayBuffer()
                    const result = await mammoth.extractRawText({ arrayBuffer })
                    text = result.value
                } else if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
                    const pdfjsLib = await import("pdfjs-dist")
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`
                    const arrayBuffer = await file.arrayBuffer()
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
                    const pdf = await loadingTask.promise
                    let fullText = ""
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i)
                        const content = await page.getTextContent()
                        const strings = content.items.map((item: any) => item.str)
                        fullText += strings.join(" ") + "\n"
                    }
                    text = fullText.trim()
                } else {
                    const isBinary = file.name.endsWith(".pdf") || file.name.endsWith(".docx")
                    if (!isBinary) {
                        text = await file.text()
                    } else {
                        throw new Error("Unsupported file type for extraction")
                    }
                }

                if (!text) {
                    toast.warning("Extraction complete, but no text was found.")
                } else {
                    setDescription(text)
                    toast.success("Content extracted from document!")
                }
            } catch (error: any) {
                console.error("Extraction error:", error)
                toast.error(`Extraction failed: ${error.message || "Unknown error"}`)
                setDescription("Could not extract text from this file automatically. Please enter a description manually.")
            } finally {
                setIsExtracting(false)
            }
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        setDescription("")
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!task.trim()) {
            toast.error("Please enter a task title")
            return
        }

        setIsLoading(true)
        try {
            let fileUrl = undefined

            // Upload the original selected file if it exists
            if (selectedFile) {
                const uploadResult = await uploadFile(selectedFile)
                fileUrl = uploadResult.publicUrl
            }

            const result = await addTodo(task, priority, label, status, description, fileUrl)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Task added successfully!")
                setOpen(false)
                setTask("")
                setDescription("")
                setSelectedFile(null)
            }
        } catch (error) {
            console.error("Submit error:", error)
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
                            <Label htmlFor="task">Task Title <span className="text-destructive font-bold">*</span></Label>
                            <Input
                                id="task"
                                placeholder="What needs to be done?"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                disabled={isLoading}
                                className={!task.trim() ? "border-destructive/50" : ""}
                            />
                            {!task.trim() && <p className="text-[10px] text-destructive font-medium">Title is required to create a task</p>}
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
                            <Label htmlFor="file" className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Attach File (Max 5MB)
                            </Label>
                            {!selectedFile ? (
                                <div className="relative">
                                    <label
                                        htmlFor="add-task-file"
                                        className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group"
                                    >
                                        <Input
                                            id="add-task-file"
                                            type="file"
                                            accept=".pdf,.docx,.txt"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            disabled={isLoading || isExtracting}
                                        />
                                        <Upload className="mx-auto h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <p className="mt-2 text-xs font-medium">Click to browse or drag and drop</p>
                                    </label>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                                    <div className="flex items-center space-x-2 overflow-hidden">
                                        <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                                        <span className="text-xs font-medium truncate">{selectedFile.name}</span>
                                    </div>
                                    {!isLoading && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFile}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Description / Extracted Content
                            </Label>
                            <div className="relative">
                                <Textarea
                                    id="description"
                                    placeholder="Upload a file to extract content..."
                                    value={description}
                                    readOnly
                                    className="min-h-[120px] resize-none bg-muted/50 cursor-not-allowed"
                                    disabled={true}
                                />
                                {isExtracting && (
                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="ml-2 text-sm font-medium">Extracting...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="label">Label</Label>
                            <Select
                                value={label}
                                onValueChange={setLabel}
                                disabled={isLoading || isExtracting}
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
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Adding..." : "Add Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
