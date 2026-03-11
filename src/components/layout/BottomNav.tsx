'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/hooks/use-translation'
import { INavItems } from './NavigationItems'
import { cn } from '@/lib/utils'

export function BottomNav() {
    const pathname = usePathname()
    const { t } = useTranslation()

    return (
        <nav className="md:hidden fixed bottom-0 w-full bg-card/80 backdrop-blur-lg border-t border-border flex justify-around items-center h-16 pb-safe z-50">
            {INavItems.map((item) => {
                const isActive = pathname.startsWith(item.path)
                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full transition-colors duration-200",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn("w-6 h-6 mb-1", isActive ? "fill-primary/20" : "")} />
                        <span className="text-[10px] font-medium leading-none">
                            {t.nav[item.labelKey as keyof typeof t.nav]}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
