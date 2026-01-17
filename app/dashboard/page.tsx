import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from '@/components/data-table/columns'
import { AddTaskDialog } from '@/components/dashboard/add-task-dialog'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch profile to check superadmin status from database
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_superadmin')
        .eq('id', user.id)
        .single()

    const isSuperadmin = profile?.is_superadmin || false

    let query = supabase.from('todos').select('*')

    if (!isSuperadmin) {
        query = query.eq('user_id', user.id)
    }

    const { data: todos } = await query.order('created_at', { ascending: false })

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

                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Main Tasks</h2>
                        <p className="text-muted-foreground">
                            Here&apos;s a list of your tasks for this month!
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <AddTaskDialog />
                    </div>
                </div>

                <div className="space-y-4">
                    <DataTable
                        data={todos?.map(todo => ({
                            id: `TASK-${todo.id.toString().slice(0, 4)}`,
                            realId: todo.id,
                            title: todo.task,
                            status: todo.status || (todo.is_completed ? "done" : "todo"),
                            label: todo.label || "feature",
                            priority: todo.priority || "medium",
                        })) || []}
                        columns={columns}
                    />
                </div>
            </div>
        </div>
    )
}
