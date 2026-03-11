import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

    const { data: languages } = await supabase
        .from('languages')
        .select('*')

    return (
        <SettingsClient
            profile={profile || {}}
            settings={settings || {}}
            languages={languages || []}
            email={user.email || ''}
        />
    )
}
