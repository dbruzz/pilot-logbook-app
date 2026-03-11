'use client'

import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Plane, Goal, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

interface DashboardClientProps {
    totalHours: number
    totalMinutes: number
    focusGoal: any | null
    activeGoals: any[]
    recentFlights: any[]
}

export default function DashboardClient({
    totalHours,
    totalMinutes,
    focusGoal,
    activeGoals,
    recentFlights,
}: DashboardClientProps) {
    const { t, language } = useTranslation()
    const dateLocale = language === 'es' ? es : enUS

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return `${h}h ${m}m`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.nav.dashboard}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t.dashboard.totalHours}: <span className="font-semibold text-foreground">{totalHours}h {totalMinutes}m</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                {/* Focus Goal Card */}
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

                {/* Recent Flights Card */}
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
