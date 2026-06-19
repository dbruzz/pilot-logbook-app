'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const BUCKET = 'pilot-documents'

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

async function uploadLicenseFile(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    licenseId: number,
    file: File,
): Promise<string | null> {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const filePath = `${userId}/${licenseId}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, bytes, { contentType: file.type, upsert: false })

    if (error) {
        console.error('[license upload]', error.message)
        return null
    }
    return filePath
}

async function deleteLicenseFile(
    supabase: Awaited<ReturnType<typeof createClient>>,
    filePath: string,
): Promise<void> {
    const { error } = await supabase.storage.from(BUCKET).remove([filePath])
    if (error) console.error('[license delete file]', error.message)
}

function parseFormFields(formData: FormData) {
    return {
        doc_type: formData.get('doc_type') as string,
        name: (formData.get('name') as string).trim(),
        issuing_authority: (formData.get('issuing_authority') as string)?.trim() || null,
        identifier: (formData.get('identifier') as string)?.trim() || null,
        restrictions: (formData.get('restrictions') as string)?.trim() || null,
        notes: (formData.get('notes') as string)?.trim() || null,
        issued_at: (formData.get('issued_at') as string) || null,
        expires_at: (formData.get('expires_at') as string) || null,
    }
}

// ─────────────────────────────────────────────
// Public actions
// ─────────────────────────────────────────────

export async function createLicense(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const fields = parseFormFields(formData)

    // 1. Insert the row first to obtain the generated ID
    const { data: license, error } = await supabase
        .from('user_licenses')
        .insert({ user_id: user.id, ...fields })
        .select('id')
        .single()

    if (error) return { error: error.message }

    // 2. Upload file if provided and non-empty
    const file = formData.get('file') as File | null
    if (file && file.size > 0) {
        const filePath = await uploadLicenseFile(supabase, user.id, license.id, file)
        if (filePath) {
            await supabase
                .from('user_licenses')
                .update({ file_path: filePath })
                .eq('id', license.id)
                .eq('user_id', user.id)
        }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateLicense(id: number, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const fields = parseFormFields(formData)
    const file = formData.get('file') as File | null
    const shouldRemoveFile = formData.get('remove_file') === 'true'

    // Fetch current file_path so we can clean up if needed
    const { data: current } = await supabase
        .from('user_licenses')
        .select('file_path')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    let file_path: string | null = current?.file_path ?? null

    if (shouldRemoveFile && file_path) {
        await deleteLicenseFile(supabase, file_path)
        file_path = null
    } else if (file && file.size > 0) {
        // Delete the old file before uploading the new one
        if (file_path) await deleteLicenseFile(supabase, file_path)
        file_path = await uploadLicenseFile(supabase, user.id, id, file)
    }

    const { error } = await supabase
        .from('user_licenses')
        .update({ ...fields, file_path, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteLicense(id: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Remove the Storage file before deleting the row
    const { data: license } = await supabase
        .from('user_licenses')
        .select('file_path')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (license?.file_path) {
        await deleteLicenseFile(supabase, license.file_path)
    }

    const { error } = await supabase
        .from('user_licenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
}

/** Returns a signed URL (1 hour) for viewing/downloading an attached file. */
export async function getLicenseFileUrl(filePath: string): Promise<string | null> {
    const supabase = await createClient()
    const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 3600)
    return data?.signedUrl ?? null
}
