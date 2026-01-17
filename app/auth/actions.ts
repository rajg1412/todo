"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

const getURL = () => {
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in Vercel env vars
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
        'http://localhost:3000/'
    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`
    // Make sure to include a trailing `/`.
    url = url.endsWith('/') ? url : `${url}/`
    return url
}

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-safe way to get form data
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    const origin = (await headers()).get('origin')
    const redirectTo = origin ? `${origin}/auth/callback` : `${getURL()}auth/callback`

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: redirectTo,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.user) {
        await supabase.from('profiles').insert([
            {
                id: data.user.id,
                email: data.user.email,
                full_name: fullName,
                is_admin: false,
                is_superadmin: false
            }
        ])
    }

    revalidatePath('/', 'layout')
    return { success: "Check your email for the confirmation link." }
}

export async function signInWithGoogle() {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')
    const redirectTo = origin ? `${origin}/auth/callback` : `${getURL()}auth/callback`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const origin = (await headers()).get('origin')
    const redirectTo = origin ? `${origin}/auth/callback?type=recovery` : `${getURL()}auth/callback?type=recovery`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: "Password reset link has been sent to your email." }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: "Password has been updated successfully." }
}
