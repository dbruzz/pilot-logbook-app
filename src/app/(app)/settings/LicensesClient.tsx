'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ShieldCheck, Plus, Pencil, Trash2, Paperclip, ExternalLink, X, ChevronDown } from 'lucide-react'
import { createLicense, updateLicense, deleteLicense, getLicenseFileUrl } from './licenseActions'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────

type LicenseStatus = 'active' | 'expiringSoon' | 'expired'

function getLicenseStatus(expiresAt: string | null): LicenseStatus | null {
    if (!expiresAt) return null
    const daysLeft = Math.ceil(
        (new Date(expiresAt).getTime() - Date.now()) / 86_400_000,
    )
    if (daysLeft < 0) return 'expired'
    if (daysLeft <= 30) return 'expiringSoon'
    return 'active'
}

const STATUS_CLASSES: Record<LicenseStatus, string> = {
    active: 'text-green-600 bg-green-500/10 border-green-500/20',
    expiringSoon: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
    expired: 'text-destructive bg-destructive/10 border-destructive/20',
}

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

function getFileName(filePath: string): string {
    // path is {userId}/{licenseId}/{timestamp}.ext — extract the last segment
    return filePath.split('/').pop() ?? filePath
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function LicensesClient({ initialLicenses }: { initialLicenses: any[] }) {
    const { t } = useTranslation()
    const [licenses] = useState(initialLicenses)
    const [isOpen, setIsOpen] = useState(false)       // starts collapsed
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLicense, setEditingLicense] = useState<any | null>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [removeFile, setRemoveFile] = useState(false)

    const handleOpenModal = (license: any = null) => {
        setEditingLicense(license)
        setRemoveFile(false)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setEditingLicense(null)
        setRemoveFile(false)
        setIsModalOpen(false)
    }

    const onSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        if (removeFile) formData.set('remove_file', 'true')

        if (editingLicense) {
            await updateLicense(editingLicense.id, formData)
        } else {
            await createLicense(formData)
        }
        window.location.reload()
    }

    const handleDelete = async (id: number) => {
        if (!confirm(t.common.delete + '?')) return
        setLoadingId(id)
        await deleteLicense(id)
        window.location.reload()
    }

    const handleViewFile = async (filePath: string) => {
        const url = await getLicenseFileUrl(filePath)
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
    }

    const docTypeOptions = [
        { value: 'license',   label: t.licenses.docTypes.license },
        { value: 'medical',   label: t.licenses.docTypes.medical },
        { value: 'rating',    label: t.licenses.docTypes.rating },
        { value: 'language',  label: t.licenses.docTypes.language },
        { value: 'radio',     label: t.licenses.docTypes.radio },
        { value: 'insurance', label: t.licenses.docTypes.insurance },
        { value: 'other',     label: t.licenses.docTypes.other },
    ]

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header — always visible, toggle + add button */}
            <div className="flex items-center justify-between px-6 py-4">
                <button
                    type="button"
                    onClick={() => setIsOpen(o => !o)}
                    className="flex-1 flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
                >
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-base">{t.licenses.title}</span>
                    {licenses.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {licenses.length}
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            'w-4 h-4 text-muted-foreground transition-transform duration-300 ml-auto mr-2',
                            isOpen && 'rotate-180',
                        )}
                    />
                </button>
                <Button onClick={() => handleOpenModal()} size="sm" className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.licenses.addLicense}</span>
                </Button>
            </div>

            {/* Content — animated */}
            <div
                className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
            >
                <div className="overflow-hidden">
                    <div className="px-6 pb-6 space-y-3">
                    {licenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                            <ShieldCheck className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm">{t.licenses.noLicenses}</p>
                        </div>
                    ) : (
                        licenses.map(license => {
                            const status = getLicenseStatus(license.expires_at)
                            return (
                                <div
                                    key={license.id}
                                    className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors"
                                >
                                    {/* Left: info */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        {/* Name + type badge + status badge */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-sm leading-tight">
                                                {license.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border bg-muted">
                                                {t.licenses.docTypes[license.doc_type as keyof typeof t.licenses.docTypes] ?? license.doc_type}
                                            </span>
                                            {status && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CLASSES[status]}`}>
                                                    {t.licenses.status[status]}
                                                </span>
                                            )}
                                        </div>

                                        {/* Secondary info row */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                            {license.issuing_authority && (
                                                <span>{license.issuing_authority}</span>
                                            )}
                                            {license.identifier && (
                                                <span>#{license.identifier}</span>
                                            )}
                                            {license.expires_at && (
                                                <span>
                                                    {t.licenses.expiresAt}: {license.expires_at}
                                                </span>
                                            )}
                                        </div>

                                        {/* Restrictions */}
                                        {license.restrictions && (
                                            <p className="text-xs text-muted-foreground italic truncate">
                                                {license.restrictions}
                                            </p>
                                        )}

                                        {/* File link */}
                                        {license.file_path && (
                                            <button
                                                type="button"
                                                onClick={() => handleViewFile(license.file_path)}
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                <Paperclip className="w-3 h-3 shrink-0" />
                                                <span className="truncate max-w-[200px]">
                                                    {getFileName(license.file_path)}
                                                </span>
                                                <ExternalLink className="w-3 h-3 shrink-0" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Right: actions */}
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenModal(license)}
                                            title={t.common.edit}
                                        >
                                            <Pencil className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(license.id)}
                                            disabled={loadingId === license.id}
                                            className="hover:text-destructive hover:bg-destructive/10"
                                            title={t.common.delete}
                                        >
                                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    </div>
                </div>
            </div>

            {/* ── Create / Edit modal ── */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingLicense ? t.common.edit : t.licenses.addLicense}
                className="max-w-xl"
            >
                <form action={onSubmit} className="space-y-4 mt-2">
                    {/* Tipo + Nombre */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">{t.licenses.docType}</label>
                            <Select
                                name="doc_type"
                                required
                                defaultValue={editingLicense?.doc_type ?? 'license'}
                                options={docTypeOptions}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                {t.licenses.name} <span className="text-destructive">*</span>
                            </label>
                            <Input
                                name="name"
                                required
                                defaultValue={editingLicense?.name ?? ''}
                                placeholder="Ej: Licencia PPL"
                            />
                        </div>
                    </div>

                    {/* Autoridad + Número */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t.licenses.issuingAuthority}
                            </label>
                            <Input
                                name="issuing_authority"
                                defaultValue={editingLicense?.issuing_authority ?? ''}
                                placeholder="Ej: ANAC"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t.licenses.identifier}
                            </label>
                            <Input
                                name="identifier"
                                defaultValue={editingLicense?.identifier ?? ''}
                                placeholder="Ej: ARG-00123"
                            />
                        </div>
                    </div>

                    {/* Restricciones */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">
                            {t.licenses.restrictions}
                        </label>
                        <Input
                            name="restrictions"
                            defaultValue={editingLicense?.restrictions ?? ''}
                            placeholder="Ej: VFR day only"
                        />
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">
                            {t.licenses.notes}
                        </label>
                        <Input
                            name="notes"
                            defaultValue={editingLicense?.notes ?? ''}
                        />
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t.licenses.issuedAt}
                            </label>
                            <Input
                                type="date"
                                name="issued_at"
                                defaultValue={editingLicense?.issued_at ?? ''}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t.licenses.expiresAt}
                            </label>
                            <Input
                                type="date"
                                name="expires_at"
                                defaultValue={editingLicense?.expires_at ?? ''}
                            />
                        </div>
                    </div>

                    {/* Archivo adjunto */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">
                            {t.licenses.attachment}
                        </label>

                        {editingLicense?.file_path && !removeFile ? (
                            /* Existing file: show name with remove button */
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/50 text-sm">
                                <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="flex-1 truncate text-muted-foreground text-xs">
                                    {getFileName(editingLicense.file_path)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setRemoveFile(true)}
                                    className="text-destructive hover:opacity-70 transition-opacity shrink-0"
                                    title={t.licenses.removeFile}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            /* No file / file was removed: show picker */
                            <div className="space-y-1">
                                <input
                                    type="file"
                                    name="file"
                                    id="license-file-input"
                                    className="block w-full text-sm text-muted-foreground
                                        file:mr-3 file:py-1.5 file:px-3
                                        file:rounded-lg file:border-0
                                        file:text-xs file:font-medium
                                        file:bg-primary/10 file:text-primary
                                        hover:file:bg-primary/20 transition-colors cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t.licenses.attachmentHint}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            {t.common.cancel}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? t.common.loading : t.common.save}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
