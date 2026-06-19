import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import JournalClient from './JournalClient'

export default async function JournalPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch journal entries with related entity previews and image paths
    const { data: entries } = await supabase
        .from('journal_entries')
        .select(`
            *,
            journal_entry_images(id, storage_path),
            flight_logs(id, flight_date, duration_minutes),
            goals(id, title),
            user_aircrafts(id, registration, description)
        `)
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })

    // Generate signed URLs (7-day expiry) for every image
    const processedEntries = await Promise.all(
        (entries || []).map(async (entry) => {
            const images: any[] = entry.journal_entry_images || []
            if (images.length === 0) return entry

            const signedImages = await Promise.all(
                images.map(async (img: any) => {
                    const { data } = await supabase.storage
                        .from('journal-images')
                        .createSignedUrl(img.storage_path, 604800) // 7 days
                    return { ...img, signed_url: data?.signedUrl || null }
                })
            )
            return { ...entry, journal_entry_images: signedImages }
        })
    )

    // Reference data for the create/edit form selectors
    const { data: flightLogs } = await supabase
        .from('flight_logs')
        .select('id, flight_date, from_location, to_location, duration_minutes')
        .eq('user_id', user.id)
        .order('flight_date', { ascending: false })
        .limit(100)

    const { data: activeGoals } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status_id', 1)
        .order('title')

    const { data: aircrafts } = await supabase
        .from('user_aircrafts')
        .select('id, registration, description')
        .eq('user_id', user.id)
        .order('description')

    return (
        <JournalClient
            initialEntries={processedEntries}
            flightLogs={flightLogs || []}
            goals={activeGoals || []}
            aircrafts={aircrafts || []}
        />
    )
}
