import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GoalsClient from './GoalsClient'
import { convertDistance } from '@/lib/format'

export default async function GoalsPage() {
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

    const { data: goalsData } = await supabase
        .from('goals')
        .select(`
      *,
      goal_statuses(description)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Fetch flights including distance fields for progress calculation
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

        // Default: time-based goal
        const sumMinutes = relevantFlights.reduce((sum, log) => sum + (log.duration_minutes || 0), 0)
        return Math.min(sumMinutes, goal.target_minutes)
    }

    const goalsWithProgress = goalsData?.map(g => ({
        ...g,
        progress: calculateProgress(g)
    })) || []

    return <GoalsClient initialGoals={goalsWithProgress} distanceUnit={distanceUnit} />
}
