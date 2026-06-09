'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import {
    Plus, Trash2, Pencil, Calendar, Plane as PlaneIcon,
    Goal as GoalIcon, BookOpen, Image as ImageIcon, X,
} from 'lucide-react'
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from './actions'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

// ─── types ───────────────────────────────────────────────────────

type EntryType = 'note' | 'experience' | 'achievement'

const BADGE: Record<EntryType, string> = {
    note: 'bg-secondary text-secondary-foreground',
    experience: 'bg-accent text-accent-foreground',
    achievement: 'bg-primary/20 text-primary',
}

interface JournalClientProps {
    initialEntries: any[]
    flightLogs: any[]
    goals: any[]
    aircrafts: any[]
}

// ─── component ───────────────────────────────────────────────────

export default function JournalClient({
    initialEntries,
    flightLogs,
    goals,
    aircrafts,
}: JournalClientProps) {
    const { t, language } = useTranslation()
    const dateLocale = language === 'es' ? es : enUS

    // ── ui state ──────────────────────────────────────────────────
    const [entries] = useState(initialEntries)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState<any>(null)
    const [viewingEntry, setViewingEntry] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loadingId, setLoadingId] = useState<number | null>(null)

    // ── create-form image state ────────────────────────────────────
    const [createImages, setCreateImages] = useState<File[]>([])
    const [createPreviews, setCreatePreviews] = useState<string[]>([])
    const [createType, setCreateType] = useState<EntryType>('note')

    // ── edit-form image state ──────────────────────────────────────
    const [editNewImages, setEditNewImages] = useState<File[]>([])
    const [editNewPreviews, setEditNewPreviews] = useState<string[]>([])
    const [editRemovedIds, setEditRemovedIds] = useState<number[]>([])
    const [editType, setEditType] = useState<EntryType>('note')

    // ── helpers ───────────────────────────────────────────────────

    const fmtDate = (d: string) => {
        const [y, m, day] = d.split('-').map(Number)
        return format(new Date(y, m - 1, day), 'dd MMM yyyy', { locale: dateLocale })
    }

    const fmtDuration = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`

    const todayISO = () => new Date().toISOString().split('T')[0]

    // ── image helpers ─────────────────────────────────────────────

    const pickImages = (
        e: React.ChangeEvent<HTMLInputElement>,
        current: File[],
        previews: string[],
        reservedSlots: number,
        setFiles: (f: File[]) => void,
        setPreviews: (p: string[]) => void
    ) => {
        const available = 3 - current.length - reservedSlots
        if (available <= 0 || !e.target.files) return
        const added = Array.from(e.target.files).slice(0, available)
        setFiles([...current, ...added])
        setPreviews([...previews, ...added.map(f => URL.createObjectURL(f))])
        e.target.value = ''
    }

    const removeNewImage = (
        idx: number,
        files: File[],
        previews: string[],
        setFiles: (f: File[]) => void,
        setPreviews: (p: string[]) => void
    ) => {
        URL.revokeObjectURL(previews[idx])
        setFiles(files.filter((_, i) => i !== idx))
        setPreviews(previews.filter((_, i) => i !== idx))
    }

    // ── submit handlers ───────────────────────────────────────────

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        createImages.forEach((f, i) => fd.set(`image_${i}`, f, f.name))
        fd.set('image_count', String(createImages.length))
        setIsSubmitting(true)
        await createJournalEntry(fd)
        createPreviews.forEach(URL.revokeObjectURL)
        window.location.reload()
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        editNewImages.forEach((f, i) => fd.set(`image_${i}`, f, f.name))
        fd.set('image_count', String(editNewImages.length))
        editRemovedIds.forEach(id => fd.append('remove_image_id', String(id)))
        setIsSubmitting(true)
        await updateJournalEntry(editingEntry.id, fd)
        editNewPreviews.forEach(URL.revokeObjectURL)
        window.location.reload()
    }

    const handleDelete = async (id: number) => {
        if (!confirm(t.common.delete + '?')) return
        setLoadingId(id)
        await deleteJournalEntry(id)
        window.location.reload()
    }

    // ── modal open / close ────────────────────────────────────────

    const openEdit = (entry: any) => {
        setEditingEntry(entry)
        setEditType(entry.entry_type as EntryType)
        setEditNewImages([])
        setEditNewPreviews([])
        setEditRemovedIds([])
    }

    const closeCreate = () => {
        if (isSubmitting) return
        createPreviews.forEach(URL.revokeObjectURL)
        setCreateImages([])
        setCreatePreviews([])
        setCreateType('note')
        setIsCreateOpen(false)
    }

    const closeEdit = () => {
        if (isSubmitting) return
        editNewPreviews.forEach(URL.revokeObjectURL)
        setEditNewImages([])
        setEditNewPreviews([])
        setEditRemovedIds([])
        setEditingEntry(null)
    }

    // ── computed values ───────────────────────────────────────────

    const editExistingImages = editingEntry
        ? (editingEntry.journal_entry_images || []).filter((img: any) => !editRemovedIds.includes(img.id))
        : []

    const entryTypeOptions = [
        { value: 'note', label: t.journal.entryTypes.note },
        { value: 'experience', label: t.journal.entryTypes.experience },
        { value: 'achievement', label: t.journal.entryTypes.achievement },
    ]

    const flightLogOptions = [
        { value: '', label: t.journal.noRelation },
        ...flightLogs.map(log => ({
            value: String(log.id),
            label: `${fmtDate(log.flight_date)}${log.from_location ? ` · ${log.from_location}→${log.to_location || '?'}` : ''}`,
        })),
    ]

    const goalOptions = [
        { value: '', label: t.journal.noRelation },
        ...goals.map(g => ({ value: String(g.id), label: g.title })),
    ]

    const aircraftOptions = [
        { value: '', label: t.journal.noRelation },
        ...aircrafts.map(a => ({
            value: String(a.id),
            label: a.registration ? `${a.registration} (${a.description})` : a.description,
        })),
    ]

    // ─── render ───────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── page header ─────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t.journal.title}</h1>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.journal.addEntry}</span>
                </Button>
            </div>

            {/* ── entry grid ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries.map(entry => {
                    const badge = BADGE[entry.entry_type as EntryType] ?? BADGE.note
                    const imageCount = entry.journal_entry_images?.length || 0
                    return (
                        <Card
                            key={entry.id}
                            className="group cursor-pointer transition-all hover:shadow-md"
                            onClick={() => setViewingEntry(entry)}
                        >
                            <CardContent className="py-5 px-5">
                                {/* Row 1: badge + date + actions */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${badge}`}>
                                        {t.journal.entryTypes[entry.entry_type as EntryType] ?? entry.entry_type}
                                    </span>
                                    <div className="flex items-center gap-0.5 ml-2">
                                        <span className="text-xs text-muted-foreground">{fmtDate(entry.entry_date)}</span>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={e => { e.stopPropagation(); openEdit(entry) }}
                                            disabled={loadingId === entry.id}
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                                            onClick={e => { e.stopPropagation(); handleDelete(entry.id) }}
                                            disabled={loadingId === entry.id}
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Row 2: title */}
                                <h3 className="font-semibold text-base mb-2 line-clamp-2">{entry.title}</h3>

                                {/* Row 3: content preview */}
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{entry.content}</p>

                                {/* Row 4: related entities */}
                                {entry.flight_logs && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                        <PlaneIcon className="w-3 h-3 shrink-0" />
                                        <span>{fmtDate(entry.flight_logs.flight_date)}</span>
                                    </div>
                                )}
                                {entry.goals && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                        <GoalIcon className="w-3 h-3 shrink-0" />
                                        <span className="line-clamp-1">{entry.goals.title}</span>
                                    </div>
                                )}
                                {entry.user_aircrafts && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                        <PlaneIcon className="w-3 h-3 shrink-0" />
                                        <span>{entry.user_aircrafts.registration || entry.user_aircrafts.description}</span>
                                    </div>
                                )}

                                {/* Row 5: image count badge */}
                                {imageCount > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                        <ImageIcon className="w-3 h-3" />
                                        <span>{imageCount} {t.journal.imageCount}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}

                {entries.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>{t.journal.noEntries}</p>
                    </div>
                )}
            </div>

            {/* ── CREATE modal ────────────────────────────────── */}
            <Modal
                isOpen={isCreateOpen}
                onClose={closeCreate}
                title={t.journal.addEntry}
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <form onSubmit={handleCreate} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.journal.fields.title}</label>
                            <Input name="title" required placeholder={t.journal.fields.title} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.journal.fields.date}</label>
                            <Input type="date" name="entry_date" required defaultValue={todayISO()} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.journal.fields.entryType}</label>
                        <Select
                            name="entry_type"
                            options={entryTypeOptions}
                            value={createType}
                            onChange={e => setCreateType(e.target.value as EntryType)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.journal.fields.content}</label>
                        <textarea
                            name="content"
                            required
                            rows={6}
                            placeholder={`${t.journal.fields.content}...`}
                            className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.journal.fields.relatedFlight}</label>
                            <Select name="flight_log_id" options={flightLogOptions} defaultValue="" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.journal.fields.relatedGoal}</label>
                            <Select name="goal_id" options={goalOptions} defaultValue="" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.journal.fields.relatedAircraft}</label>
                            <Select name="aircraft_id" options={aircraftOptions} defaultValue="" />
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.journal.fields.images}</label>
                        {createPreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {createPreviews.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square">
                                        <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(idx, createImages, createPreviews, setCreateImages, setCreatePreviews)}
                                            className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {createImages.length < 3 ? (
                            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer border border-dashed border-border rounded-xl p-3 hover:border-primary hover:text-primary transition-colors">
                                <ImageIcon className="w-4 h-4" />
                                <span>{t.journal.addImage} ({createImages.length}/3)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={e => pickImages(e, createImages, createPreviews, 0, setCreateImages, setCreatePreviews)}
                                />
                            </label>
                        ) : (
                            <p className="text-xs text-muted-foreground">{t.journal.maxImages}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={closeCreate} disabled={isSubmitting}>
                            {t.common.cancel}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? t.common.loading : t.common.save}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── EDIT modal ──────────────────────────────────── */}
            <Modal
                isOpen={!!editingEntry}
                onClose={closeEdit}
                title={t.common.edit}
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {editingEntry && (
                    <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.journal.fields.title}</label>
                                <Input name="title" required defaultValue={editingEntry.title} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.journal.fields.date}</label>
                                <Input type="date" name="entry_date" required defaultValue={editingEntry.entry_date} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.journal.fields.entryType}</label>
                            <Select
                                name="entry_type"
                                options={entryTypeOptions}
                                value={editType}
                                onChange={e => setEditType(e.target.value as EntryType)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.journal.fields.content}</label>
                            <textarea
                                name="content"
                                required
                                rows={6}
                                defaultValue={editingEntry.content}
                                className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.journal.fields.relatedFlight}</label>
                                <Select name="flight_log_id" options={flightLogOptions} defaultValue={editingEntry.flight_log_id?.toString() || ''} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.journal.fields.relatedGoal}</label>
                                <Select name="goal_id" options={goalOptions} defaultValue={editingEntry.goal_id?.toString() || ''} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.journal.fields.relatedAircraft}</label>
                                <Select name="aircraft_id" options={aircraftOptions} defaultValue={editingEntry.aircraft_id?.toString() || ''} />
                            </div>
                        </div>

                        {/* Images (existing + new) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.journal.fields.images}</label>

                            {/* Existing images */}
                            {editExistingImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {editExistingImages.map((img: any) => (
                                        <div key={img.id} className="relative aspect-square">
                                            {img.signed_url && (
                                                <img src={img.signed_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setEditRemovedIds(prev => [...prev, img.id])}
                                                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* New image previews */}
                            {editNewPreviews.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {editNewPreviews.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square">
                                            <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(idx, editNewImages, editNewPreviews, setEditNewImages, setEditNewPreviews)}
                                                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add more */}
                            {(editExistingImages.length + editNewImages.length) < 3 ? (
                                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer border border-dashed border-border rounded-xl p-3 hover:border-primary hover:text-primary transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>{t.journal.addImage} ({editExistingImages.length + editNewImages.length}/3)</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={e => pickImages(e, editNewImages, editNewPreviews, editExistingImages.length, setEditNewImages, setEditNewPreviews)}
                                    />
                                </label>
                            ) : (
                                <p className="text-xs text-muted-foreground">{t.journal.maxImages}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={closeEdit} disabled={isSubmitting}>
                                {t.common.cancel}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t.common.loading : t.common.save}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ── DETAIL modal ────────────────────────────────── */}
            <Modal
                isOpen={!!viewingEntry}
                onClose={() => setViewingEntry(null)}
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {viewingEntry && (
                    <div className="space-y-5 mt-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 pr-8">
                            <div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${BADGE[viewingEntry.entry_type as EntryType] ?? BADGE.note}`}>
                                    {t.journal.entryTypes[viewingEntry.entry_type as EntryType] ?? viewingEntry.entry_type}
                                </span>
                                <h2 className="text-xl font-semibold mt-2 leading-tight">{viewingEntry.title}</h2>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap shrink-0">
                                <Calendar className="w-4 h-4" />
                                <span>{fmtDate(viewingEntry.entry_date)}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{viewingEntry.content}</p>

                        {/* Related entities */}
                        {(viewingEntry.flight_logs || viewingEntry.goals || viewingEntry.user_aircrafts) && (
                            <div className="border-t border-border pt-4 space-y-2">
                                {viewingEntry.flight_logs && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <PlaneIcon className="w-4 h-4 shrink-0" />
                                        <span>
                                            {t.journal.fields.relatedFlight}: {fmtDate(viewingEntry.flight_logs.flight_date)}
                                            {viewingEntry.flight_logs.duration_minutes ? ` (${fmtDuration(viewingEntry.flight_logs.duration_minutes)})` : ''}
                                        </span>
                                    </div>
                                )}
                                {viewingEntry.goals && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <GoalIcon className="w-4 h-4 shrink-0" />
                                        <span>{t.journal.fields.relatedGoal}: {viewingEntry.goals.title}</span>
                                    </div>
                                )}
                                {viewingEntry.user_aircrafts && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <PlaneIcon className="w-4 h-4 shrink-0" />
                                        <span>
                                            {t.journal.fields.relatedAircraft}: {viewingEntry.user_aircrafts.registration || viewingEntry.user_aircrafts.description}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Images */}
                        {viewingEntry.journal_entry_images?.length > 0 && (
                            <div className="border-t border-border pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {viewingEntry.journal_entry_images
                                        .filter((img: any) => img.signed_url)
                                        .map((img: any) => (
                                            <a key={img.id} href={img.signed_url} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={img.signed_url}
                                                    alt=""
                                                    className="w-full h-44 object-cover rounded-xl hover:opacity-90 transition-opacity"
                                                />
                                            </a>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 border-t border-border pt-4">
                            <Button
                                variant="outline"
                                onClick={() => { setViewingEntry(null); openEdit(viewingEntry) }}
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                {t.common.edit}
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => { setViewingEntry(null); handleDelete(viewingEntry.id) }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t.common.delete}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
