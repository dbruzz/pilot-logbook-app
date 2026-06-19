'use client'

import { useState, useEffect } from 'react'
import type { DurationFormat, DistanceUnit } from '@/lib/format'

const LS_KEY = 'pilot_display_prefs'

interface DisplayPreferences {
    durationFormat: DurationFormat
    distanceUnit: DistanceUnit
}

const DEFAULTS: DisplayPreferences = {
    durationFormat: 'hhmm',
    distanceUnit: 'km',
}

/**
 * Reads display preferences from localStorage.
 * The settings page writes to localStorage whenever the user saves preferences.
 * Falls back to safe defaults for users who haven't set preferences yet.
 */
export function useDisplayPreferences(): DisplayPreferences {
    const [prefs, setPrefs] = useState<DisplayPreferences>(DEFAULTS)

    useEffect(() => {
        try {
            const stored = localStorage.getItem(LS_KEY)
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<DisplayPreferences>
                setPrefs({
                    durationFormat: parsed.durationFormat ?? DEFAULTS.durationFormat,
                    distanceUnit: parsed.distanceUnit ?? DEFAULTS.distanceUnit,
                })
            }
        } catch {
            // ignore parse errors — fall back to defaults
        }
    }, [])

    return prefs
}

/**
 * Saves display preferences to localStorage.
 * Call this from the settings page after a successful server save.
 */
export function saveDisplayPreferences(prefs: Partial<DisplayPreferences>) {
    try {
        const existing = (() => {
            try {
                const s = localStorage.getItem(LS_KEY)
                return s ? (JSON.parse(s) as Partial<DisplayPreferences>) : {}
            } catch {
                return {}
            }
        })()
        localStorage.setItem(LS_KEY, JSON.stringify({ ...existing, ...prefs }))
    } catch {
        // ignore storage errors (private browsing, quota exceeded, etc.)
    }
}
