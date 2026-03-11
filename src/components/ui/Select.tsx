import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string; label: string }[]
    placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, options, placeholder, ...props }, ref) => {
        return (
            <div className="relative w-full">
                <select
                    ref={ref}
                    className={cn(
                        "flex h-10 w-full appearance-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                        "pr-8", // Make room for chevron
                        className
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled hidden>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        )
    }
)
Select.displayName = "Select"
