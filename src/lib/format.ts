/**
 * Formats a duration given in minutes to a display string.
 *
 * @param minutes - Total duration in minutes (stored format, never changes)
 * @param format  - Display preference: 'hhmm' → "1:30" | 'decimal' → "1.5"
 *                  Defaults to 'hhmm' if omitted.
 */
export function formatDuration(
    minutes: number,
    format: 'hhmm' | 'decimal' = 'hhmm',
): string {
    if (!Number.isFinite(minutes) || minutes < 0) return '—'
    if (format === 'decimal') {
        return (minutes / 60).toFixed(1)
    }
    // hhmm: "1:30"
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}:${String(m).padStart(2, '0')}`
}

/**
 * Conversion factors: each unit → km
 */
const TO_KM: Record<string, number> = { km: 1, nm: 1.852, mi: 1.60934 }

/**
 * Converts a distance value from one unit to another.
 * Falls back to the original value if a unit is unrecognised.
 */
export function convertDistance(value: number, from: string, to: string): number {
    if (from === to) return value
    const factor = (TO_KM[from] ?? 1) / (TO_KM[to] ?? 1)
    return value * factor
}

/**
 * Formats a distance value with its unit label.
 * NM is shown in uppercase; km and mi in lowercase.
 */
export function formatDistance(value: number, unit: 'km' | 'nm' | 'mi'): string {
    const display = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
    const label = unit === 'nm' ? 'NM' : unit
    return `${display} ${label}`
}

export type DurationFormat = 'hhmm' | 'decimal'
export type DistanceUnit = 'km' | 'nm' | 'mi'
