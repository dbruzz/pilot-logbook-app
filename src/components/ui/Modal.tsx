'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./Button"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    className?: string
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
}: ModalProps) {
    // Prevent scrolling on body when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 flex items-center justify-center p-4">
            <div
                className="fixed inset-0"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={cn(
                    "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl",
                    className
                )}
                role="dialog"
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 rounded-full"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </Button>

                {(title || description) && (
                    <div className="flex flex-col space-y-1.5 text-center sm:text-left pr-6">
                        {title && (
                            <h2 className="text-lg font-semibold leading-none tracking-tight">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {children}
            </div>
        </div>
    )
}
