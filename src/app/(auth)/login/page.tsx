'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import Image from "next/image"
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { useTranslation } from '@/hooks/use-translation'
import { login, resendConfirmation } from '../actions'

export default function LoginPage() {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    // When the account exists but email is not confirmed, we store the email
    // to allow the user to request a new confirmation email.
    const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)
    const [isResending, setIsResending] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setError(null)
        setUnconfirmedEmail(null)
        const result = await login(formData)
        if (result?.errorCode) {
            if (result.errorCode === 'emailNotConfirmed' && result.email) {
                setUnconfirmedEmail(result.email)
                setError(t.auth.errors.emailNotConfirmed)
            } else {
                const code = result.errorCode as keyof typeof t.auth.errors
                setError(t.auth.errors[code] ?? t.auth.errors.generic)
            }
            setIsLoading(false)
        }
        // if successful, it redirects
    }

    const handleResend = async () => {
        if (!unconfirmedEmail) return
        setIsResending(true)
        const result = await resendConfirmation(unconfirmedEmail)
        setIsResending(false)
        if (result?.errorCode) {
            setError(t.auth.errors.resendError)
        } else {
            // Hide the resend button and show the success message
            setUnconfirmedEmail(null)
            setError(t.auth.errors.resendSuccess)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="mb-8 flex items-center gap-3">
                <Image
                    src="/altora-icon.png"
                    alt="Altora"
                    width={40}
                    height={40}
                    className="w-12 h-12"
                />
                <div>
                    <h1 className="text-2xl font-bold">Altora</h1>
                    <p className="text-xs text-muted-foreground">
                        {t.common.altoraSubtitle1}
                    </p>
                </div>
            </div>

            <Card className="w-full max-w-md border-border/50 shadow-xl shadow-primary/5">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">{t.auth.login}</CardTitle>
                    <CardDescription>
                        {t.auth.loginDescription || 'Enter your email and password to log in'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                {t.auth.email}
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="pilot@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                {t.auth.password}
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-lg border border-destructive/20">
                                <p>{error}</p>
                                {unconfirmedEmail && (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={isResending}
                                        className="mt-2 text-xs underline underline-offset-2 hover:opacity-80 transition-opacity disabled:opacity-50"
                                    >
                                        {isResending ? t.auth.resending : t.auth.resendConfirmation}
                                    </button>
                                )}
                            </div>
                        )}

                        <Button className="w-full mt-4" type="submit" disabled={isLoading}>
                            {isLoading ? t.common.loading : t.auth.login}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground">
                        <Link href="/signup" className="hover:text-primary underline underline-offset-4 transition-colors">
                            {t.auth.noAccount}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
