'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, Pencil, Calendar, Plane as PlaneIcon, MapPin, Clock, Ruler } from 'lucide-react'
import { createLog, deleteLog, updateLog } from './actions'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

export default function LogsClient({
    initialLogs,
    aircrafts,
    activeGoals,
    logGoals,
}: {
    initialLogs: any[]
    aircrafts: any[]
    activeGoals: { id: number; title: string }[]
    logGoals: { flight_log_id: number; goal_id: number }[]
}) {
    const { t, language } = useTranslation()
    const dateLocale = language === 'es' ? es : enUS

    // Build a Set lookup: logId -> Set<goalId>
    const logGoalMap = new Map<number, Set<number>>()
    for (const { flight_log_id, goal_id } of logGoals) {
        if (!logGoalMap.has(flight_log_id)) logGoalMap.set(flight_log_id, new Set())
        logGoalMap.get(flight_log_id)!.add(goal_id)
    }

    const [logs, setLogs] = useState(initialLogs)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLog, setEditingLog] = useState<any>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [createFlightType, setCreateFlightType] = useState('no_type')
    const [editFlightType, setEditFlightType] = useState('no_type')

    const onSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        await createLog(formData)
        setCreateFlightType('no_type')
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {logs.map(log => (
                    <Card key={log.id} className="group transition-all hover:shadow-md">
                        <CardContent className="py-6 px-6">
                            {/* Row 1: Date + Action icons */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-primary font-medium">
                                    <Calendar className="w-4 h-4 shrink-0" />
                                    <span>{format(new Date(log.flight_date), 'dd MMM yyyy', { locale: dateLocale })}</span>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            const ft = log.flight_type ?? (log.is_instruction ? 'instruction' : 'no_type')
                                            setEditFlightType(ft)
                                            setEditingLog(log)
                                        }}
                                        disabled={loadingId === log.id}
                                    >
                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(log.id)}
                                        disabled={loadingId === log.id}
                                        className="hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>

                            {/* Row 2: Aircraft + Duration */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {log.user_aircrafts ? (
                                        <>
                                            <PlaneIcon className="w-4 h-4 shrink-0" />
                                            <span>{log.user_aircrafts.registration || log.user_aircrafts.description}</span>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground/40">—</span>
                                    )}
                                </div>
                                <span className="text-xl font-bold">{formatDuration(log.duration_minutes)}</span>
                            </div>

                            {/* Row 3: Flight type badge */}
                            {((log.flight_type && log.flight_type !== 'no_type') || log.is_instruction) && (
                                <div className="mb-3">
                                    <span className="inline-block text-[10px] uppercase font-bold text-accent-foreground bg-accent px-2 py-0.5 rounded-full">
                                        {log.flight_type === 'other'
                                            ? (log.custom_flight_type || t.logs.flightTypes.other)
                                            : log.flight_type && log.flight_type !== 'no_type'
                                                ? (t.logs.flightTypes[log.flight_type as keyof typeof t.logs.flightTypes] ?? log.flight_type)
                                                : t.logs.flightTypes.instruction
                                        }
                                    </span>
                                </div>
                            )}


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

                            {log.distance_value && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                    <Ruler className="w-4 h-4 shrink-0" />
                                    <span>{log.distance_value} {log.distance_unit?.toUpperCase()}</span>
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
                    //<div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-2xl">
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>{t.logs.noLogs}</p>
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.logs.distance}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="number"
                                name="distance_value"
                                min={0}
                                step="any"
                                placeholder="0"
                            />
                            <Select
                                name="distance_unit"
                                options={[
                                    { value: 'km', label: t.logs.distanceUnits.km },
                                    { value: 'nm', label: t.logs.distanceUnits.nm },
                                    { value: 'mi', label: t.logs.distanceUnits.mi },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.logs.associatedGoals}</label>
                        {activeGoals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t.logs.noActiveGoals}</p>
                        ) : (
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                {activeGoals.map(goal => (
                                    <label key={goal.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="goal_ids"
                                            value={goal.id.toString()}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm">{goal.title}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.logs.flightType}</label>
                        <Select
                            name="flight_type"
                            value={createFlightType}
                            onChange={e => setCreateFlightType(e.target.value)}
                            options={[
                                { value: 'no_type', label: t.logs.flightTypes.no_type },
                                { value: 'instruction', label: t.logs.flightTypes.instruction },
                                { value: 'solo', label: t.logs.flightTypes.solo },
                                { value: 'cross_country', label: t.logs.flightTypes.cross_country },
                                { value: 'tow', label: t.logs.flightTypes.tow },
                                { value: 'training', label: t.logs.flightTypes.training },
                                { value: 'other', label: t.logs.flightTypes.other },
                            ]}
                        />
                    </div>
                    {createFlightType === 'other' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.flightTypeCustom}</label>
                            <Input name="custom_flight_type" placeholder={t.logs.flightTypeCustom} />
                        </div>
                    )}

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

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.distance}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    type="number"
                                    name="distance_value"
                                    min={0}
                                    step="any"
                                    placeholder="0"
                                    defaultValue={editingLog.distance_value ?? ''}
                                />
                                <Select
                                    name="distance_unit"
                                    defaultValue={editingLog.distance_unit || 'km'}
                                    options={[
                                        { value: 'km', label: t.logs.distanceUnits.km },
                                        { value: 'nm', label: t.logs.distanceUnits.nm },
                                        { value: 'mi', label: t.logs.distanceUnits.mi },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.associatedGoals}</label>
                            {activeGoals.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t.logs.noActiveGoals}</p>
                            ) : (
                                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                    {activeGoals.map(goal => (
                                        <label key={goal.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="goal_ids"
                                                value={goal.id.toString()}
                                                defaultChecked={!!logGoalMap.get(editingLog.id)?.has(goal.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm">{goal.title}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.logs.flightType}</label>
                            <Select
                                name="flight_type"
                                value={editFlightType}
                                onChange={e => setEditFlightType(e.target.value)}
                                options={[
                                    { value: 'no_type', label: t.logs.flightTypes.no_type },
                                    { value: 'instruction', label: t.logs.flightTypes.instruction },
                                    { value: 'solo', label: t.logs.flightTypes.solo },
                                    { value: 'cross_country', label: t.logs.flightTypes.cross_country },
                                    { value: 'tow', label: t.logs.flightTypes.tow },
                                    { value: 'training', label: t.logs.flightTypes.training },
                                    { value: 'other', label: t.logs.flightTypes.other },
                                ]}
                            />
                        </div>
                        {editFlightType === 'other' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.logs.flightTypeCustom}</label>
                                <Input
                                    name="custom_flight_type"
                                    defaultValue={editingLog.custom_flight_type || ''}
                                    placeholder={t.logs.flightTypeCustom}
                                />
                            </div>
                        )}

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
