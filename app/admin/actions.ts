"use server"

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function getAllProfiles() {
    const supabase = await createClient()

    // Check if requesting user is admin using regular client
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) return { error: "Not authorized" }

    // Use admin client to bypass RLS and see all profiles
    const adminSupabase = await createAdminClient()
    const { data: profiles, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .order('email')

    if (error) return { error: error.message }
    return { profiles }
}

export async function updateProfile(id: string, updates: any) {
    const supabase = await createAdminClient()

    // Protected Admin Email check
    const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', id)
        .single()

    if (profile?.email === 'rajg50103@gmail.com') {
        return { error: "This primary admin account cannot be modified." }
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteUser(id: string) {
    const supabase = await createAdminClient()

    // Protected Admin Email check
    const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', id)
        .single()

    if (profile?.email === 'rajg50103@gmail.com') {
        return { error: "This primary admin account cannot be deleted." }
    }

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    return { success: true }
}

export async function getUserTodos(userId: string) {
    const supabase = await createAdminClient()
    const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { todos }
}

export async function adminAddTodo(userId: string, task: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('todos')
        .insert([{ user_id: userId, task, is_completed: false }])

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return { success: true }
}

export async function adminToggleTodo(todoId: string, is_completed: boolean) {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('todos')
        .update({ is_completed })
        .eq('id', todoId)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return { success: true }
}

export async function adminDeleteTodo(todoId: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return { success: true }
}
