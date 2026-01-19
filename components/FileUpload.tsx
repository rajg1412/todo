'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { uploadFile } from '@/utils/supabase/upload'
import { toast } from 'sonner'
import { Upload, File, X, Loader2 } from 'lucide-react'

import mammoth from 'mammoth'
// pdfjs-dist will be imported dynamically to avoid evaluation errors

export function FileUpload() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [extracting, setExtracting] = useState(false)
    const [url, setUrl] = useState<string | null>(null)
    const [extractedContent, setExtractedContent] = useState<string>('')

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size exceeds 5MB limit')
                return
            }
            setFile(selectedFile)
            setUrl(null)
            setExtractedContent('')

            setExtracting(true)
            try {
                let text = ''
                if (selectedFile.name.endsWith('.docx')) {
                    const arrayBuffer = await selectedFile.arrayBuffer()
                    const result = await mammoth.extractRawText({ arrayBuffer })
                    text = result.value
                } else if (selectedFile.name.endsWith('.pdf') || selectedFile.type === 'application/pdf') {
                    const pdfjsLib = await import("pdfjs-dist")
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`
                    const arrayBuffer = await selectedFile.arrayBuffer()
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
                    const isBinary = selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.docx')
                    if (!isBinary) {
                        text = await selectedFile.text()
                    } else {
                        throw new Error('Unsupported file type for extraction')
                    }
                }
                setExtractedContent(text)
                toast.success('Content extracted!')
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
            setUrl(publicUrl)
            toast.success('Original file saved to Supabase!')
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Upload failed.')
        } finally {
            setUploading(false)
        }
    }

    const clearFile = () => {
        setFile(null)
        setUrl(null)
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload to Supabase
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="file">Select File (Max 5MB)</Label>
                    {!file ? (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative group">
                            <Input
                                id="file"
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={handleFileChange}
                            />
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                            <p className="mt-2 text-sm text-muted-foreground">Click to browse or drag and drop</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <File className="h-6 w-6 flex-shrink-0 text-primary" />
                                <span className="text-sm font-medium truncate">{file.name}</span>
                            </div>
                            {!uploading && (
                                <Button variant="ghost" size="icon" onClick={clearFile}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {extracting && (
                    <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/30">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm font-medium">Extracting content...</span>
                    </div>
                )}

                {extractedContent && !extracting && (
                    <div className="space-y-2">
                        <Label>Extracted Content</Label>
                        <div className="p-3 border rounded-lg bg-muted/20 max-h-40 overflow-y-auto text-xs whitespace-pre-wrap font-mono">
                            {extractedContent}
                        </div>
                    </div>
                )}

                {file && !url && (
                    <Button
                        className="w-full"
                        onClick={handleUpload}
                        disabled={uploading || extracting}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving Original...
                            </>
                        ) : (
                            'Save original document'
                        )}
                    </Button>
                )}

                {url && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg animate-in fade-in zoom-in duration-300">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Upload Successful!</p>
                        <div className="flex flex-col gap-2">
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline break-all"
                            >
                                {url}
                            </a>
                            <Button variant="outline" size="sm" onClick={clearFile} className="mt-2">
                                Upload Another
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
