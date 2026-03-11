'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to convert HH:MM string to minutes
function timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0
    const [hours, minutes] = timeStr.split(':').map(Number)
    return (hours * 60) + (minutes || 0)
}

export async function createLog(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const flight_date = formData.get('flight_date') as string
    const durationStr = formData.get('duration') as string // HH:MM
    const is_instruction = formData.get('is_instruction') === 'on'
    const aircraft_id_str = formData.get('aircraft_id') as string

    const aircraft_id = aircraft_id_str ? parseInt(aircraft_id_str, 10) : null
    const from_location = formData.get('from_location') as string || null
    const to_location = formData.get('to_location') as string || null
    const notes = formData.get('notes') as string || null

    const duration_minutes = timeToMinutes(durationStr)

    if (duration_minutes <= 0) return { error: 'Duration must be greater than 0' }

    const { error } = await supabase.from('flight_logs').insert({
        user_id: user.id,
        flight_date,
        duration_minutes,
        is_instruction,
        aircraft_id,
        from_location,
        to_location,
        notes,
    })

    if (error) return { error: error.message }
    revalidatePath('/logs')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteLog(id: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('flight_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/logs')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateLog(id: number, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const flight_date = formData.get('flight_date') as string
    const durationStr = formData.get('duration') as string // HH:MM
    const is_instruction = formData.get('is_instruction') === 'on'
    const aircraft_id_str = formData.get('aircraft_id') as string

    const aircraft_id = aircraft_id_str ? parseInt(aircraft_id_str, 10) : null
    const from_location = formData.get('from_location') as string || null
    const to_location = formData.get('to_location') as string || null
    const notes = formData.get('notes') as string || null

    const duration_minutes = timeToMinutes(durationStr)

    if (duration_minutes <= 0) return { error: 'Duration must be greater than 0' }

    const { error } = await supabase
        .from('flight_logs')
        .update({
            flight_date,
            duration_minutes,
            is_instruction,
            aircraft_id,
            from_location,
            to_location,
            notes,
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/logs')
    revalidatePath('/dashboard')
    return { success: true }
}
