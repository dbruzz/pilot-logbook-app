import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LogsClient from './LogsClient'

export default async function LogsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: logsData } = await supabase
        .from('flight_logs')
        .select(`
      *,
      user_aircrafts(description, registration, model)
    `)
        .eq('user_id', user.id)
        .order('flight_date', { ascending: false })

    const { data: aircraftsData } = await supabase
        .from('user_aircrafts')
        .select('id, description, registration')
        .eq('user_id', user.id)
        .order('description')

    // Fetch active goals for the goal selector
    const { data: activeGoals } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status_id', 1) // status_id 1 = active
        .order('title')

    // Fetch all existing log↔goal associations for this user's logs
    const logIds = (logsData || []).map(l => l.id)
    let logGoalsData: { flight_log_id: number; goal_id: number }[] = []
    if (logIds.length > 0) {
        const { data } = await supabase
            .from('flight_log_goals')
            .select('flight_log_id, goal_id')
            .in('flight_log_id', logIds)
        logGoalsData = data || []
    }

    return (
        <LogsClient
            initialLogs={logsData || []}
            aircrafts={aircraftsData || []}
            activeGoals={activeGoals || []}
            logGoals={logGoalsData}
        />
    )
}

