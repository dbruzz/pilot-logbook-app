import { Home, Target, Plane, Settings, NotebookPen, Goal } from 'lucide-react'

export const INavItems = [
    {
        path: '/dashboard',
        labelKey: 'dashboard',
        icon: Home,
    },
    {
        path: '/goals',
        labelKey: 'goals',
        // icon: Target,
        icon: Goal,
    },
    {
        path: '/logs',
        labelKey: 'logs',
        icon: NotebookPen,
    },
    {
        path: '/aircrafts',
        labelKey: 'aircrafts',
        icon: Plane, // Using the same plane icon or perhaps something else like 'Paperclip' or 'Rocket', we'll reuse Plane for now as it makes the most sense
    },
    {
        path: '/settings',
        labelKey: 'settings',
        icon: Settings,
    },
] as const
