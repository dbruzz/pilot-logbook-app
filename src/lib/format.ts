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

export type DurationFormat = 'hhmm' | 'decimal'
export type DistanceUnit = 'km' | 'nm' | 'mi'
