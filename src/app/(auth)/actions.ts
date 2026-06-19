'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        const msg = error.message.toLowerCase()
        const code = (error as unknown as { code?: string }).code

        // Account exists but email is not confirmed yet
        if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
            return { errorCode: 'emailNotConfirmed', email }
        }

        // Supabase returns "Invalid login credentials" for both wrong password and unknown email.
        // We disambiguate by attempting a passwordless OTP request (no email is actually sent)
        // and checking if it succeeds — that only works if the email exists.
        if (msg.includes('invalid login credentials')) {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false },
            })
            if (otpError && (
                otpError.message.toLowerCase().includes('signups not allowed') ||
                otpError.message.toLowerCase().includes('user not found') ||
                otpError.message.toLowerCase().includes('no user found')
            )) {
                return { errorCode: 'emailNotFound' }
            }
            return { errorCode: 'invalidPassword' }
        }

        return { errorCode: 'generic' }
    }

    redirect('/dashboard')
}

export async function resendConfirmation(email: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
    })

    if (error) {
        const msg = error.message.toLowerCase()
        // If Supabase rejects because the email is already confirmed, surface that specifically
        // so the UI can redirect the user to login instead of showing a generic error.
        if (
            msg.includes('already confirmed') ||
            msg.includes('email already') ||
            msg.includes('already registered') ||
            msg.includes('user already')
        ) {
            return { errorCode: 'emailAlreadyVerified' }
        }
        return { errorCode: 'resendError' }
    }

    return { success: true }
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    // Language is detected on the client (navigator.language) and appended to formData
    // before calling this action, so it is always available here.
    const language = (formData.get('language') as string) || 'es'
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // Store the user's preferred language so Supabase email templates
            // can use {{ .Data.language }} to send content in the right language.
            data: { language },
        },
    })

    if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('email address is already')) {
            return { errorCode: 'emailAlreadyVerified' }
        }
        return { errorCode: 'generic' }
    }

    // When email confirmation is enabled, Supabase returns a user with empty identities
    // for both already-verified and still-unverified existing accounts.
    // We no longer probe with resend() here to avoid rate-limiting the user's first manual
    // resend attempt. The resendConfirmation() action handles differentiation on demand:
    //   - resend succeeds → account is unverified
    //   - resend fails with "already confirmed" → account is verified
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { errorCode: 'emailExists', email }
    }

    if (data.user && data.session === null) {
        return { needsEmailConfirmation: true }
    }

    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
