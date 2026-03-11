'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Goal, Plus, Pencil, Trash2, Star } from 'lucide-react'
import { createGoal, updateGoal, deleteGoal, setFocusGoal } from './actions'

export default function GoalsClient({ initialGoals }: { initialGoals: any[] }) {
    const { t } = useTranslation()
    const [goals, setGoals] = useState(initialGoals)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState<any | null>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)

    const handleOpenModal = (goal: any = null) => {
        setEditingGoal(goal)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setEditingGoal(null)
        setIsModalOpen(false)
    }

    const onSubmit = async (formData: FormData) => {
        if (editingGoal) {
            formData.append('status_id', '1') // Keep active for simplicity in MVP
            await updateGoal(editingGoal.id, formData)
        } else {
            await createGoal(formData)
        }
        // Simple optimistic reload by refetching window or letting server action replace router
        window.location.reload()
    }

    const handleDelete = async (id: number) => {
        if (!confirm(t.common.delete + '?')) return
        setLoadingId(id)
        await deleteGoal(id)
        window.location.reload()
    }

    const handleSetFocus = async (id: number) => {
        setLoadingId(id)
        await setFocusGoal(id)
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
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.goals.title}</h1>
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
                            </div>
                            <div className="flex shrink-0 gap-1">
                                {!goal.is_focus && goal.status_id === 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title={t.goals.setFocus}
                                        onClick={() => handleSetFocus(goal.id)}
                                        disabled={loadingId === goal.id}
                                    >
                                        <Goal className="w-4 h-4 text-muted-foreground hover:text-primary" />
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
                        <label className="text-sm font-medium">{t.goals.targetMinutes}</label>
                        <Input type="number" name="target_minutes" required defaultValue={editingGoal?.target_minutes} min="1" />
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
