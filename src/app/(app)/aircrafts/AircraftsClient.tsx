'use client'

import { useTranslation } from '@/hooks/use-translation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Plane, Plus, Trash2, Pencil } from 'lucide-react'
import { useState } from 'react'
import { createAircraft, deleteAircraft, updateAircraft } from './actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    const { t } = useTranslation()
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? t.common.loading : t.common.save}
        </Button>
    )
}

interface AircraftsClientProps {
    initialAircrafts: any[]
    categories: any[]
}

export default function AircraftsClient({ initialAircrafts, categories }: AircraftsClientProps) {
    const { t } = useTranslation()
    const [isAdding, setIsAdding] = useState(false)
    const [editingAircraft, setEditingAircraft] = useState<any>(null)
    const [aircrafts, setAircrafts] = useState(initialAircrafts)

    const handleDelete = async (id: number) => {
        if (!confirm(t.common.delete + '?')) return
        await deleteAircraft(id)
        setAircrafts(aircrafts.filter(a => a.id !== id))
    }

    const categoryOptions = categories.map(c => ({
        value: c.id.toString(),
        label: c.description
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.aircrafts.title}</h1>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t.aircrafts.addAircraft}
                </Button>
            </div>

            {isAdding && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>{t.aircrafts.addAircraft}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={async (formData) => {
                            await createAircraft(formData)
                            setIsAdding(false)
                            window.location.reload()
                        }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t.aircrafts.description}</label>
                                    <Input name="description" required placeholder="Cessna 152 / My Plane" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t.aircrafts.registration}</label>
                                    <Input name="registration" placeholder="LV-ABC" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t.aircrafts.model}</label>
                                    <Input name="model" placeholder="C152" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t.aircrafts.category}</label>
                                    <Select name="aircraft_category_id" options={categoryOptions} className="appearance-none" required />
                                </div>
                            </div>
                            <SubmitButton />
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aircrafts.length > 0 ? aircrafts.map(aircraft => (
                    <Card key={aircraft.id} className="group relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                        <Plane className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{aircraft.description}</CardTitle>
                                        <CardDescription>{aircraft.aircrafts_categories?.description}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => setEditingAircraft(aircraft)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(aircraft.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1 text-sm bg-secondary/20 p-3 rounded-lg">
                                {aircraft.registration && (
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{t.aircrafts.registration}:</span>
                                        <span className="font-medium text-foreground">{aircraft.registration}</span>
                                    </div>
                                )}
                                {aircraft.model && (
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{t.aircrafts.model}:</span>
                                        <span className="font-medium text-foreground">{aircraft.model}</span>
                                    </div>
                                )}
                                {!aircraft.registration && !aircraft.model && (
                                    <div className="text-muted-foreground italic">No extra details</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        <Plane className="w-12 h-12 mb-4 opacity-20" />
                        <p>{t.aircrafts.noAircrafts}</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!editingAircraft}
                onClose={() => setEditingAircraft(null)}
                title={t.common?.edit || 'Edit Aircraft'}
            >
                {editingAircraft && (
                    <form action={async (formData) => {
                        await updateAircraft(editingAircraft.id, formData)
                        setEditingAircraft(null)
                        window.location.reload()
                    }} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.aircrafts.description}</label>
                                <Input name="description" required defaultValue={editingAircraft.description} placeholder="Cessna 152 / My Plane" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.aircrafts.registration}</label>
                                <Input name="registration" defaultValue={editingAircraft.registration || ''} placeholder="LV-ABC" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.aircrafts.model}</label>
                                <Input name="model" defaultValue={editingAircraft.model || ''} placeholder="C152" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.aircrafts.category}</label>
                                <Select name="aircraft_category_id" options={categoryOptions} defaultValue={editingAircraft.aircraft_category_id?.toString()} className="appearance-none" required />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditingAircraft(null)}>
                                {t.common?.cancel || 'Cancel'}
                            </Button>
                            <SubmitButton />
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    )
}
