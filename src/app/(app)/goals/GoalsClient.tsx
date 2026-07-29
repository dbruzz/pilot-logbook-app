'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Goal, Plus, Pencil, Trash2, Star, Info, Ruler, Hash } from 'lucide-react'
import { createGoal, updateGoal, deleteGoal, toggleFocusGoal } from './actions'
import { formatDuration, formatDistance } from '@/lib/format'
import { useDisplayPreferences } from '@/hooks/use-display-preferences'

export default function GoalsClient({
    initialGoals,
    distanceUnit,
}: {
    initialGoals: any[]
    distanceUnit: 'km' | 'nm' | 'mi'
}) {
    const { t } = useTranslation()
    const { durationFormat } = useDisplayPreferences()

    const [goals] = useState(initialGoals)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState<any | null>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [selectedGoalType, setSelectedGoalType] = useState<string>('no_type')
    const [isHelpOpen, setIsHelpOpen] = useState(false)
    const helpRef = useRef<HTMLDivElement>(null)

    // ── Objective type state ──────────────────────────────────────────
    const [objectiveType, setObjectiveType] = useState<'time' | 'distance' | 'flight_count'>('time')

    // ── Time target state ─────────────────────────────────────────────
    const [targetDays, setTargetDays] = useState(0)
    const [targetHours, setTargetHours] = useState(1)
    const [targetMins, setTargetMins] = useState(0)

    // ── Distance target state ─────────────────────────────────────────
    const [targetDistance, setTargetDistance] = useState<string>('')

    // ── Flight count target state ─────────────────────────────────────
    const [targetFlightCount, setTargetFlightCount] = useState<string>('')

    useEffect(() => {
        if (!isHelpOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
                setIsHelpOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isHelpOpen])

    const handleOpenModal = (goal: any = null) => {
        setEditingGoal(goal)
        setSelectedGoalType(goal?.goal_type ?? 'no_type')

        const objType = (goal?.objective_type as 'time' | 'distance' | 'flight_count') ?? 'time'
        setObjectiveType(objType)

        if (objType === 'distance') {
            setTargetDistance(String(goal?.target_distance ?? ''))
            setTargetFlightCount('')
            setTargetDays(0); setTargetHours(1); setTargetMins(0)
        } else if (objType === 'flight_count') {
            setTargetFlightCount(String(goal?.target_flight_count ?? ''))
            setTargetDistance('')
            setTargetDays(0); setTargetHours(1); setTargetMins(0)
        } else {
            setTargetDistance('')
            setTargetFlightCount('')
            if (goal?.target_minutes) {
                const total = goal.target_minutes as number
                setTargetDays(Math.floor(total / 1440))
                setTargetHours(Math.floor((total % 1440) / 60))
                setTargetMins(total % 60)
            } else {
                setTargetDays(0); setTargetHours(1); setTargetMins(0)
            }
        }

        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setEditingGoal(null)
        setIsModalOpen(false)
    }

    const onSubmit = async (formData: FormData) => {
        formData.set('objective_type', objectiveType)

        if (objectiveType === 'distance') {
            const dist = parseFloat(targetDistance)
            if (!dist || dist <= 0) {
                alert(t.goals.targetDistanceRequired)
                return
            }
            formData.set('target_distance', String(dist))
            formData.set('target_distance_unit', distanceUnit)
            formData.set('target_minutes', '0')
            formData.set('target_flight_count', '0')
        } else if (objectiveType === 'flight_count') {
            const count = parseInt(targetFlightCount)
            if (!count || count <= 0) {
                alert(t.goals.targetFlightCountRequired)
                return
            }
            formData.set('target_flight_count', String(count))
            formData.set('target_minutes', '0')
        } else {
            const totalMinutes = targetDays * 1440 + targetHours * 60 + targetMins
            if (totalMinutes <= 0) {
                alert(t.goals.targetTimeRequired)
                return
            }
            formData.set('target_minutes', String(totalMinutes))
            formData.set('target_flight_count', '0')
        }

        if (editingGoal) {
            formData.append('status_id', '1')
            await updateGoal(editingGoal.id, formData)
        } else {
            await createGoal(formData)
        }
        window.location.reload()
    }

    const handleDelete = async (id: number) => {
        if (!confirm(t.common.delete + '?')) return
        setLoadingId(id)
        await deleteGoal(id)
        window.location.reload()
    }

    const handleToggleFocus = async (id: number) => {
        setLoadingId(id)
        await toggleFocusGoal(id)
        window.location.reload()
    }

    // ── Display helpers ───────────────────────────────────────────────

    const renderProgress = (goal: any) => {
        if (goal.objective_type === 'distance') {
            const unit = (goal.target_distance_unit || distanceUnit) as 'km' | 'nm' | 'mi'
            const pct = goal.target_distance > 0
                ? Math.round((goal.progress / goal.target_distance) * 100)
                : 0
            return (
                <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatDistance(goal.progress, unit)}
                            {' / '}
                            {formatDistance(goal.target_distance, unit)}
                        </span>
                        <span className="text-sm font-bold text-primary">{pct}%</span>
                    </div>
                    <ProgressBar value={goal.progress} max={goal.target_distance || 1} />
                </div>
            )
        }

        if (goal.objective_type === 'flight_count') {
            const target = goal.target_flight_count || 0
            const pct = target > 0 ? Math.round((goal.progress / target) * 100) : 0
            return (
                <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                            {goal.progress} / {target}
                        </span>
                        <span className="text-sm font-bold text-primary">{pct}%</span>
                    </div>
                    <ProgressBar value={goal.progress} max={target || 1} />
                </div>
            )
        }

        // Time goal (default)
        const pct = goal.target_minutes > 0
            ? Math.round((goal.progress / goal.target_minutes) * 100)
            : 0
        return (
            <div className="mt-2 space-y-2">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium">
                        {formatDuration(goal.progress, durationFormat)}
                        {' / '}
                        {formatDuration(goal.target_minutes, durationFormat)}
                    </span>
                    <span className="text-sm font-bold text-primary">{pct}%</span>
                </div>
                <ProgressBar value={goal.progress} max={goal.target_minutes} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{t.goals.title}</h1>
                    <div ref={helpRef} className="relative">
                        <button
                            type="button"
                            aria-label={t.goals.helpLabel}
                            title={t.goals.helpLabel}
                            onClick={() => setIsHelpOpen(o => !o)}
                            className="flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                        {isHelpOpen && (
                            <div className="absolute left-0 top-8 z-50 w-72 sm:w-80 rounded-xl border border-border bg-card shadow-lg p-4 space-y-3">
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <Star className="w-4 h-4 shrink-0 mt-0.5 text-primary fill-primary" />
                                    <span>{t.goals.help.star}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <Goal className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{t.goals.help.primary}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.goals.addGoal}</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {goals.map(goal => (
                    <Card key={goal.id} className={goal.is_focus ? "border-primary/50 shadow-md shadow-primary/10" : ""}>
                        <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                            <div className="space-y-1 pr-4">
                                <CardTitle className="flex items-center gap-2">
                                    {goal.is_focus && <Star className="w-4 h-4 text-primary fill-primary" />}
                                    {goal.title}
                                </CardTitle>
                                {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Objective type badge */}
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {goal.objective_type === 'distance'
                                            ? <><Ruler className="w-3 h-3" />{t.goals.objectiveTypes.distance}</>
                                            : goal.objective_type === 'flight_count'
                                                ? <><Hash className="w-3 h-3" />{t.goals.objectiveTypes.flight_count}</>
                                                : t.goals.objectiveTypes.time
                                        }
                                    </span>
                                    {/* Goal type label */}
                                    {goal.goal_type && goal.goal_type !== 'no_type' && (
                                        <span className="text-xs text-muted-foreground">
                                            {goal.goal_type === 'other'
                                                ? (goal.custom_goal_type || t.goals.goalTypes.other)
                                                : (t.goals.goalTypes[goal.goal_type as keyof typeof t.goals.goalTypes] ?? goal.goal_type)
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex shrink-0 gap-1">
                                {goal.status_id === 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title={goal.is_focus ? t.goals.unsetFocus : t.goals.setFocus}
                                        onClick={() => handleToggleFocus(goal.id)}
                                        disabled={loadingId === goal.id}
                                    >
                                        {goal.is_focus
                                            ? <Star className="w-4 h-4 text-primary fill-primary" />
                                            : <Goal className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                        }
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenModal(goal)}
                                >
                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(goal.id)}
                                    disabled={loadingId === goal.id}
                                    className="hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {renderProgress(goal)}
                            {(goal.start_date || goal.end_date) && (
                                <p className="text-xs text-muted-foreground mt-3 flex justify-between">
                                    <span>{goal.start_date || '...'}</span>
                                    <span>{goal.end_date || '...'}</span>
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {goals.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        <Goal className="w-12 h-12 mb-4 opacity-20" />
                        <p>{t.goals.noGoals}</p>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Modal ── */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingGoal ? t.common.edit : t.goals.addGoal}
            >
                <form action={onSubmit} className="space-y-4 mt-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input name="title" required defaultValue={editingGoal?.title} />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input name="description" defaultValue={editingGoal?.description || ''} />
                    </div>

                    {/* Goal type (aeronautical category) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.goals.goalType}</label>
                        <Select
                            name="goal_type"
                            value={selectedGoalType}
                            onChange={e => setSelectedGoalType(e.target.value)}
                            options={[
                                { value: 'no_type', label: t.goals.goalTypes.no_type },
                                { value: 'flight_hours', label: t.goals.goalTypes.flight_hours },
                                { value: 'tow_launches', label: t.goals.goalTypes.tow_launches },
                                { value: 'distance', label: t.goals.goalTypes.distance },
                                { value: 'landings', label: t.goals.goalTypes.landings },
                                { value: 'number_of_flights', label: t.goals.goalTypes.number_of_flights },
                                { value: 'solo_flights', label: t.goals.goalTypes.solo_flights },
                                { value: 'cross_country', label: t.goals.goalTypes.cross_country },
                                { value: 'other', label: t.goals.goalTypes.other },
                            ]}
                        />
                    </div>
                    {selectedGoalType === 'other' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.goals.goalTypeCustom}</label>
                            <Input
                                name="custom_goal_type"
                                defaultValue={editingGoal?.custom_goal_type || ''}
                                placeholder={t.goals.goalTypeCustom}
                            />
                        </div>
                    )}

                    {/* ── Objective type selector ── */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.goals.objectiveType}</label>
                        <div className="flex items-center bg-secondary rounded-lg p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setObjectiveType('time')}
                                className={[
                                    'flex-1 text-sm font-medium px-3 py-1.5 rounded-md transition-all',
                                    objectiveType === 'time'
                                        ? 'bg-background shadow text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                ].join(' ')}
                            >
                                {t.goals.objectiveTypes.time}
                            </button>
                            <button
                                type="button"
                                onClick={() => setObjectiveType('distance')}
                                className={[
                                    'flex-1 text-sm font-medium px-3 py-1.5 rounded-md transition-all',
                                    objectiveType === 'distance'
                                        ? 'bg-background shadow text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                ].join(' ')}
                            >
                                {t.goals.objectiveTypes.distance}
                            </button>
                            <button
                                type="button"
                                onClick={() => setObjectiveType('flight_count')}
                                className={[
                                    'flex-1 text-sm font-medium px-3 py-1.5 rounded-md transition-all',
                                    objectiveType === 'flight_count'
                                        ? 'bg-background shadow text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                ].join(' ')}
                            >
                                {t.goals.objectiveTypes.flight_count}
                            </button>
                        </div>
                    </div>

                    {/* ── Conditional target inputs ── */}
                    {objectiveType === 'time' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.goals.targetTime}</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">{t.goals.days}</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={targetDays}
                                        onChange={e => setTargetDays(Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">{t.goals.hours}</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={targetHours}
                                        onChange={e => setTargetHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">{t.goals.minutes}</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={59}
                                        value={targetMins}
                                        onChange={e => setTargetMins(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : objectiveType === 'distance' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.goals.targetDistance}
                                {' '}
                                <span className="text-xs text-muted-foreground font-normal">
                                    ({distanceUnit === 'nm' ? 'NM' : distanceUnit})
                                </span>
                            </label>
                            <Input
                                type="number"
                                min={0}
                                step="any"
                                placeholder="0"
                                value={targetDistance}
                                onChange={e => setTargetDistance(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.goals.targetFlightCount}</label>
                            <Input
                                type="number"
                                min={1}
                                step={1}
                                placeholder="0"
                                value={targetFlightCount}
                                onChange={e => setTargetFlightCount(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date (Optional)</label>
                            <Input type="date" name="start_date" defaultValue={editingGoal?.start_date || ''} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date (Optional)</label>
                            <Input type="date" name="end_date" defaultValue={editingGoal?.end_date || ''} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            {t.common.cancel}
                        </Button>
                        <Button type="submit">
                            {t.common.save}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
