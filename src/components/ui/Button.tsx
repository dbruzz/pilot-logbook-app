import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm": variant === 'default',
                        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm": variant === 'destructive',
                        "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm": variant === 'outline',
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm": variant === 'secondary',
                        "hover:bg-accent hover:text-accent-foreground": variant === 'ghost',
                        "text-primary underline-offset-4 hover:underline": variant === 'link',

                        "h-10 px-4 py-2": size === 'default',
                        "h-9 rounded-lg px-3": size === 'sm',
                        "h-11 rounded-xl px-8": size === 'lg',
                        "h-10 w-10": size === 'icon',
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'
