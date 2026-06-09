'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── helpers ────────────────────────────────────────────────────

async function uploadImages(
    supabase: any,
    userId: string,
    entryId: number,
    formData: FormData
): Promise<void> {
    const imageCount = parseInt(formData.get('image_count') as string || '0', 10)
    for (let i = 0; i < imageCount; i++) {
        const file = formData.get(`image_${i}`) as File
        if (!file || file.size === 0) continue

        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${userId}/${entryId}/${Date.now()}-${i}.${ext}`

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error: uploadError } = await supabase.storage
            .from('journal-images')
            .upload(path, buffer, { contentType: file.type, upsert: false })

        if (uploadError) {
            console.error('Image upload error:', uploadError.message)
            continue
        }

        await supabase.from('journal_entry_images').insert({
            journal_entry_id: entryId,
            storage_path: path,
        })
    }
}

// ─── server actions ──────────────────────────────────────────────

export async function createJournalEntry(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const entry_date = formData.get('entry_date') as string
    const entry_type = formData.get('entry_type') as string

    const flightLogIdStr = formData.get('flight_log_id') as string
    const goalIdStr = formData.get('goal_id') as string
    const aircraftIdStr = formData.get('aircraft_id') as string

    const flight_log_id = flightLogIdStr ? parseInt(flightLogIdStr, 10) : null
    const goal_id = goalIdStr ? parseInt(goalIdStr, 10) : null
    const aircraft_id = aircraftIdStr ? parseInt(aircraftIdStr, 10) : null

    const { data: entry, error } = await supabase
        .from('journal_entries')
        .insert({
            user_id: user.id,
            title,
            content,
            entry_date,
            entry_type,
            flight_log_id,
            goal_id,
            aircraft_id,
        })
        .select('id')
        .single()

    if (error) return { error: error.message }

    await uploadImages(supabase, user.id, entry.id, formData)

    revalidatePath('/journal')
    return { success: true }
}

export async function updateJournalEntry(id: number, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const entry_date = formData.get('entry_date') as string
    const entry_type = formData.get('entry_type') as string

    const flightLogIdStr = formData.get('flight_log_id') as string
    const goalIdStr = formData.get('goal_id') as string
    const aircraftIdStr = formData.get('aircraft_id') as string

    const flight_log_id = flightLogIdStr ? parseInt(flightLogIdStr, 10) : null
    const goal_id = goalIdStr ? parseInt(goalIdStr, 10) : null
    const aircraft_id = aircraftIdStr ? parseInt(aircraftIdStr, 10) : null

    const { error } = await supabase
        .from('journal_entries')
        .update({ title, content, entry_date, entry_type, flight_log_id, goal_id, aircraft_id })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    // Remove images the user marked for deletion
    const removeIds = formData.getAll('remove_image_id')
        .map(v => parseInt(v as string, 10))
        .filter(Boolean)

    if (removeIds.length > 0) {
        const { data: toRemove } = await supabase
            .from('journal_entry_images')
            .select('storage_path')
            .in('id', removeIds)

        if (toRemove?.length) {
            await supabase.storage
                .from('journal-images')
                .remove(toRemove.map((img: any) => img.storage_path))
        }

        await supabase
            .from('journal_entry_images')
            .delete()
            .in('id', removeIds)
    }

    // Upload newly added images
    await uploadImages(supabase, user.id, id, formData)

    revalidatePath('/journal')
    return { success: true }
}

export async function deleteJournalEntry(id: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Fetch image paths before cascade delete removes the rows
    const { data: images } = await supabase
        .from('journal_entry_images')
        .select('storage_path')
        .eq('journal_entry_id', id)

    if (images?.length) {
        await supabase.storage
            .from('journal-images')
            .remove(images.map((img: any) => img.storage_path))
    }

    // journal_entry_images rows are removed by ON DELETE CASCADE
    await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    revalidatePath('/journal')
    return { success: true }
}
