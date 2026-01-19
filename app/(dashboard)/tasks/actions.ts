"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function addTodo(
    task: string,
    priority: string = "medium",
    label: string = "feature",
    status: string = "todo",
    description?: string,
    attachment_url?: string
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User must be logged in to add a todo')
    }

    const { error } = await supabase.from('todos').insert([
        {
            task,
            user_id: user.id,
            is_completed: false,
            priority,
            label,
            status: status || 'todo',
            description,
            attachment_url
        },
    ])

    if (error) {
        console.error('Error adding todo:', error.message)
        return { error: error.message }
    }

    revalidatePath('/tasks')
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

    revalidatePath('/tasks')
}

export async function deleteTodo(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('todos').delete().eq('id', id)

    if (error) {
        console.error('Error deleting todo:', error.message)
        return { error: error.message }
    }

    revalidatePath('/tasks')
}

export async function updateTodo(id: string, updates: {
    task?: string,
    priority?: string,
    label?: string,
    status?: string,
    is_completed?: boolean
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Error updating todo:', error.message)
        return { error: error.message }
    }

    revalidatePath('/tasks')
}
