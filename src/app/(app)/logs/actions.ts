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
    const aircraft_id_str = formData.get('aircraft_id') as string

    const aircraft_id = aircraft_id_str ? parseInt(aircraft_id_str, 10) : null
    const from_location = formData.get('from_location') as string || null
    const to_location = formData.get('to_location') as string || null
    const notes = formData.get('notes') as string || null

    const rawFlightType = formData.get('flight_type') as string || ''
    const flight_type = rawFlightType === '' || rawFlightType === 'no_type' ? null : rawFlightType
    const custom_flight_type = rawFlightType === 'other'
        ? (formData.get('custom_flight_type') as string || null)
        : null
    // Keep is_instruction in sync for legacy display
    const is_instruction = flight_type === 'instruction'

    const duration_minutes = timeToMinutes(durationStr)

    if (duration_minutes <= 0) return { error: 'Duration must be greater than 0' }

    const { data: newLog, error } = await supabase.from('flight_logs').insert({
        user_id: user.id,
        flight_date,
        duration_minutes,
        is_instruction,
        flight_type,
        custom_flight_type,
        aircraft_id,
        from_location,
        to_location,
        notes,
    }).select('id').single()

    if (error) return { error: error.message }

    // Save goal associations
    const goalIds = formData.getAll('goal_ids').map(v => parseInt(v as string, 10)).filter(Boolean)
    if (newLog && goalIds.length > 0) {
        await supabase.from('flight_log_goals').insert(
            goalIds.map(goal_id => ({ flight_log_id: newLog.id, goal_id }))
        )
    }

    revalidatePath('/logs')
    revalidatePath('/dashboard')
    revalidatePath('/goals')
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
    revalidatePath('/goals')
    return { success: true }
}

export async function updateLog(id: number, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const flight_date = formData.get('flight_date') as string
    const durationStr = formData.get('duration') as string // HH:MM
    const aircraft_id_str = formData.get('aircraft_id') as string

    const aircraft_id = aircraft_id_str ? parseInt(aircraft_id_str, 10) : null
    const from_location = formData.get('from_location') as string || null
    const to_location = formData.get('to_location') as string || null
    const notes = formData.get('notes') as string || null

    const rawFlightType = formData.get('flight_type') as string || ''
    const flight_type = rawFlightType === '' || rawFlightType === 'no_type' ? null : rawFlightType
    const custom_flight_type = rawFlightType === 'other'
        ? (formData.get('custom_flight_type') as string || null)
        : null
    // Keep is_instruction in sync for legacy display
    const is_instruction = flight_type === 'instruction'

    const duration_minutes = timeToMinutes(durationStr)

    if (duration_minutes <= 0) return { error: 'Duration must be greater than 0' }

    const { error } = await supabase
        .from('flight_logs')
        .update({
            flight_date,
            duration_minutes,
            is_instruction,
            flight_type,
            custom_flight_type,
            aircraft_id,
            from_location,
            to_location,
            notes,
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    // Sync goal associations: delete existing then re-insert selected
    await supabase.from('flight_log_goals').delete().eq('flight_log_id', id)
    const goalIds = formData.getAll('goal_ids').map(v => parseInt(v as string, 10)).filter(Boolean)
    if (goalIds.length > 0) {
        await supabase.from('flight_log_goals').insert(
            goalIds.map(goal_id => ({ flight_log_id: id, goal_id }))
        )
    }

    revalidatePath('/logs')
    revalidatePath('/dashboard')
    revalidatePath('/goals')
    return { success: true }
}

