'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import Image from "next/image"
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { useTranslation } from '@/hooks/use-translation'
import { signup, resendConfirmation } from '../actions'

export default function SignupPage() {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    // Stores the email when the account exists but is unverified, to enable manual resend
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
    const [isResending, setIsResending] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setError(null)
        setUnverifiedEmail(null)

        const language = navigator.language.startsWith('es') ? 'es' : 'en'
        formData.append('language', language)

        const result = await signup(formData)

        if (result?.errorCode) {
            if (result.errorCode === 'emailExists' && result.email) {
                // Email is taken (verified or not — we don't know yet).
                // Show message + resend button; the resend outcome reveals which case it is.
                setUnverifiedEmail(result.email)
                setError(t.auth.errors.emailExists)
            } else {
                const code = result.errorCode as keyof typeof t.auth.errors
                setError(t.auth.errors[code] ?? t.auth.errors.generic)
            }
            setIsLoading(false)
        } else if (result?.needsEmailConfirmation) {
            setNeedsEmailConfirmation(true)
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        if (!unverifiedEmail) return
        setIsResending(true)
        const result = await resendConfirmation(unverifiedEmail)
        setIsResending(false)
        if (result?.errorCode === 'emailAlreadyVerified') {
            // Supabase rejected the resend because the email is already confirmed:
            // direct the user to log in instead.
            setUnverifiedEmail(null)
            setError(t.auth.errors.emailAlreadyVerified)
        } else if (result?.errorCode) {
            // Generic resend failure — keep the button so the user can retry
            setError(t.auth.errors.resendError)
        } else {
            // Resend succeeded — account was unverified, email sent
            setUnverifiedEmail(null)
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
                    <CardTitle className="text-2xl font-bold tracking-tight">{t.auth.signup}</CardTitle>
                    <CardDescription>
                        {t.auth.signupDescription || t.auth.noAccount}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {needsEmailConfirmation ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-muted-foreground">{t.auth.checkEmail}</p>
                        </div>
                    ) : (
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
                                        minLength={6}
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
                                    {unverifiedEmail && (
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
                                {isLoading ? t.common.loading : t.auth.signup}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground">
                        <Link href="/login" className="hover:text-primary underline underline-offset-4 transition-colors">
                            {t.auth.hasAccount}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
