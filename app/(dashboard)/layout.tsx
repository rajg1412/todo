import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Fetch profile to check admin status
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_superadmin')
        .eq('id', user?.id || '')
        .single()

    const isAdmin = profile?.is_admin || profile?.is_superadmin || false

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar isAdmin={isAdmin} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
