"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DocumentViewer } from "@/components/dashboard/document-viewer"
import { uploadFile } from "@/utils/supabase/upload"
import { toast } from "sonner"
import { Upload, Loader2, X, FileText } from "lucide-react"

import mammoth from "mammoth"

export function DocumentsContent() {
    const [file, setFile] = React.useState<File | null>(null)
    const [uploading, setUploading] = React.useState(false)
    const [extracting, setExtracting] = React.useState(false)
    const [extractedContent, setExtractedContent] = React.useState<string>('')
    const [fileUrl, setFileUrl] = React.useState<string | null>(null)
    const [fileType, setFileType] = React.useState<'pdf' | 'docx' | 'txt'>('txt')

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]

            // Validate file type
            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
            if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx') && !selectedFile.name.endsWith('.txt')) {
                toast.error('Invalid file type. Please upload PDF, DOCX, or TXT files only.')
                return
            }

            // Validate file size (5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size exceeds 5MB limit')
                return
            }

            setFile(selectedFile)
            setFileUrl(null)
            setExtractedContent('')

            // Determine file type
            let type: 'pdf' | 'docx' | 'txt' = 'txt'
            if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
                type = 'pdf'
            } else if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.name.endsWith('.docx')) {
                type = 'docx'
            }
            setFileType(type)

            // Extract content
            setExtracting(true)
            try {
                let content = ''
                if (type === 'docx') {
                    const arrayBuffer = await selectedFile.arrayBuffer()
                    const result = await mammoth.convertToHtml({ arrayBuffer })
                    content = result.value // This is HTML
                } else if (type === 'pdf') {
                    const pdfjsLib = await import("pdfjs-dist")
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`
                    const arrayBuffer = await selectedFile.arrayBuffer()
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
                    const pdf = await loadingTask.promise
                    let fullText = ""
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i)
                        const textContent = await page.getTextContent()

                        // Sort items by transform[5] (y-coordinate) descending, then by transform[4] (x-coordinate)
                        const items = textContent.items as any[]
                        let lastY: number | null = null
                        let pageText = ""

                        for (const item of items) {
                            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                                pageText += "\n"
                            }
                            pageText += item.str + " "
                            lastY = item.transform[5]
                        }
                        fullText += pageText + "\n\n"
                    }
                    content = fullText.trim()
                } else {
                    const text = await selectedFile.text()
                    content = text.split('\n').map(line => `<p>${line}</p>`).join('')
                }
                setExtractedContent(content)
                toast.success('Content extracted successfully!')
            } catch (err: any) {
                console.error('Extraction failed:', err)
                toast.error(`Extraction failed: ${err.message || 'Unknown error'}`)
            } finally {
                setExtracting(false)
            }
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        try {
            const { publicUrl } = await uploadFile(file)
            setFileUrl(publicUrl)
            toast.success('Document uploaded successfully!')
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Upload failed.')
        } finally {
            setUploading(false)
        }
    }

    const clearFile = () => {
        setFile(null)
        setFileUrl(null)
        setExtractedContent('')
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/20 p-4 md:p-8">
            <div className="mx-auto w-full max-w-5xl space-y-8">
                <header className="border-b pb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Document Viewer</h1>
                    <p className="text-muted-foreground pt-1">
                        Upload and view documents in read-only mode
                    </p>
                </header>

                {/* Upload Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload Document
                        </CardTitle>
                        <CardDescription>
                            Select a PDF, DOCX, or TXT file (max 5MB)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!file ? (
                            <div className="relative">
                                <label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer group"
                                >
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <p className="mt-4 text-sm font-medium">Click to browse or drag and drop</p>
                                    <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, or TXT (max 5MB)</p>
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <FileText className="h-6 w-6 flex-shrink-0 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    {!uploading && !extracting && (
                                        <Button variant="ghost" size="icon" onClick={clearFile}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {extracting && (
                                    <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/30">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span className="text-sm font-medium">Extracting content...</span>
                                    </div>
                                )}

                                {!fileUrl && !extracting && extractedContent && (
                                    <Button
                                        className="w-full"
                                        onClick={handleUpload}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Upload & View Document
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Document Viewer Section */}
                {extractedContent && fileUrl && (
                    <DocumentViewer
                        content={extractedContent}
                        fileName={file?.name || 'Document'}
                        fileType={fileType}
                        fileUrl={fileUrl}
                    />
                )}
            </div>
        </div>
    )
}
