'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plane } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { useTranslation } from '@/hooks/use-translation'
import { login } from '../actions'

export default function LoginPage() {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setError(null)
        const result = await login(formData)
        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        }
        // if successful, it redirects
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="mb-8 flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <Plane className="w-8 h-8" />
                </div>
                <span className="font-bold text-3xl tracking-tight">Flight Logbook</span>
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
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-lg border border-destructive/20">
                                {error}
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
