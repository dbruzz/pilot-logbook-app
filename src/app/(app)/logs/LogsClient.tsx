'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, Pencil, Calendar, Plane as PlaneIcon, MapPin, Clock } from 'lucide-react'
import { createLog, deleteLog, updateLog } from './actions'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

export default function LogsClient({
    initialLogs,
    aircrafts
}: {
    initialLogs: any[]
    aircrafts: any[]
}) {
    const { t, language } = useTranslation()
    const dateLocale = language === 'es' ? es : enUS

    const [logs, setLogs] = useState(initialLogs)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLog, setEditingLog] = useState<any>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const onSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        await createLog(formData)
        window.location.reload()
    }

    const handleDelete = async (id: number) => {
        if (!confirm(t.common.delete + '?')) return
        setLoadingId(id)
        await deleteLog(id)
        window.location.reload()
    }

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return `${h}h ${m}m`
    }

    const formatToInputTime = (minutes: number) => {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0')
        const m = (minutes % 60).toString().padStart(2, '0')
        return `${h}:${m}`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.logs.title}</h1>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.logs.addLog}</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {logs.map(log => (
                    <Card key={log.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditingLog(log)}
                                disabled={loadingId === log.id}
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(log.id)}
                                disabled={loadingId === log.id}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4 pr-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-primary font-medium">
                                        <Calendar className="w-4 h-4" />
                                        <span>{format(new Date(log.flight_date), 'dd MMM yyyy', { locale: dateLocale })}</span>
                                    </div>
                                    {log.user_aircrafts && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <PlaneIcon className="w-4 h-4" />
                                            <span>{log.user_aircrafts.registration || log.user_aircrafts.description}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold">{formatDuration(log.duration_minutes)}</span>
                                    {log.is_instruction && (
                                        <span className="block text-[10px] uppercase font-bold text-accent-foreground bg-accent px-2 py-0.5 rounded-full mt-1">
                                            Instruction
                                        </span>
                                    )}
                                </div>
                            </div>

                            {(log.from_location || log.to_location) && (
                                <div className="flex items-center justify-between text-sm bg-secondary/50 p-2.5 rounded-lg mb-3">
                                    <div className="flex items-center gap-2 font-medium">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span>{log.from_location || '?'}</span>
                                    </div>
                                    <div className="text-muted-foreground">→</div>
                                    <div className="flex items-center gap-2 font-medium">
                                        <span>{log.to_location || '?'}</span>
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            )}

                            {log.notes && (
                                <p className="text-sm text-muted-foreground line-clamp-2 italic">
                                    "{log.notes}"
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {logs.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-2xl">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No flight logs yet.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => !isSubmitting && setIsModalOpen(false)}
                title={t.logs.addLog}
            >
                <form action={onSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.date}</label>
                            <Input type="date" name="flight_date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.duration}</label>
                            <Input type="time" name="duration" required defaultValue="01:00" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.logs.aircraft}</label>
                        <Select
                            name="aircraft_id"
                            options={aircrafts.map(a => ({ value: a.id.toString(), label: a.registration ? `${a.registration} (${a.description})` : a.description }))}
                            placeholder="Select Aircraft (Optional)"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.from}</label>
                            <Input name="from_location" placeholder="e.g. KJFK" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.to}</label>
                            <Input name="to_location" placeholder="e.g. EGLL" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.logs.notes}</label>
                        <Input name="notes" placeholder="Remarks..." />
                    </div>

                    <div className="flex items-center gap-2 pt-2 pb-2">
                        <input
                            type="checkbox"
                            id="is_instruction"
                            name="is_instruction"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_instruction" className="text-sm font-medium">
                            {t.logs.isInstruction}
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                            {t.common.cancel}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? t.common.loading : t.common.save}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!editingLog}
                onClose={() => !isSubmitting && setEditingLog(null)}
                title={t.common?.edit || 'Edit Log'}
            >
                {editingLog && (
                    <form action={async (formData) => {
                        setIsSubmitting(true)
                        await updateLog(editingLog.id, formData)
                        setEditingLog(null)
                        window.location.reload()
                    }} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.logs.date}</label>
                                <Input type="date" name="flight_date" required defaultValue={new Date(editingLog.flight_date).toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.logs.duration}</label>
                                <Input type="time" name="duration" required defaultValue={formatToInputTime(editingLog.duration_minutes)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.aircraft}</label>
                            <Select
                                name="aircraft_id"
                                options={aircrafts.map(a => ({ value: a.id.toString(), label: a.registration ? `${a.registration} (${a.description})` : a.description }))}
                                placeholder="Select Aircraft (Optional)"
                                defaultValue={editingLog.aircraft_id?.toString() || ''}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.logs.from}</label>
                                <Input name="from_location" placeholder="e.g. KJFK" defaultValue={editingLog.from_location || ''} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.logs.to}</label>
                                <Input name="to_location" placeholder="e.g. EGLL" defaultValue={editingLog.to_location || ''} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.notes}</label>
                            <Input name="notes" placeholder="Remarks..." defaultValue={editingLog.notes || ''} />
                        </div>

                        <div className="flex items-center gap-2 pt-2 pb-2">
                            <input
                                type="checkbox"
                                id="is_instruction_edit"
                                name="is_instruction"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                defaultChecked={editingLog.is_instruction}
                            />
                            <label htmlFor="is_instruction_edit" className="text-sm font-medium">
                                {t.logs.isInstruction}
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditingLog(null)} disabled={isSubmitting}>
                                {t.common?.cancel || 'Cancel'}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t.common?.loading || 'Loading...' : t.common?.save || 'Save'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    )
}
