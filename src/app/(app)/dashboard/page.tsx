import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch Total Hours
    const { data: totalHoursData } = await supabase
        .from('flight_logs')
        .select('duration_minutes')
        .eq('user_id', user.id)

    const totalMinutes = totalHoursData?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

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

    // Calculate Goal Progress for each active goal (and focus goal)
    // To avoid multiple queries here, we'll fetch all flight logs or at least those needed for active goals
    // If there are many flight logs, fetching all might be inefficient.
    // We already fetched duration_minutes and flight_date to do this calculation.
    const { data: allFlights } = await supabase
        .from('flight_logs')
        .select('duration_minutes, flight_date')
        .eq('user_id', user.id)

    const calculateProgress = (goal: any) => {
        if (!allFlights) return 0
        let relevantFlights = allFlights
        if (goal.start_date) {
            relevantFlights = relevantFlights.filter(f => f.flight_date >= goal.start_date)
        }
        if (goal.end_date) {
            relevantFlights = relevantFlights.filter(f => f.flight_date <= goal.end_date)
        }
        const sumMinutes = relevantFlights.reduce((sum, log) => sum + (log.duration_minutes || 0), 0)
        return Math.min(sumMinutes, goal.target_minutes) // progress calculation maxed at target
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
            totalHours={totalHours}
            totalMinutes={remainingMinutes}
            focusGoal={focusGoalWithProgress}
            activeGoals={activeGoalsWithProgress}
            recentFlights={recentFlights || []}
        />
    )
}
