import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ALL_PROJECTS = '__all__'

type ProjectFilterProps = {
  projects: string[]
  project: string | null
  onChange: (project: string | null) => void
}

export function ProjectFilter({ projects, project, onChange }: ProjectFilterProps) {
  const items = [{ value: ALL_PROJECTS, label: 'Tous les projets' }, ...projects.map((name) => ({ value: name, label: name }))]
  return (
    <Select items={items} value={project ?? ALL_PROJECTS} onValueChange={(value) => onChange(!value || value === ALL_PROJECTS ? null : value)}>
      <SelectTrigger size="sm" className="min-w-40" aria-label="Projet">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
