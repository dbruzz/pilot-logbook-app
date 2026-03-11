'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useTheme } from 'next-themes'
import { LogOut, Save, User, Settings as SettingsIcon } from 'lucide-react'
import { updateProfileAndSettings } from './actions'
import { logout } from '@/app/(auth)/actions'

export default function SettingsClient({
    profile,
    settings,
    languages,
    email
}: {
    profile: any
    settings: any
    languages: any[]
    email: string
}) {
    const { t, setLanguage } = useTranslation()
    const { setTheme } = useTheme()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSave = async (formData: FormData) => {
        setIsSubmitting(true)

        // Apply client-side preferences immediately
        const themeValue = formData.get('theme') as string
        if (themeValue) setTheme(themeValue)

        const langId = formData.get('language_id') as string
        if (langId) {
            const selectedLang = languages.find(l => l.id.toString() === langId)
            if (selectedLang) setLanguage(selectedLang.description as 'en' | 'es')
        }

        await updateProfileAndSettings(formData)
        setIsSubmitting(false)
        window.location.reload()
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>
            </div>

            <form action={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            {t.settings.profile}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.settings.name}</label>
                                <Input name="name" defaultValue={profile.name || ''} placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.settings.lastName}</label>
                                <Input name="last_name" defaultValue={profile.last_name || ''} placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.settings.birthdate}</label>
                            <Input type="date" name="birthdate" defaultValue={profile.birthdate || ''} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.auth.email}</label>
                            <Input value={email} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SettingsIcon className="w-5 h-5 text-primary" />
                            {t.settings.preferences}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.settings.language}</label>
                            <Select
                                name="language_id"
                                defaultValue={settings.language_id?.toString() || ''}
                                options={languages.map(l => ({
                                    value: l.id.toString(),
                                    label: l.description === 'es' ? 'Español' : 'English'
                                }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.settings.theme.label}</label>
                            <Select
                                name="theme"
                                defaultValue={settings.theme || 'system'}
                                options={[
                                    { value: 'light', label: t.settings.theme.light },
                                    { value: 'dark', label: t.settings.theme.dark },
                                    { value: 'system', label: t.settings.theme.system },
                                ]}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="notifications_enabled"
                                name="notifications_enabled"
                                defaultChecked={settings.notifications_enabled}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="notifications_enabled" className="text-sm font-medium flex-1 cursor-pointer">
                                {t.settings.notifications}
                            </label>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium">Avatar Type</label>
                            <Select
                                name="avatar_type"
                                defaultValue={settings.avatar_type || 'initials'}
                                options={[
                                    { value: 'initials', label: 'Initials' },
                                    { value: 'emoji', label: 'Emoji' },
                                ]}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center pt-2">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => logout()}
                        className="gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        {t.auth.logout}
                    </Button>

                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isSubmitting ? t.common.loading : t.common.save}
                    </Button>
                </div>
            </form>
        </div>
    )
}
