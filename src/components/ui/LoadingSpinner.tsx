import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export function LoadingSpinner({
    className,
    size = 24,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: number }) {
    return (
        <div
            className={cn("flex flex-col items-center justify-center p-4", className)}
            {...props}
        >
            <Loader2
                size={size}
                className="animate-spin text-primary"
            />
        </div>
    )
}
