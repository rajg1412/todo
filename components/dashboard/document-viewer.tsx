"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentViewerProps {
    content: string
    fileName: string
    fileType: 'pdf' | 'docx' | 'txt'
    fileUrl?: string
}

export function DocumentViewer({ content, fileName, fileType, fileUrl }: DocumentViewerProps) {
    // Parse content to preserve formatting
    const isHtml = content.trim().startsWith('<') && content.trim().endsWith('>')

    const renderContent = () => {
        if (!content) {
            return <p className="text-muted-foreground italic">No content to display</p>
        }

        if (isHtml) {
            return (
                <div
                    className="document-html-content space-y-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )
        }

        // Split content into lines for non-HTML content (PDF/TXT)
        const lines = content.split('\n')

        return lines.map((line, index) => {
            // Skip empty lines but preserve spacing
            if (line.trim() === '') {
                return <div key={index} className="h-4" />
            }

            // Regular paragraph with better spacing and preservation of leading spaces if any
            return (
                <p key={index} className="mb-3 leading-relaxed whitespace-pre-wrap">
                    {line}
                </p>
            )
        })
    }

    return (
        <Card className="w-full">
            <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle className="text-lg">{fileName}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {fileType.toUpperCase()} Document • Read-only
                            </p>
                        </div>
                    </div>
                    {fileUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(fileUrl, '_blank')}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Original
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="prose prose-sm max-w-none">
                    <div className="bg-muted/20 rounded-lg p-6 border">
                        <div className="font-serif text-base text-foreground">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
