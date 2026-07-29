import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { convertDistance } from '@/lib/format'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch user's preferred distance unit
    const { data: userSettings } = await supabase
        .from('user_settings')
        .select('distance_unit')
        .eq('user_id', user.id)
        .single()

    const distanceUnit = (userSettings?.distance_unit as 'km' | 'nm' | 'mi') || 'km'

    // Fetch Total Hours (also join aircraft for the "By Aircraft" breakdown)
    const { data: totalHoursData } = await supabase
        .from('flight_logs')
        .select('flight_date, duration_minutes, aircraft_id, user_aircrafts(registration, description)')
        .eq('user_id', user.id)

    const totalMinutes = totalHoursData?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

    // Group by aircraft_id for the segmented view
    const aircraftMinutesMap = new Map<number, { label: string; minutes: number }>()
    for (const log of totalHoursData || []) {
        const id = (log as any).aircraft_id
        if (!id) continue

        const aircraft = (log as any).user_aircrafts
        const ac = Array.isArray(aircraft) ? aircraft[0] : aircraft
        const label = ac
            ? [ac.registration, ac.description].filter(Boolean).join(' ')
            : String(id)

        const existing = aircraftMinutesMap.get(id)
        if (existing) {
            existing.minutes += log.duration_minutes || 0
        } else {
            aircraftMinutesMap.set(id, { label, minutes: log.duration_minutes || 0 })
        }
    }
    const flightsByAircraft = Array.from(aircraftMinutesMap.values())
        .filter(a => a.minutes > 0)
        .sort((a, b) => b.minutes - a.minutes)

    // Fetch Goals
    const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)

    const activeGoals = goalsData?.filter(g => g.status_id === 1) || []
    const focusGoal = activeGoals.find(g => g.is_focus)

    // Fetch Recent Flights
    const { data: recentFlights } = await supabase
        .from('flight_logs')
        .select(`
      id, flight_date, duration_minutes, is_instruction, from_location, to_location,
      user_aircrafts(description, registration)
    `)
        .eq('user_id', user.id)
        .order('flight_date', { ascending: false })
        .limit(5)

    // All flights with distance for progress calculation
    const { data: allFlights } = await supabase
        .from('flight_logs')
        .select('duration_minutes, flight_date, distance_value, distance_unit')
        .eq('user_id', user.id)

    const calculateProgress = (goal: any): number => {
        if (!allFlights) return 0

        let relevantFlights = allFlights
        if (goal.start_date) {
            relevantFlights = relevantFlights.filter(f => f.flight_date >= goal.start_date)
        }
        if (goal.end_date) {
            relevantFlights = relevantFlights.filter(f => f.flight_date <= goal.end_date)
        }

        if (goal.objective_type === 'distance') {
            const unit = (goal.target_distance_unit as 'km' | 'nm' | 'mi') || distanceUnit
            const sum = relevantFlights.reduce((total, f) => {
                if (!f.distance_value || !f.distance_unit) return total
                return total + convertDistance(f.distance_value, f.distance_unit, unit)
            }, 0)
            return Math.min(sum, goal.target_distance ?? 0)
        }

        if (goal.objective_type === 'flight_count') {
            const count = relevantFlights.length
            return Math.min(count, goal.target_flight_count ?? 0)
        }

        // Default: time-based
        const sumMinutes = relevantFlights.reduce((sum, log) => sum + (log.duration_minutes || 0), 0)
        return Math.min(sumMinutes, goal.target_minutes)
    }

    const focusGoalWithProgress = focusGoal ? {
        ...focusGoal,
        progress: calculateProgress(focusGoal)
    } : null

    const activeGoalsWithProgress = activeGoals.map(g => ({
        ...g,
        progress: calculateProgress(g)
    }))

    return (
        <DashboardClient
            hoursLogs={totalHoursData || []}
            focusGoal={focusGoalWithProgress}
            activeGoals={activeGoalsWithProgress}
            recentFlights={recentFlights || []}
            distanceUnit={distanceUnit}
        />
    )
}
