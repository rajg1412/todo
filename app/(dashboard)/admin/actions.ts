"use server"

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/utils/supabase/server'

// Helper function to get current user's role
export async function getCurrentUserRole() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_superadmin, email')
        .eq('id', user.id)
        .single()

    return { profile, userId: user.id }
}

export async function getAllProfiles() {
    const supabase = await createClient()

    // Check if requesting user is admin using regular client
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_superadmin, email')
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

    return { profiles, currentUserRole: profile }
}

export async function updateProfile(id: string, updates: any) {
    const adminSupabase = await createAdminClient()

    // Get current user's role
    const { profile: currentUserProfile, userId: currentUserId, error: roleError } = await getCurrentUserRole()
    if (roleError) return { error: roleError }
    if (!currentUserProfile?.is_admin) return { error: "Not authorized" }

    // Get target profile
    const { data: targetProfile } = await adminSupabase
        .from('profiles')
        .select('email, is_admin, is_superadmin')
        .eq('id', id)
        .single()

    // Prevent modifying the primary superadmin
    if (targetProfile?.is_superadmin) {
        return { error: "This superadmin account cannot be modified." }
    }

    // Role-based authorization checks
    const isSuperadmin = currentUserProfile.is_superadmin
    const isTargetAdmin = targetProfile?.is_admin

    // Regular admins can ONLY modify regular users (not other admins)
    if (!isSuperadmin && isTargetAdmin) {
        return { error: "Only superadmins can modify admin accounts." }
    }

    const { error } = await adminSupabase
        .from('profiles')
        .update(updates)
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    revalidatePath('/tasks')
    return { success: true }
}

export async function deleteUser(id: string) {
    const adminSupabase = await createAdminClient()

    // Get current user's role
    const { profile: currentUserProfile, error: roleError } = await getCurrentUserRole()
    if (roleError) return { error: roleError }
    if (!currentUserProfile?.is_admin) return { error: "Not authorized" }

    // Get target profile
    const { data: targetProfile } = await adminSupabase
        .from('profiles')
        .select('email, is_admin, is_superadmin')
        .eq('id', id)
        .single()

    // Prevent deleting the primary superadmin
    if (targetProfile?.is_superadmin) {
        return { error: "This superadmin account cannot be deleted." }
    }

    // Only superadmins can delete admins
    const isSuperadmin = currentUserProfile.is_superadmin
    const isTargetAdmin = targetProfile?.is_admin

    if (!isSuperadmin && isTargetAdmin) {
        return { error: "Only superadmins can delete admin accounts." }
    }

    const { error } = await adminSupabase.auth.admin.deleteUser(id)
    if (error) return { error: error.message }

    const { error: profileError } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', id)

    if (profileError) return { error: profileError.message }

    revalidatePath('/admin')
    return { success: true }
}

export async function getUserTodos(userId: string) {
    const adminSupabase = await createAdminClient()

    // Get current user's role
    const { profile: currentUserProfile, error: roleError } = await getCurrentUserRole()
    if (roleError) return { error: roleError }
    if (!currentUserProfile?.is_admin) return { error: "Not authorized" }

    // Get target profile
    const { data: targetProfile } = await adminSupabase
        .from('profiles')
        .select('email, is_superadmin')
        .eq('id', userId)
        .single()

    // Only superadmins can view superadmin's tasks
    const isSuperadmin = currentUserProfile.is_superadmin
    if (!isSuperadmin && targetProfile?.is_superadmin) {
        return { error: "Only superadmins can view superadmin's tasks." }
    }

    const { data: todos, error } = await adminSupabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { todos }
}

export async function adminAddTodo(userId: string, task: string, priority: string = "medium", label: string = "feature") {
    const adminSupabase = await createAdminClient()

    // Get current user's role
    const { profile: currentUserProfile, error: roleError } = await getCurrentUserRole()
    if (roleError) return { error: roleError }
    if (!currentUserProfile?.is_admin) return { error: "Not authorized" }

    // Get target user's profile to check if they're superadmin
    const { data: targetProfile } = await adminSupabase
        .from('profiles')
        .select('email, is_superadmin')
        .eq('id', userId)
        .single()

    // Only superadmins can add tasks to superadmin's list
    const isSuperadmin = currentUserProfile.is_superadmin
    if (!isSuperadmin && targetProfile?.is_superadmin) {
        return { error: "Only superadmins can add tasks to superadmin's list." }
    }

    const { error } = await adminSupabase
        .from('todos')
        .insert([{ user_id: userId, task, is_completed: false, priority, label, status: 'todo' }])

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return { success: true }
}

export async function adminToggleTodo(todoId: string, is_completed: boolean) {
    const adminSupabase = await createAdminClient()

    // Get current user's role
    const { profile: currentUserProfile, error: roleError } = await getCurrentUserRole()
    if (roleError) return { error: roleError }
    if (!currentUserProfile?.is_admin) return { error: "Not authorized" }

    // Get the todo to find its owner
    const { data: todo } = await adminSupabase
        .from('todos')
        .select('user_id')
        .eq('id', todoId)
        .single()

    if (todo) {
        // Get the owner's profile
        const { data: ownerProfile } = await adminSupabase
            .from('profiles')
            .select('email, is_superadmin')
            .eq('id', todo.user_id)
            .single()

        // Only superadmins can modify superadmin's tasks
        const isSuperadmin = currentUserProfile.is_superadmin
        if (!isSuperadmin && ownerProfile?.is_superadmin) {
            return { error: "Only superadmins can modify superadmin's tasks." }
        }
    }

    const { error } = await adminSupabase
        .from('todos')
        .update({ is_completed })
        .eq('id', todoId)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return { success: true }
}

export async function adminDeleteTodo(todoId: string) {
    const adminSupabase = await createAdminClient()

    // Get current user's role
    const { profile: currentUserProfile, error: roleError } = await getCurrentUserRole()
    if (roleError) return { error: roleError }
    if (!currentUserProfile?.is_admin) return { error: "Not authorized" }

    // Get the todo to find its owner
    const { data: todo } = await adminSupabase
        .from('todos')
        .select('user_id')
        .eq('id', todoId)
        .single()

    if (todo) {
        // Get the owner's profile
        const { data: ownerProfile } = await adminSupabase
            .from('profiles')
            .select('email, is_superadmin')
            .eq('id', todo.user_id)
            .single()

        // Only superadmins can delete superadmin's tasks
        const isSuperadmin = currentUserProfile.is_superadmin
        if (!isSuperadmin && ownerProfile?.is_superadmin) {
            return { error: "Only superadmins can delete superadmin's tasks." }
        }
    }

    const { error } = await adminSupabase
        .from('todos')
        .delete()
        .eq('id', todoId)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    return { success: true }
}

export async function adminUpdateTodo(todoId: string, updates: any) {
    const adminSupabase = await createAdminClient()

    // Get current user's role
    const { profile: currentUserProfile, error: roleError } = await getCurrentUserRole()
    if (roleError) return { error: roleError }
    if (!currentUserProfile?.is_admin) return { error: "Not authorized" }

    // Get the todo to find its owner
    const { data: todo } = await adminSupabase
        .from('todos')
        .select('user_id')
        .eq('id', todoId)
        .single()

    if (todo) {
        // Get the owner's profile
        const { data: ownerProfile } = await adminSupabase
            .from('profiles')
            .select('email, is_superadmin')
            .eq('id', todo.user_id)
            .single()

        // Only superadmins can modify superadmin's tasks
        const isSuperadmin = currentUserProfile.is_superadmin
        if (!isSuperadmin && ownerProfile?.is_superadmin) {
            return { error: "Only superadmins can modify superadmin's tasks." }
        }
    }

    const { error } = await adminSupabase
        .from('todos')
        .update(updates)
        .eq('id', todoId)

    if (error) return { error: error.message }
    revalidatePath('/admin')
    revalidatePath('/tasks')
    return { success: true }
}
