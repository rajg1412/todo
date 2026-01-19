import { createClient } from './client'

export async function uploadFile(file: File, bucket: string = 'documents') {
    const supabase = createClient()

    // Create a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = fileName

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

    if (error) {
        throw error
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

    return { publicUrl, filePath }
}
