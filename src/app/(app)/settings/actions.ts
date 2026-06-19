'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const last_name = formData.get('last_name') as string
    const birthdate = formData.get('birthdate') as string || null

    const { error } = await supabase
        .from('profiles')
        .update({ name, last_name, birthdate, updated_at: new Date().toISOString() })
        .eq('id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/settings')
    return { success: true }
}

export async function updateSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const language_id_str = formData.get('language_id') as string
    const theme = formData.get('theme') as 'light' | 'dark' | 'system'
    const notifications_enabled = formData.get('notifications_enabled') === 'on'
    const avatar_type = formData.get('avatar_type') as 'emoji' | 'initials'
    const duration_format = (formData.get('duration_format') as string) || 'hhmm'
    const distance_unit = (formData.get('distance_unit') as string) || 'km'

    const { error } = await supabase
        .from('user_settings')
        .update({
            language_id: language_id_str ? parseInt(language_id_str, 10) : null,
            theme,
            notifications_enabled,
            avatar_type,
            duration_format,
            distance_unit,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/settings')
    return { success: true }
}

/** @deprecated Use updateProfile + updateSettings separately */
export async function updateProfileAndSettings(formData: FormData) {
    await updateProfile(formData)
    await updateSettings(formData)
}
