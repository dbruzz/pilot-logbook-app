'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Goal, Plus, Pencil, Trash2, Star, Info } from 'lucide-react'
import { createGoal, updateGoal, deleteGoal, toggleFocusGoal } from './actions'

export default function GoalsClient({ initialGoals }: { initialGoals: any[] }) {
    const { t } = useTranslation()
    const [goals, setGoals] = useState(initialGoals)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState<any | null>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [selectedGoalType, setSelectedGoalType] = useState<string>('no_type')
    const [isHelpOpen, setIsHelpOpen] = useState(false)
    const [targetDays, setTargetDays] = useState(0)
    const [targetHours, setTargetHours] = useState(1)
    const [targetMins, setTargetMins] = useState(0)
    const helpRef = useRef<HTMLDivElement>(null)

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
        if (goal?.target_minutes) {
            const total = goal.target_minutes as number
            setTargetDays(Math.floor(total / 1440))
            setTargetHours(Math.floor((total % 1440) / 60))
            setTargetMins(total % 60)
        } else {
            setTargetDays(0)
            setTargetHours(1)
            setTargetMins(0)
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setEditingGoal(null)
        setIsModalOpen(false)
    }

    const onSubmit = async (formData: FormData) => {
        const totalMinutes = targetDays * 1440 + targetHours * 60 + targetMins
        if (totalMinutes <= 0) {
            alert(t.goals.targetTimeRequired)
            return
        }
        formData.set('target_minutes', String(totalMinutes))
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

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return `${h}h ${m}m`
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
                                {goal.goal_type && goal.goal_type !== 'no_type' && (
                                    <span className="text-xs text-muted-foreground">
                                        {goal.goal_type === 'other'
                                            ? (goal.custom_goal_type || t.goals.goalTypes.other)
                                            : (t.goals.goalTypes[goal.goal_type as keyof typeof t.goals.goalTypes] ?? goal.goal_type)
                                        }
                                    </span>
                                )}
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
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm font-medium">
                                        {formatDuration(goal.progress)} / {formatDuration(goal.target_minutes)}
                                    </span>
                                    <span className="text-sm font-bold text-primary">
                                        {Math.round((goal.progress / goal.target_minutes) * 100)}%
                                    </span>
                                </div>
                                <ProgressBar value={goal.progress} max={goal.target_minutes} />
                                {(goal.start_date || goal.end_date) && (
                                    <p className="text-xs text-muted-foreground mt-3 flex justify-between">
                                        <span>{goal.start_date || '...'}</span>
                                        <span>{goal.end_date || '...'}</span>
                                    </p>
                                )}
                            </div>
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

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingGoal ? t.common.edit : t.goals.addGoal}
            >
                <form action={onSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input name="title" required defaultValue={editingGoal?.title} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input name="description" defaultValue={editingGoal?.description || ''} />
                    </div>
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
