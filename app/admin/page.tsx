import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getAllProfiles, updateProfile, deleteUser } from './actions'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, ShieldOff, UserMinus, User } from 'lucide-react'
import { EditProfileDialog } from '@/components/admin/edit-profile-dialog'

export default async function AdminPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { profiles, error } = await getAllProfiles()

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                    <p className="text-muted-foreground">{error}</p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[250px]">User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            profiles?.map((profile: any) => (
                                <TableRow key={profile.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                                <User className="h-4 w-4 text-secondary-foreground" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">
                                                    {profile.full_name || "No Name Set"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {profile.id.substring(0, 8)}...
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{profile.email}</TableCell>
                                    <TableCell>
                                        {profile.is_admin ? (
                                            <Badge variant="default" className="bg-primary/90">Admin</Badge>
                                        ) : (
                                            <Badge variant="secondary">User</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <EditProfileDialog profile={profile} />

                                            <form action={async () => {
                                                "use server";
                                                await updateProfile(profile.id, { is_admin: !profile.is_admin })
                                            }}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type="submit"
                                                    disabled={profile.id === user.id || profile.email === 'rajg50103@gmail.com'}
                                                    className="h-8"
                                                    title={
                                                        profile.id === user.id
                                                            ? "You cannot demote yourself"
                                                            : profile.email === 'rajg50103@gmail.com'
                                                                ? "This primary admin cannot be demoted"
                                                                : ""
                                                    }
                                                >
                                                    {profile.is_admin ? <ShieldOff className="mr-2 h-4 w-4" /> : <Shield className="mr-2 h-4 w-4" />}
                                                    <span className="hidden md:inline ml-2">{profile.is_admin ? "Demote" : "Promote"}</span>
                                                </Button>
                                            </form>

                                            <form action={async () => {
                                                "use server";
                                                await deleteUser(profile.id)
                                            }}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    type="submit"
                                                    disabled={profile.id === user.id || profile.email === 'rajg50103@gmail.com'}
                                                    title={
                                                        profile.id === user.id
                                                            ? "You cannot delete yourself"
                                                            : profile.email === 'rajg50103@gmail.com'
                                                                ? "This primary admin cannot be deleted"
                                                                : ""
                                                    }
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
