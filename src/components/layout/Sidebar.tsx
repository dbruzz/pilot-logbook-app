'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/hooks/use-translation'
import { INavItems } from './NavigationItems'
import { Plane } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
    const pathname = usePathname()
    const { t } = useTranslation()

    return (
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                    <Plane className="w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight">Flight Logbook</span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {INavItems.map((item) => {
                    const isActive =
                        (item.path as string) === '/'
                            ? pathname === '/'
                            : pathname.startsWith(item.path)
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                            <span>{t.nav[item.labelKey as keyof typeof t.nav]}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-secondary/50 rounded-2xl p-4 text-sm text-center">
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Version</p>
                    <p className="font-semibold">0.1.0 MVP</p>
                </div>
            </div>
        </aside>
    )
}
