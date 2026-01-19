"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function saveDocument(data: {
    name: string;
    file_url: string;
    file_path: string;
    content: string;
    file_type: 'pdf' | 'docx' | 'txt';
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User must be logged in to save a document')
    }

    const { error } = await supabase.from('documents').insert([
        {
            ...data,
            user_id: user.id
        },
    ])

    if (error) {
        console.error('Error saving document:', error.message)
        return { error: error.message }
    }

    revalidatePath('/documents')
    return { success: true }
}

export async function getDocuments() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { documents: [] }
    }

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching documents:', error.message)
        return { documents: [], error: error.message }
    }

    return { documents: data || [] }
}

export async function deleteDocument(id: string, filePath: string) {
    const supabase = await createClient()

    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

    if (storageError) {
        console.error('Error deleting from storage:', storageError.message)
    }

    // Delete from database
    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting document:', error.message)
        return { error: error.message }
    }

    revalidatePath('/documents')
    return { success: true }
}
