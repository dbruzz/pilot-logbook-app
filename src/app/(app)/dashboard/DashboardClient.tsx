'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Plane, Goal, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

// ─── types ────────────────────────────────────────────────────────

type DateFilter = 'allTime' | 'thisYear' | 'thisMonth' | 'custom'

interface HoursLog {
    flight_date: string
    duration_minutes: number
    aircraft_id: number | null
    user_aircrafts: { registration: string | null; description: string } | { registration: string | null; description: string }[] | null
}

interface DashboardClientProps {
    hoursLogs: HoursLog[]
    focusGoal: any | null
    activeGoals: any[]
    recentFlights: any[]
}

// ─── helpers ──────────────────────────────────────────────────────

function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
}

function todayISO() {
    return new Date().toISOString().split('T')[0]
}

function thisYearStart() {
    return `${new Date().getFullYear()}-01-01`
}

function thisMonthStart() {
    const d = new Date()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-01`
}

// ─── component ────────────────────────────────────────────────────

export default function DashboardClient({
    hoursLogs,
    focusGoal,
    activeGoals,
    recentFlights,
}: DashboardClientProps) {
    const { t, language } = useTranslation()
    const dateLocale = language === 'es' ? es : enUS

    // ── hours view state ──────────────────────────────────────────
    const [hoursView, setHoursView] = useState<'total' | 'byAircraft'>('total')

    // ── date filter state ─────────────────────────────────────────
    const [dateFilter, setDateFilter] = useState<DateFilter>('allTime')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState(todayISO())

    // ── derived filtered logs ─────────────────────────────────────
    const filteredLogs = useMemo(() => {
        if (dateFilter === 'allTime') return hoursLogs

        let from: string | null = null
        let to: string | null = todayISO()

        if (dateFilter === 'thisYear') {
            from = thisYearStart()
        } else if (dateFilter === 'thisMonth') {
            from = thisMonthStart()
        } else if (dateFilter === 'custom') {
            from = customFrom || null
            to = customTo || todayISO()
        }

        return hoursLogs.filter(log => {
            if (from && log.flight_date < from) return false
            if (to && log.flight_date > to) return false
            return true
        })
    }, [hoursLogs, dateFilter, customFrom, customTo])

    // ── derived totals ────────────────────────────────────────────
    const { totalHours, totalRemaining, flightsByAircraft } = useMemo(() => {
        const totalMins = filteredLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)

        const aircraftMap = new Map<number, { label: string; minutes: number }>()
        for (const log of filteredLogs) {
            const id = log.aircraft_id
            if (!id) continue
            const raw = log.user_aircrafts
            const ac = Array.isArray(raw) ? raw[0] : raw
            const label = ac
                ? [ac.registration, ac.description].filter(Boolean).join(' ')
                : String(id)
            const ex = aircraftMap.get(id)
            if (ex) {
                ex.minutes += log.duration_minutes || 0
            } else {
                aircraftMap.set(id, { label, minutes: log.duration_minutes || 0 })
            }
        }
        const byAircraft = Array.from(aircraftMap.values())
            .filter(a => a.minutes > 0)
            .sort((a, b) => b.minutes - a.minutes)

        return {
            totalHours: Math.floor(totalMins / 60),
            totalRemaining: totalMins % 60,
            flightsByAircraft: byAircraft,
        }
    }, [filteredLogs])

    // ─── render ───────────────────────────────────────────────────

    const filterOptions: { value: DateFilter; label: string }[] = [
        { value: 'allTime', label: t.dashboard.filter.allTime },
        { value: 'thisYear', label: t.dashboard.filter.thisYear },
        { value: 'thisMonth', label: t.dashboard.filter.thisMonth },
        { value: 'custom', label: t.dashboard.filter.custom },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.nav.dashboard}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                {/* ── Flight Hours Card ────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        {/* Row 1: title + segmented control */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-muted-foreground" />
                                <CardTitle className="text-lg">{t.dashboard.totalHours}</CardTitle>
                            </div>
                            {/* Segmented control */}
                            <div className="flex items-center bg-secondary rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => setHoursView('total')}
                                    className={[
                                        'text-sm font-medium px-3 py-1 rounded-md transition-all',
                                        hoursView === 'total'
                                            ? 'bg-background shadow text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    ].join(' ')}
                                >
                                    {t.dashboard.total}
                                </button>
                                <button
                                    onClick={() => setHoursView('byAircraft')}
                                    className={[
                                        'text-sm font-medium px-3 py-1 rounded-md transition-all',
                                        hoursView === 'byAircraft'
                                            ? 'bg-background shadow text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    ].join(' ')}
                                >
                                    {t.dashboard.byAircraft}
                                </button>
                            </div>
                        </div>

                        {/* Row 2: date filter pills */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {filterOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setDateFilter(opt.value)}
                                    className={[
                                        'text-xs font-medium px-3 py-1 rounded-full border transition-all',
                                        dateFilter === opt.value
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
                                    ].join(' ')}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Row 3: custom range inputs (only when "Custom" is active) */}
                        {dateFilter === 'custom' && (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="text-xs text-muted-foreground shrink-0">
                                        {t.dashboard.filter.from}
                                    </label>
                                    <Input
                                        type="date"
                                        value={customFrom}
                                        onChange={e => setCustomFrom(e.target.value)}
                                        className="h-8 text-xs w-36"
                                    />
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                    <label className="text-xs text-muted-foreground shrink-0">
                                        {t.dashboard.filter.to}
                                    </label>
                                    <Input
                                        type="date"
                                        value={customTo}
                                        onChange={e => setCustomTo(e.target.value)}
                                        className="h-8 text-xs w-36"
                                    />
                                </div>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent>
                        {hoursView === 'total' ? (
                            <p className="text-4xl font-bold tracking-tight">
                                {totalHours}h{' '}
                                <span className="text-2xl font-semibold text-muted-foreground">{totalRemaining}m</span>
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {flightsByAircraft.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                        <Plane className="w-10 h-10 mb-3 opacity-20" />
                                        <p className="text-sm">{t.dashboard.noFlights}</p>
                                    </div>
                                ) : (
                                    flightsByAircraft.map((aircraft, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="text-sm font-medium">{aircraft.label}</span>
                                            </div>
                                            <span className="text-sm font-bold tabular-nums">
                                                {formatDuration(aircraft.minutes)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Focus Goal Card ──────────────────────────── */}
                <Card className="border-primary/20 bg-primary/5 shadow-md shadow-primary/5">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Goal className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">{t.dashboard.focusGoal}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {focusGoal ? (
                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="font-semibold text-xl">{focusGoal.title}</h3>
                                        {focusGoal.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{focusGoal.description}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-primary">
                                            {Math.round((focusGoal.progress / focusGoal.target_minutes) * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <ProgressBar
                                    value={focusGoal.progress}
                                    max={focusGoal.target_minutes}
                                    className="h-4"
                                />

                                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                    <span>{formatDuration(focusGoal.progress)}</span>
                                    <span>{formatDuration(focusGoal.target_minutes)} {t.goals.targetMinutes}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                <Goal className="w-12 h-12 mb-3 opacity-20" />
                                <p>{t.dashboard.noFocusGoal}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Recent Flights Card ──────────────────────── */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Plane className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">{t.dashboard.recentFlights}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentFlights.length > 0 ? (
                            <div className="space-y-4">
                                {recentFlights.map((flight) => (
                                    <div key={flight.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-background p-2 rounded-lg shadow-sm border border-border/50">
                                                <Calendar className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {format(new Date(flight.flight_date), 'dd MMM yyyy', { locale: dateLocale })}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex gap-1 items-center mt-1">
                                                    <span>{flight.from_location || '?'}</span>
                                                    <span>→</span>
                                                    <span>{flight.to_location || '?'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">{formatDuration(flight.duration_minutes)}</p>
                                            {flight.user_aircrafts && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {flight.user_aircrafts.registration || flight.user_aircrafts.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Clock className="w-12 h-12 mb-3 opacity-20" />
                                <p>{t.dashboard.noFlights}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
