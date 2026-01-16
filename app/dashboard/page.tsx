import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import { TodoList } from '@/components/dashboard/todo-list'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch todos
    const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Fetch profile to check admin status and get name
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, full_name')
        .eq('id', user.id)
        .limit(1)
        .maybeSingle()

    return (
        <div className="flex min-h-screen flex-col bg-muted/20 p-4 md:p-8">
            <div className="mx-auto w-full max-w-4xl space-y-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Welcome, {profile?.full_name || user.email?.split('@')[0]}
                        </h1>
                        <p className="text-muted-foreground pt-1">Logged in as {user.email}</p>
                    </div>
                    <div className="flex gap-2">
                        {profile?.is_admin && (
                            <Button asChild variant="secondary">
                                <Link href="/admin">Admin Panel</Link>
                            </Button>
                        )}
                        <form action={signOut}>
                            <Button variant="outline">Sign Out</Button>
                        </form>
                    </div>
                </header>

                <div className="grid gap-8 md:grid-cols-1">
                    <TodoList initialTodos={todos || []} />
                </div>
            </div>
        </div>
    )
}
