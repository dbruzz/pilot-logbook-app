'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Plane, Goal, Clock, Calendar, Hash, Ruler } from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { formatDuration, formatDistance, convertDistance } from '@/lib/format'
import type { DurationFormat, DistanceUnit } from '@/lib/format'

// ─── types ────────────────────────────────────────────────────────

type DateFilter = 'allTime' | 'thisYear' | 'thisMonth' | 'custom'
type Metric = 'hours' | 'distance' | 'flights'
type BreakdownView = 'total' | 'byAircraft'

interface FlightLog {
    flight_date: string
    duration_minutes: number
    aircraft_id: number | null
    distance_value: number | null
    distance_unit: string | null
    user_aircrafts: { registration: string | null; description: string } | { registration: string | null; description: string }[] | null
}

interface DashboardClientProps {
    hoursLogs: FlightLog[]
    focusGoal: any | null
    activeGoals: any[]
    recentFlights: any[]
    distanceUnit: DistanceUnit
    durationFormat: DurationFormat
}

// ─── helpers ──────────────────────────────────────────────────────

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

function getAircraftLabel(log: FlightLog): string {
    const raw = log.user_aircrafts
    const ac = Array.isArray(raw) ? raw[0] : raw
    return ac ? [ac.registration, ac.description].filter(Boolean).join(' ') : String(log.aircraft_id)
}

// ─── component ────────────────────────────────────────────────────

export default function DashboardClient({
    hoursLogs,
    focusGoal,
    activeGoals,
    recentFlights,
    distanceUnit,
    durationFormat,
}: DashboardClientProps) {
    const { t, language } = useTranslation()
    const dateLocale = language === 'es' ? es : enUS

    // ── metric state ──────────────────────────────────────────────
    const [metric, setMetric] = useState<Metric>('hours')

    // ── breakdown view state ──────────────────────────────────────
    const [breakdownView, setBreakdownView] = useState<BreakdownView>('total')

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

    // ── derived totals (all three metrics + per-aircraft) ─────────
    const totals = useMemo(() => {
        const totalMins = filteredLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
        const totalFlightCount = filteredLogs.length
        const totalDist = filteredLogs.reduce((sum, l) => {
            if (!l.distance_value || !l.distance_unit) return sum
            return sum + convertDistance(l.distance_value, l.distance_unit, distanceUnit)
        }, 0)

        // Per-aircraft breakdown
        const aircraftMap = new Map<number, { label: string; minutes: number; distance: number; flights: number }>()
        for (const log of filteredLogs) {
            const id = log.aircraft_id
            if (!id) continue
            const label = getAircraftLabel(log)
            const dist = (log.distance_value && log.distance_unit)
                ? convertDistance(log.distance_value, log.distance_unit, distanceUnit)
                : 0
            const ex = aircraftMap.get(id)
            if (ex) {
                ex.minutes += log.duration_minutes || 0
                ex.distance += dist
                ex.flights += 1
            } else {
                aircraftMap.set(id, { label, minutes: log.duration_minutes || 0, distance: dist, flights: 1 })
            }
        }
        const byAircraft = Array.from(aircraftMap.values()).sort((a, b) => b.minutes - a.minutes)

        return { totalMins, totalFlightCount, totalDist, byAircraft }
    }, [filteredLogs, distanceUnit])

    // ─── render ───────────────────────────────────────────────────

    const filterOptions: { value: DateFilter; label: string }[] = [
        { value: 'allTime', label: t.dashboard.filter.allTime },
        { value: 'thisYear', label: t.dashboard.filter.thisYear },
        { value: 'thisMonth', label: t.dashboard.filter.thisMonth },
        { value: 'custom', label: t.dashboard.filter.custom },
    ]

    // Card title & icon based on selected metric
    const metricConfig = {
        hours:    { icon: <Clock className="w-5 h-5 text-muted-foreground" />,  label: t.dashboard.totalHours },
        distance: { icon: <Ruler className="w-5 h-5 text-muted-foreground" />,  label: t.dashboard.totalDistance },
        flights:  { icon: <Plane className="w-5 h-5 text-muted-foreground" />,  label: t.dashboard.totalFlights },
    }

    // Total value display
    const renderTotalValue = () => {
        if (metric === 'hours') {
            const h = Math.floor(totals.totalMins / 60)
            const m = totals.totalMins % 60
            return (
                <p className="text-4xl font-bold tracking-tight">
                    {durationFormat === 'decimal'
                        ? <>{formatDuration(totals.totalMins, 'decimal')}<span className="text-2xl font-semibold text-muted-foreground ml-1">h</span></>
                        : <>{h}<span className="text-2xl font-semibold text-muted-foreground">h</span>{' '}<span className="text-2xl font-semibold text-muted-foreground">{String(m).padStart(2, '0')}m</span></>
                    }
                </p>
            )
        }
        if (metric === 'distance') {
            return (
                <p className="text-4xl font-bold tracking-tight">
                    {totals.totalDist > 0
                        ? <>{totals.totalDist.toFixed(1)}<span className="text-2xl font-semibold text-muted-foreground ml-1">{distanceUnit === 'nm' ? 'NM' : distanceUnit}</span></>
                        : <span className="text-muted-foreground text-2xl">— {distanceUnit === 'nm' ? 'NM' : distanceUnit}</span>
                    }
                </p>
            )
        }
        // flights
        return (
            <p className="text-4xl font-bold tracking-tight">
                {totals.totalFlightCount}
                <span className="text-2xl font-semibold text-muted-foreground ml-1">
                    {language === 'es' ? 'vuelos' : 'flights'}
                </span>
            </p>
        )
    }

    // Per-aircraft value display
    const renderAircraftValue = (ac: { label: string; minutes: number; distance: number; flights: number }) => {
        if (metric === 'hours') return <span className="text-sm font-bold tabular-nums">{formatDuration(ac.minutes, durationFormat)}</span>
        if (metric === 'distance') return <span className="text-sm font-bold tabular-nums">{formatDistance(ac.distance, distanceUnit)}</span>
        return <span className="text-sm font-bold tabular-nums">{ac.flights}</span>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.nav.dashboard}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                {/* ── Summary Card ────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        {/* Row 1: metric toggle (Hours / Distance / Flights) + Total / By Aircraft */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Metric selector — three-way pill */}
                            <div className="flex items-center bg-secondary rounded-lg p-1 gap-1">
                                {(['hours', 'distance', 'flights'] as Metric[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMetric(m)}
                                        className={[
                                            'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all',
                                            metric === m
                                                ? 'bg-background shadow text-foreground'
                                                : 'text-muted-foreground hover:text-foreground',
                                        ].join(' ')}
                                    >
                                        {m === 'hours'    && <Clock  className="w-3.5 h-3.5" />}
                                        {m === 'distance' && <Ruler  className="w-3.5 h-3.5" />}
                                        {m === 'flights'  && <Hash   className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">
                                            {m === 'hours'    ? t.dashboard.totalHours
                                            : m === 'distance' ? t.dashboard.totalDistance
                                            : t.dashboard.totalFlights}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Total / By Aircraft toggle */}
                            <div className="flex items-center bg-secondary rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => setBreakdownView('total')}
                                    className={[
                                        'text-sm font-medium px-3 py-1 rounded-md transition-all',
                                        breakdownView === 'total'
                                            ? 'bg-background shadow text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    ].join(' ')}
                                >
                                    {t.dashboard.total}
                                </button>
                                <button
                                    onClick={() => setBreakdownView('byAircraft')}
                                    className={[
                                        'text-sm font-medium px-3 py-1 rounded-md transition-all',
                                        breakdownView === 'byAircraft'
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

                        {/* Row 3: custom range inputs */}
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
                        {breakdownView === 'total' ? (
                            renderTotalValue()
                        ) : (
                            <div className="space-y-2">
                                {totals.byAircraft.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                        <Plane className="w-10 h-10 mb-3 opacity-20" />
                                        <p className="text-sm">{t.dashboard.noFlights}</p>
                                    </div>
                                ) : (
                                    totals.byAircraft.map((aircraft, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="text-sm font-medium">{aircraft.label}</span>
                                            </div>
                                            {renderAircraftValue(aircraft)}
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
                                            {focusGoal.objective_type === 'distance'
                                                ? `${Math.round((focusGoal.progress / (focusGoal.target_distance || 1)) * 100)}%`
                                                : focusGoal.objective_type === 'flight_count'
                                                    ? `${Math.round((focusGoal.progress / (focusGoal.target_flight_count || 1)) * 100)}%`
                                                    : `${Math.round((focusGoal.progress / focusGoal.target_minutes) * 100)}%`
                                            }
                                        </span>
                                    </div>
                                </div>

                                <ProgressBar
                                    value={focusGoal.progress}
                                    max={focusGoal.objective_type === 'distance'
                                        ? (focusGoal.target_distance || 1)
                                        : focusGoal.objective_type === 'flight_count'
                                            ? (focusGoal.target_flight_count || 1)
                                            : focusGoal.target_minutes}
                                    className="h-4"
                                />

                                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                    {focusGoal.objective_type === 'distance' ? (
                                        <>
                                            <span>{formatDistance(focusGoal.progress, (focusGoal.target_distance_unit || distanceUnit) as DistanceUnit)}</span>
                                            <span>{formatDistance(focusGoal.target_distance, (focusGoal.target_distance_unit || distanceUnit) as DistanceUnit)}</span>
                                        </>
                                    ) : focusGoal.objective_type === 'flight_count' ? (
                                        <>
                                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{focusGoal.progress} {language === 'es' ? 'vuelos' : 'flights'}</span>
                                            <span>{focusGoal.target_flight_count} {language === 'es' ? 'vuelos' : 'flights'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{formatDuration(focusGoal.progress, durationFormat)}</span>
                                            <span>{formatDuration(focusGoal.target_minutes, durationFormat)} {t.goals.targetMinutes}</span>
                                        </>
                                    )}
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
                                                {(flight.from_location || flight.to_location) && (
                                                    <p className="text-xs text-muted-foreground flex gap-1 items-center mt-1">
                                                        <span>{flight.from_location || '?'}</span>
                                                        <span>→</span>
                                                        <span>{flight.to_location || '?'}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">{formatDuration(flight.duration_minutes, durationFormat)}</p>
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
