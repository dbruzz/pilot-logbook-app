export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    name: string | null
                    last_name: string | null
                    birthdate: string | null
                    email: string | null
                    created_at: string
                    updated_at: string
                }
            }
            user_settings: {
                Row: {
                    id: number
                    user_id: string
                    language_id: number | null
                    theme: 'light' | 'dark' | 'system' | null
                    notifications_enabled: boolean | null
                    avatar_type: 'emoji' | 'initials' | null
                    is_active: boolean | null
                    created_at: string
                    updated_at: string
                }
            }
            goals: {
                Row: {
                    id: number
                    user_id: string
                    title: string
                    description: string | null
                    target_minutes: number
                    start_date: string | null
                    end_date: string | null
                    status_id: number
                    is_focus: boolean
                    created_at: string
                    updated_at: string
                    completed_at: string | null
                }
            }
            flight_logs: {
                Row: {
                    id: number
                    user_id: string
                    aircraft_id: number | null
                    flight_date: string
                    duration_minutes: number
                    is_instruction: boolean
                    from_location: string | null
                    to_location: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
            }
            user_aircrafts: {
                Row: {
                    id: number
                    user_id: string
                    aircraft_category_id: number
                    description: string
                    registration: string | null
                    model: string | null
                    created_at: string
                }
            }
            languages: {
                Row: {
                    id: number
                    description: string
                }
            }
            goal_statuses: {
                Row: {
                    id: number
                    description: string
                }
            }
            aircrafts_categories: {
                Row: {
                    id: number
                    description: string
                }
            }
        }
    }
}
