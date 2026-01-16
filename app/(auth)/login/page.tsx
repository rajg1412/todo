import Link from "next/link"
import { Metadata } from "next"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { UserAuthForm } from "@/components/auth/user-auth-form"

export const metadata: Metadata = {
    title: "Login",
    description: "Login to your account",
}

export default function LoginPage() {
    return (
        <Card className="border-none shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-center">
                    Welcome back
                </CardTitle>
                <CardDescription className="text-center">
                    Enter your email and password to sign in
                </CardDescription>
            </CardHeader>
            <CardContent>
                <UserAuthForm mode="login" />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="text-sm text-muted-foreground text-center">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Sign up
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
