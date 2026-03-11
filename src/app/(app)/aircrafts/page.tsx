import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AircraftsClient from './AircraftsClient'

export default async function AircraftsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: aircraftsData } = await supabase
        .from('user_aircrafts')
        .select(`
            *,
            aircrafts_categories(description)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const { data: categories } = await supabase
        .from('aircrafts_categories')
        .select('*')

    return <AircraftsClient initialAircrafts={aircraftsData || []} categories={categories || []} />
}
