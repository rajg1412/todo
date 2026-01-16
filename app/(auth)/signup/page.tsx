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
    title: "Create an account",
    description: "Create an account to get started",
}

export default function SignUpPage() {
    return (
        <Card className="border-none shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-center">
                    Create an account
                </CardTitle>
                <CardDescription className="text-center">
                    Enter your email below to create your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <UserAuthForm mode="signup" />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="text-sm text-muted-foreground text-center">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Sign in
                    </Link>
                </div>
                <p className="px-8 text-center text-xs text-muted-foreground">
                    By clicking continue, you agree to our{" "}
                    <Link
                        href="/terms"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacy"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            </CardFooter>
        </Card>
    )
}
