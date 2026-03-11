import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GoalsClient from './GoalsClient'

export default async function GoalsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: goalsData } = await supabase
        .from('goals')
        .select(`
      *,
      goal_statuses(description)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

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
        return Math.min(sumMinutes, goal.target_minutes)
    }

    const goalsWithProgress = goalsData?.map(g => ({
        ...g,
        progress: calculateProgress(g)
    })) || []

    return <GoalsClient initialGoals={goalsWithProgress} />
}
