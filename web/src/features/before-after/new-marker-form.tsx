import { Plus } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { ProjectFilter } from '@/app/project-filter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateMarkerMutation } from '@/hooks/use-create-marker-mutation'

function localDateTimeInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

type NewMarkerFormProps = {
  projects: string[]
  defaultProject: string | null
  labelSuggestions: string[]
}

export function NewMarkerForm({ projects, defaultProject, labelSuggestions }: NewMarkerFormProps) {
  const createMarker = useCreateMarkerMutation()
  const [label, setLabel] = useState('')
  const [dateTime, setDateTime] = useState(() => localDateTimeInputValue(new Date()))
  const [project, setProject] = useState<string | null>(defaultProject)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    createMarker.mutate({ label, at: new Date(dateTime).getTime(), project }, { onSuccess: () => setLabel('') })
  }
  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="marker-label">Ce que tu as changé</Label>
          <Input
            id="marker-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ex. : connecteurs Figma, Notion et AWS désactivés"
            list="marker-label-suggestions"
            required
          />
          <datalist id="marker-label-suggestions">
            {labelSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="marker-date">Depuis le</Label>
          <Input id="marker-date" type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label>Périmètre</Label>
          <ProjectFilter projects={projects} project={project} onChange={setProject} />
        </div>
        <Button type="submit" disabled={createMarker.isPending || !label.trim()}>
          <Plus />
          Ajouter
        </Button>
      </div>
      {createMarker.isError && <p className="text-sm text-destructive">{createMarker.error.message}</p>}
    </form>
  )
}
