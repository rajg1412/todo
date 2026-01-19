"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DocumentViewer } from "@/components/dashboard/document-viewer"
import { uploadFile } from "@/utils/supabase/upload"
import { toast } from "sonner"
import { Upload, Loader2, X, FileText, Trash2 } from "lucide-react"
import { saveDocument, getDocuments, deleteDocument } from "@/app/(dashboard)/documents/actions"

import mammoth from "mammoth"

interface StoredDocument {
    id: string;
    name: string;
    file_url: string;
    file_path: string;
    content: string;
    file_type: 'pdf' | 'docx' | 'txt';
    created_at: string;
}

export function DocumentsContent() {
    const [file, setFile] = React.useState<File | null>(null)
    const [uploading, setUploading] = React.useState(false)
    const [extracting, setExtracting] = React.useState(false)
    const [extractedContent, setExtractedContent] = React.useState<string>('')
    const [fileUrl, setFileUrl] = React.useState<string | null>(null)
    const [fileType, setFileType] = React.useState<'pdf' | 'docx' | 'txt'>('txt')

    const [storedDocuments, setStoredDocuments] = React.useState<StoredDocument[]>([])
    const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(true)
    const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null)

    // Load documents on mount
    React.useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        setIsLoadingDocuments(true)
        try {
            const { documents, error } = await getDocuments()
            if (error) throw new Error(error)
            setStoredDocuments(documents as StoredDocument[])
        } catch (error: any) {
            toast.error("Failed to load documents")
        } finally {
            setIsLoadingDocuments(false)
        }
    }

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
            setSelectedDocId(null)

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
        if (!file || !extractedContent) return

        setUploading(true)
        try {
            const { publicUrl, filePath } = await uploadFile(file)

            const result = await saveDocument({
                name: file.name,
                file_url: publicUrl,
                file_path: filePath,
                content: extractedContent,
                file_type: fileType
            })

            if (result.error) throw new Error(result.error)

            setFileUrl(publicUrl)
            toast.success('Document saved to database!')
            fetchDocuments() // Refresh list
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Upload failed.')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string, filePath: string) => {
        e.stopPropagation() // Prevent selecting the doc
        if (!confirm("Are you sure you want to delete this document?")) return

        try {
            const result = await deleteDocument(id, filePath)
            if (result.error) throw new Error(result.error)
            toast.success("Document deleted")
            if (selectedDocId === id) {
                setExtractedContent('')
                setFileUrl(null)
                setSelectedDocId(null)
            }
            fetchDocuments()
        } catch (error: any) {
            toast.error("Failed to delete document")
        }
    }

    const selectDocument = (doc: StoredDocument) => {
        setSelectedDocId(doc.id)
        setFile(null) // Clear current selection
        setExtractedContent(doc.content)
        setFileUrl(doc.file_url)
        setFileType(doc.file_type)
    }

    const clearCurrentView = () => {
        setFile(null)
        setFileUrl(null)
        setExtractedContent('')
        setSelectedDocId(null)
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/20 p-4 md:p-8">
            <div className="mx-auto w-full max-w-5xl space-y-8">
                <header className="border-b pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Document Hub</h1>
                        <p className="text-muted-foreground pt-1">
                            Securely store and view your important documents
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: List & Upload */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Upload Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    New Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!file ? (
                                    <label
                                        htmlFor="file-upload"
                                        className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group"
                                    >
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            accept=".pdf,.docx,.txt"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <p className="mt-2 text-xs font-medium">Click to upload</p>
                                    </label>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-2 border rounded bg-muted/30">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                                <span className="text-xs font-medium truncate">{file.name}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearCurrentView}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        {extracting ? (
                                            <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                                Extracting...
                                            </div>
                                        ) : (
                                            !fileUrl && (
                                                <Button className="w-full h-8 text-xs" onClick={handleUpload} disabled={uploading}>
                                                    {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                                                    Save Document
                                                </Button>
                                            )
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stored Documents List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Documents</h3>
                            {isLoadingDocuments ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                                    ))}
                                </div>
                            ) : storedDocuments.length === 0 ? (
                                <div className="text-center py-8 border rounded-lg bg-muted/10">
                                    <p className="text-xs text-muted-foreground">No documents saved yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                    {storedDocuments.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => selectDocument(doc)}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm group relative ${selectedDocId === doc.id ? 'bg-primary/5 border-primary' : 'bg-card hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <FileText className={`h-5 w-5 mt-0.5 ${selectedDocId === doc.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-bold truncate leading-none mb-2">{doc.name}</p>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {doc.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, doc.id, doc.file_path)}
                                                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Viewer */}
                    <div className="lg:col-span-2">
                        {extractedContent && fileUrl ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <DocumentViewer
                                    content={extractedContent}
                                    fileName={file?.name || storedDocuments.find(d => d.id === selectedDocId)?.name || 'Document'}
                                    fileType={fileType}
                                    fileUrl={fileUrl}
                                />
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/5">
                                <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                <p className="text-muted-foreground font-medium">Select a document to view</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Upload new files on the left to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
