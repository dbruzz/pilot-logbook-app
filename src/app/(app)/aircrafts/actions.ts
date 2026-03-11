'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAircraft(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const description = formData.get('description') as string
    const registration = formData.get('registration') as string || null
    const model = formData.get('model') as string || null
    const aircraft_category_id = parseInt(formData.get('aircraft_category_id') as string, 10)

    const { error } = await supabase.from('user_aircrafts').insert({
        user_id: user.id,
        description,
        registration,
        model,
        aircraft_category_id,
    })

    if (error) return { error: error.message }
    revalidatePath('/aircrafts')
    revalidatePath('/logs')
    return { success: true }
}

export async function deleteAircraft(id: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('user_aircrafts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/aircrafts')
    revalidatePath('/logs')
    return { success: true }
}

export async function updateAircraft(id: number, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const description = formData.get('description') as string
    const registration = formData.get('registration') as string || null
    const model = formData.get('model') as string || null
    const aircraft_category_id = parseInt(formData.get('aircraft_category_id') as string, 10)

    const { error } = await supabase
        .from('user_aircrafts')
        .update({
            description,
            registration,
            model,
            aircraft_category_id,
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/aircrafts')
    revalidatePath('/logs')
    return { success: true }
}
