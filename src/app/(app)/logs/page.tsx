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

    return <LogsClient initialLogs={logsData || []} aircrafts={aircraftsData || []} />
}
