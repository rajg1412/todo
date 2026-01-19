"use client"

import dynamic from "next/dynamic"

const DocumentsContent = dynamic(
    () => import("@/components/dashboard/documents-content").then(mod => mod.DocumentsContent),
    { ssr: false }
)

export default function DocumentsPage() {
    return <DocumentsContent />
}
