'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAndSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const last_name = formData.get('last_name') as string
    const birthdate = formData.get('birthdate') as string || null
    const language_id_str = formData.get('language_id') as string // 1=es, 2=en
    const theme = formData.get('theme') as 'light' | 'dark' | 'system'
    const notifications_enabled = formData.get('notifications_enabled') === 'on'
    const avatar_type = formData.get('avatar_type') as 'emoji' | 'initials'

    // Update profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            name,
            last_name,
            birthdate,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (profileError) return { error: profileError.message }

    // Update settings
    const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
            language_id: language_id_str ? parseInt(language_id_str, 10) : null,
            theme,
            notifications_enabled,
            avatar_type,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

    if (settingsError) return { error: settingsError.message }

    revalidatePath('/settings')
    return { success: true }
}
