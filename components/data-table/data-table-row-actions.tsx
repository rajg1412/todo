"use client"

import * as React from "react"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import { toast } from "sonner"
import { EditTaskDialog } from "@/components/dashboard/edit-task-dialog"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableRowActionsProps<TData> {
    row: Row<TData>
}

export function DataTableRowActions<TData>({
    row,
}: DataTableRowActionsProps<TData>) {
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task = (row.original as any)


    return (
        <>
            <EditTaskDialog
                task={task}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex h-8 w-8 p-0 data-[state=open]:bg-accent"
                    >
                        <DotsHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>View Details</DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            navigator.clipboard.writeText(task.id)
                            toast.success("Task ID copied to clipboard")
                        }}
                    >
                        Copy Task ID
                    </DropdownMenuItem>
                    {task.attachment_url && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => window.open(task.attachment_url, '_blank')}
                            >
                                View Attachment
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
