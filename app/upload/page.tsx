import { FileUpload } from '@/components/FileUpload'

export default function UploadPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Supabase Storage</h1>
                    <p className="text-muted-foreground">
                        Upload files to your Supabase bucket. The limit is 5MB as per your configuration.
                    </p>
                </div>

                <div className="flex justify-center">
                    <FileUpload />
                </div>

                <div className="mt-12 p-6 border rounded-xl bg-card">
                    <h3 className="text-lg font-semibold mb-3">Quick Setup Guide</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground font-medium">
                        <li>Ensure you have a bucket named <code className="bg-muted px-1 rounded text-primary">image</code> in Supabase.</li>
                        <li>Set the bucket to <span className="text-primary font-bold">Public</span> or configure appropriate RLS policies.</li>
                        <li>Check the <code className="bg-muted px-1 rounded text-primary">.env.local</code> for correct Supabase credentials.</li>
                        <li>Maximum file size is restricted to 5MB by your Supabase settings.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
