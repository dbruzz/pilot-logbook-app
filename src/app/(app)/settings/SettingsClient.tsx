'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useTheme } from 'next-themes'
import { LogOut, Save, User, Settings as SettingsIcon, ChevronDown } from 'lucide-react'
import { updateProfile, updateSettings } from './actions'
import { logout } from '@/app/(auth)/actions'
import LicensesClient from './LicensesClient'
import { cn } from '@/lib/utils'
import { saveDisplayPreferences } from '@/hooks/use-display-preferences'

// ─────────────────────────────────────────────
// Shared collapsible wrapper used by all three sections
// ─────────────────────────────────────────────

function CollapsibleSection({
    title,
    icon,
    children,
    defaultOpen = false,
}: {
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header — always visible, acts as toggle */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/40 transition-colors duration-200"
            >
                <div className="flex items-center gap-2.5">
                    {icon}
                    <span className="font-semibold text-base">{title}</span>
                </div>
                <ChevronDown
                    className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-300',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {/* Content — animated with CSS grid trick (height: 0 → auto) */}
            <div
                className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-in-out',
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
            >
                <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-1 space-y-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function SettingsClient({
    profile,
    settings,
    languages,
    email,
    initialLicenses,
}: {
    profile: any
    settings: any
    languages: any[]
    email: string
    initialLicenses: any[]
}) {
    const { t, setLanguage } = useTranslation()
    const { setTheme } = useTheme()
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isSavingSettings, setIsSavingSettings] = useState(false)

    // Seed localStorage from DB values on first load so other pages can read them
    useEffect(() => {
        saveDisplayPreferences({
            durationFormat: (settings.duration_format as 'hhmm' | 'decimal') ?? 'hhmm',
            distanceUnit: (settings.distance_unit as 'km' | 'nm' | 'mi') ?? 'km',
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSaveProfile = async (formData: FormData) => {
        setIsSavingProfile(true)
        await updateProfile(formData)
        setIsSavingProfile(false)
        window.location.reload()
    }

    const handleSaveSettings = async (formData: FormData) => {
        setIsSavingSettings(true)

        // Apply client-side preferences immediately
        const themeValue = formData.get('theme') as string
        if (themeValue) setTheme(themeValue)

        const langId = formData.get('language_id') as string
        if (langId) {
            const selectedLang = languages.find(l => l.id.toString() === langId)
            if (selectedLang) setLanguage(selectedLang.description as 'en' | 'es')
        }

        // Persist display preferences to localStorage for use in other pages
        saveDisplayPreferences({
            durationFormat: (formData.get('duration_format') as 'hhmm' | 'decimal') ?? 'hhmm',
            distanceUnit: (formData.get('distance_unit') as 'km' | 'nm' | 'mi') ?? 'km',
        })

        await updateSettings(formData)
        setIsSavingSettings(false)
        window.location.reload()
    }

    return (
        <div className="space-y-4 max-w-3xl">
            {/* Page heading */}
            <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>

            {/* ── 1. Datos personales ── */}
            <CollapsibleSection
                title={t.settings.profile}
                icon={<User className="w-5 h-5 text-primary" />}
            >
                <form action={handleSaveProfile} className="space-y-4">
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

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isSavingProfile} className="gap-2">
                            <Save className="w-4 h-4" />
                            {isSavingProfile ? t.common.loading : t.common.save}
                        </Button>
                    </div>
                </form>
            </CollapsibleSection>

            {/* ── 2. Licencias y Documentación ── */}
            <LicensesClient initialLicenses={initialLicenses} />

            {/* ── 3. Preferencias ── */}
            <CollapsibleSection
                title={t.settings.preferences}
                icon={<SettingsIcon className="w-5 h-5 text-primary" />}
            >
                <form action={handleSaveSettings} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.settings.language}</label>
                        <Select
                            name="language_id"
                            defaultValue={settings.language_id?.toString() || ''}
                            options={languages.map(l => ({
                                value: l.id.toString(),
                                label: l.description === 'es' ? 'Español' : 'English',
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

                    {/* TODO enable notifications for licence and documentation */}
                    {/* <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="notifications_enabled"
                            name="notifications_enabled"
                            defaultChecked={settings.notifications_enabled}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                            htmlFor="notifications_enabled"
                            className="text-sm font-medium flex-1 cursor-pointer"
                        >
                            {t.settings.notifications}
                        </label>
                    </div> */}

                    {/* <div className="space-y-2 pt-1">
                        <label className="text-sm font-medium">Avatar Type</label>
                        <Select
                            name="avatar_type"
                            defaultValue={settings.avatar_type || 'initials'}
                            options={[
                                { value: 'initials', label: 'Initials' },
                                { value: 'emoji', label: 'Emoji' },
                            ]}
                        />
                    </div> */}

                    <div className="space-y-2 pt-1">
                        <label className="text-sm font-medium">{t.settings.durationFormat.label}</label>
                        <Select
                            name="duration_format"
                            defaultValue={settings.duration_format || 'hhmm'}
                            options={[
                                { value: 'hhmm', label: t.settings.durationFormat.hhmm },
                                { value: 'decimal', label: t.settings.durationFormat.decimal },
                            ]}
                        />
                    </div>

                    <div className="space-y-2 pt-1">
                        <label className="text-sm font-medium">{t.settings.distanceUnit.label}</label>
                        <Select
                            name="distance_unit"
                            defaultValue={settings.distance_unit || 'km'}
                            options={[
                                { value: 'km', label: t.settings.distanceUnit.km },
                                { value: 'nm', label: t.settings.distanceUnit.nm },
                                { value: 'mi', label: t.settings.distanceUnit.mi },
                            ]}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isSavingSettings} className="gap-2">
                            <Save className="w-4 h-4" />
                            {isSavingSettings ? t.common.loading : t.common.save}
                        </Button>
                    </div>
                </form>
            </CollapsibleSection>

            {/* ── Logout — siempre visible al final ── */}
            <div className="flex justify-start pt-2">
                <Button
                    type="button"
                    variant="destructive"
                    onClick={() => logout()}
                    className="gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    {t.auth.logout}
                </Button>
            </div>
        </div>
    )
}
