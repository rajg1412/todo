"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"

import { toast } from "sonner"
import { login, signup, signInWithGoogle } from "@/app/auth/actions"

const authSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters long.",
    }),
    full_name: z.string().optional(),
})

type FormData = z.infer<typeof authSchema>

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    mode: "login" | "signup"
}

export function UserAuthForm({ className, mode, ...props }: UserAuthFormProps) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false)

    const form = useForm<FormData>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: "",
            password: "",
            full_name: "",
        },
    })

    async function onSubmit(data: FormData) {
        setIsLoading(true)

        const formData = new FormData()
        formData.append("email", data.email)
        formData.append("password", data.password)
        if (data.full_name) {
            formData.append("full_name", data.full_name)
        }

        try {
            if (mode === "login") {
                const result = await login(formData)
                if (result?.error) {
                    toast.error(result.error)
                }
            } else {
                const result = await signup(formData)
                if (result?.error) {
                    toast.error(result.error)
                } else if (result?.success) {
                    toast.success(result.success)
                }
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGoogleLogin() {
        setIsGoogleLoading(true)
        try {
            const result = await signInWithGoogle()
            if (result?.error) {
                toast.error(result.error)
                setIsGoogleLoading(false)
            }
            // Redirect happens automatically if successful
        } catch (error) {
            toast.error("Failed to connect to Google.")
            setIsGoogleLoading(false)
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-4">
                        {mode === "signup" && (
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                disabled={isLoading || isGoogleLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="name@example.com"
                                            type="email"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            autoCorrect="off"
                                            disabled={isLoading || isGoogleLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="••••••••"
                                            type="password"
                                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                                            disabled={isLoading || isGoogleLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button disabled={isLoading || isGoogleLoading} className="mt-2" type="submit">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === "login" ? "Sign In with Email" : "Create Account"}
                        </Button>
                    </div>
                </form>
            </Form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <Button
                variant="outline"
                type="button"
                disabled={isLoading || isGoogleLoading}
                onClick={handleGoogleLogin}
            >
                {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                )}{" "}
                Google
            </Button>
        </div>
    )
}
