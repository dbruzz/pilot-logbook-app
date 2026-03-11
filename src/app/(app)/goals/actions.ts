'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGoal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const target_minutes = parseInt(formData.get('target_minutes') as string, 10)
    const start_date = formData.get('start_date') as string || null
    const end_date = formData.get('end_date') as string || null

    const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        title,
        description,
        target_minutes,
        start_date,
        end_date,
        status_id: 1, // active
        is_focus: false,
    })

    if (error) return { error: error.message }
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateGoal(id: number, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const target_minutes = parseInt(formData.get('target_minutes') as string, 10)
    const start_date = formData.get('start_date') as string || null
    const end_date = formData.get('end_date') as string || null
    const status_id = parseInt(formData.get('status_id') as string, 10)

    const { error } = await supabase
        .from('goals')
        .update({
            title,
            description,
            target_minutes,
            start_date,
            end_date,
            status_id,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteGoal(id: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function setFocusGoal(id: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // First, unset all focus goals for this user
    await supabase
        .from('goals')
        .update({ is_focus: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_focus', true)

    // Then set the new focus goal
    const { error } = await supabase
        .from('goals')
        .update({ is_focus: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true }
}
