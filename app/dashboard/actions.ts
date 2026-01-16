"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function addTodo(task: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User must be logged in to add a todo')
    }

    const { error } = await supabase.from('todos').insert([
        { task, user_id: user.id, is_completed: false },
    ])

    if (error) {
        console.error('Error adding todo:', error.message)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
}

export async function toggleTodo(id: string, is_completed: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('todos')
        .update({ is_completed })
        .eq('id', id)

    if (error) {
        console.error('Error toggling todo:', error.message)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
}

export async function deleteTodo(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('todos').delete().eq('id', id)

    if (error) {
        console.error('Error deleting todo:', error.message)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
}
