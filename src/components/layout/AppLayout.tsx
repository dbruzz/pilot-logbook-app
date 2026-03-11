'use client'

import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-4 pb-20 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
