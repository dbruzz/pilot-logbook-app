'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { en } from '@/i18n/en'
import { es } from '@/i18n/es'

type Language = 'en' | 'es'
type Dictionary = typeof en

interface I18nContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: Dictionary
}

const dictionaries = {
    en,
    es,
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({
    children,
    defaultLanguage = 'es',
}: {
    children: React.ReactNode
    defaultLanguage?: Language
}) {
    const [language, setLanguage] = useState<Language>(defaultLanguage)

    // In a real app we might sync this with cookies or the user_settings table here or via a higher level wrapper
    useEffect(() => {
        const saved = localStorage.getItem('language') as Language
        if (saved && (saved === 'en' || saved === 'es')) {
            setLanguage(saved)
        }
    }, [])

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang)
        localStorage.setItem('language', lang)
    }

    return (
        <I18nContext.Provider
            value={{
                language,
                setLanguage: handleSetLanguage,
                t: dictionaries[language],
            }}
        >
            {children}
        </I18nContext.Provider>
    )
}

export function useTranslation() {
    const context = useContext(I18nContext)
    if (context === undefined) {
        throw new Error('useTranslation must be used within an I18nProvider')
    }
    return context
}
